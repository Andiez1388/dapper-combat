// Máy chủ email giả cho bộ kiểm tra: nhận thư qua SMTP (không gửi đi đâu), lưu lại để kiểm tra tiêu đề / nội dung
const net = require('net');

function start() {
  const mails = [];
  const server = net.createServer(sock => {
    let buf = '', data = null, mail = { from: '', to: [], raw: '' };
    const say = s => sock.write(s + '\r\n');
    say('220 dc-test SMTP');
    sock.on('data', chunk => {
      buf += chunk.toString('utf8');
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 2);
        if (data !== null) {
          if (line === '.') { mail.raw = data.join('\n'); mails.push(parse(mail)); mail = { from: '', to: [], raw: '' }; data = null; say('250 OK'); }
          else data.push(line.startsWith('..') ? line.slice(1) : line);
          continue;
        }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO' || cmd === 'HELO') say('250 dc-test');
        else if (cmd === 'MAIL') { mail.from = line; say('250 OK'); }
        else if (cmd === 'RCPT') { mail.to.push(line.replace(/^RCPT TO:\s*/i, '').replace(/[<>]/g, '')); say('250 OK'); }
        else if (cmd === 'DATA') { data = []; say('354 End with .'); }
        else if (cmd === 'QUIT') { say('221 Bye'); sock.end(); }
        else say('250 OK');
      }
    });
    sock.on('error', () => {});
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ port: server.address().port, mails, close: () => new Promise(r => server.close(r)) })));
}

// tiêu đề (giải mã =?UTF-8?B?…?= / =?UTF-8?Q?…?=) + phần chữ thường (text/plain, quoted-printable hoặc base64)
function parse(m) {
  const raw = m.raw.replace(/\r/g, '');
  const head = raw.split('\n\n')[0].replace(/\n[ \t]+/g, ' ');
  const words = s => s.replace(/=\?utf-8\?([bq])\?([^?]*)\?=/gi, (x, enc, txt) => (enc.toLowerCase() === 'b' ? Buffer.from(txt, 'base64').toString('utf8')
    : Buffer.from(txt.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (y, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8'))).replace(/\?=\s+=\?/g, '');
  const subject = words(((head.match(/^Subject: (.*)$/mi) || [])[1] || '')).replace(/\s{2,}/g, ' ');
  let text = '';
  const part = raw.match(/Content-Type: text\/plain[\s\S]*?\n\n([\s\S]*?)(\n--|$)/i);
  if (part) {
    const enc = (raw.slice(0, part.index + 300).match(/Content-Transfer-Encoding: (\S+)/gi) || []).pop() || '';
    let body = part[1];
    if (/base64/i.test(enc)) body = Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8');
    else if (/quoted-printable/i.test(enc)) body = Buffer.from(body.replace(/=\n/g, '').replace(/=([0-9A-F]{2})/gi, (y, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8');
    text = body;
  }
  return { to: m.to, subject, text };
}

module.exports = { start };
