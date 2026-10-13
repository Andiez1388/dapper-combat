require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' })); // allow base64 images
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

app.use('/api', require('./routes/api'));

// SPA fallback — serve index.html for non-API, non-asset routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🥊  DAPPER COMBAT  →  http://localhost:${PORT}`);
  console.log(`⚙️   Admin panel   →  http://localhost:${PORT}/admin.html`);
  console.log(`     Default admin: admin@dappercombat.com / admin123\n`);
});
