/* Utilitas bersama untuk website utama dan halaman admin */
(function () {
  var U = {};

  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Tanggal & angka ---------- */
  U.parseDate = function (s) {
    var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  U.fmtTanggal = function (s, short) {
    var d = U.parseDate(s);
    if (!d) return s || '';
    return d.toLocaleDateString('id-ID', short
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  U.today = function () { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  U.rupiah = function (n) {
    return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
  };

  /* ---------- Link: Drive, YouTube, WhatsApp ---------- */
  U.driveId = function (url) {
    var m = String(url || '').match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{20,})/);
    return m ? m[1] : null;
  };
  U.isDrive = function (url) { return /drive\.google\.com|googleusercontent\.com/.test(String(url || '')); };
  U.img = function (url) {
    if (!url) return '';
    var id = U.driveId(url);
    if (id && U.isDrive(url) && url.indexOf('thumbnail') === -1) {
      return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600';
    }
    return url;
  };
  U.ytId = function (url) {
    var m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  U.waNumber = function (n) {
    var d = String(n || '').replace(/\D/g, '');
    if (d.indexOf('0') === 0) d = '62' + d.slice(1);
    return d;
  };
  U.waLink = function (num, text) {
    var n = U.waNumber(num);
    return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
  };
  U.safeUrl = function (u) { return /^https?:\/\//i.test(String(u || '')) ? u : ''; };

  /* ---------- Cache ringan agar halaman terasa cepat ---------- */
  U.cacheGet = function (k) { try { return JSON.parse(localStorage.getItem('mtna_' + k)); } catch (e) { return null; } };
  U.cacheSet = function (k, v) { try { localStorage.setItem('mtna_' + k, JSON.stringify(v)); } catch (e) { } };

  /* ---------- Tema (mode malam) & ukuran huruf ---------- */
  var FONT_STEPS = ['1', '2', '3'];

  U.initTheme = function () {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-fs', localStorage.getItem('fs') || '1');
  };

  U.bindToggles = function () {
    var bt = U.$('#btnTheme'), bf = U.$('#btnFont');
    function labelTheme() {
      if (!bt) return;
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      bt.innerHTML = dark ? '<span aria-hidden="true">☀️</span> Mode Terang' : '<span aria-hidden="true">🌙</span> Mode Malam';
    }
    function labelFont() {
      if (!bf) return;
      var fs = document.documentElement.getAttribute('data-fs');
      bf.innerHTML = '<span aria-hidden="true">Aa</span> Huruf: ' + (fs === '1' ? 'Normal' : fs === '2' ? 'Besar' : 'Sangat Besar');
    }
    if (bt) bt.addEventListener('click', function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var nt = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nt);
      localStorage.setItem('theme', nt);
      labelTheme();
    });
    if (bf) bf.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-fs') || '1';
      var next = FONT_STEPS[(FONT_STEPS.indexOf(cur) + 1) % FONT_STEPS.length];
      document.documentElement.setAttribute('data-fs', next);
      localStorage.setItem('fs', next);
      labelFont();
    });
    labelTheme(); labelFont();
  };

  /* ---------- API client ---------- */
  var API = {};
  function apiUrl() {
    var u = (window.APP_CONFIG || {}).API_URL || '';
    if (!/^https:\/\/script\.google\.com\//.test(u)) {
      throw new Error('API_URL belum diisi di js/config.js');
    }
    return u;
  }
  function unwrap(json) {
    if (!json || json.ok !== true) throw new Error((json && json.error) || 'Terjadi kesalahan pada server');
    return json.data;
  }
  API.get = function (action) {
    return fetch(apiUrl() + '?action=' + encodeURIComponent(action))
      .then(function (r) { return r.json(); }).then(unwrap);
  };
  // text/plain dipakai agar browser tidak mengirim preflight CORS (Apps Script tidak mendukung OPTIONS)
  API.post = function (payload) {
    return fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(unwrap);
  };

  window.U = U;
  window.API = API;
})();
