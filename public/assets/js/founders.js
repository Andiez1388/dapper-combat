/* Câu chuyện Founders: hiện dần từng chương khi cuộn tới + thanh tiến độ đọc */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('fd-js');
  var items = document.querySelectorAll('[data-fd-reveal]');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add('in'); });
  var bar = document.querySelector('.fd-progress i'), raf = 0;
  function upd() {
    raf = 0; if (!bar) return;
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
  }
  addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  upd();
})();
