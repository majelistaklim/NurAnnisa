/* Website utama - Majelis Taklim Nur Annisa */
(function () {
  'use strict';
  var esc = U.esc, $ = U.$, $$ = U.$$;
  var CFG = window.APP_CONFIG || {};

  var MENU = [
    { id: 'beranda', ico: '🏠', label: 'Beranda' },
    { id: 'jadwal', ico: '📅', label: 'Jadwal' },
    { id: 'kajian', ico: '🎧', label: 'Kajian' },
    { id: 'kas', ico: '💝', label: 'Kas & Donasi' },
    { id: 'daftar', ico: '💬', label: 'Daftar' }
  ];

  var DATA = null;
  var state = { jadwalTab: 'akan', kajianTab: null };
  var view = $('#view');

  function S() { return (DATA && DATA.pengaturan) || {}; }
  function setting(k, fallback) { return S()[k] || fallback || ''; }

  /* ================= Menu & elemen global ================= */
  function buildMenus() {
    $('#topNav').innerHTML = MENU.map(function (m) {
      return '<a href="#/' + m.id + '" data-id="' + m.id + '"><span aria-hidden="true">' + m.ico + '</span> ' + esc(m.label) + '</a>';
    }).join('');
    $('#bottomNav').innerHTML = MENU.map(function (m) {
      return '<a href="#/' + m.id + '" data-id="' + m.id + '"><span class="ico" aria-hidden="true">' + m.ico + '</span>' + esc(m.label) + '</a>';
    }).join('');
  }

  function markActive(id) {
    $$('#topNav a, #bottomNav a').forEach(function (a) {
      var on = a.getAttribute('data-id') === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function applyGlobal() {
    var wa = setting('wa_admin');
    var f = $('#waFloat');
    if (wa) {
      f.href = U.waLink(wa, 'Assalamu\'alaikum, saya ingin bertanya tentang Majelis Taklim Nur Annisa.');
      f.hidden = false;
    } else { f.hidden = true; }
    $('#footName').textContent = setting('nama', CFG.NAMA);
    $('#footAddr').textContent = setting('alamat', CFG.ALAMAT);
  }

  /* ================= Pembantu tampilan ================= */
  function empty(ico, text) {
    return '<div class="card empty"><span class="big" aria-hidden="true">' + ico + '</span>' + esc(text) + '</div>';
  }

  function upcoming() {
    var t = U.today().getTime();
    return (DATA.jadwal || []).filter(function (j) { var d = U.parseDate(j.tanggal); return d && d.getTime() >= t; })
      .sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : 1; });
  }
  function past() {
    var t = U.today().getTime();
    return (DATA.jadwal || []).filter(function (j) { var d = U.parseDate(j.tanggal); return d && d.getTime() < t; })
      .sort(function (a, b) { return a.tanggal < b.tanggal ? 1 : -1; });
  }
  function byDateDesc(arr) {
    return arr.slice().sort(function (a, b) { return String(b.tanggal) < String(a.tanggal) ? -1 : 1; });
  }

  function mapsLink(j) { return U.safeUrl(j && j.maps) || U.safeUrl(setting('maps_url')); }

  function jadwalCard(j, compact) {
    var d = U.parseDate(j.tanggal);
    var mon = d ? d.toLocaleDateString('id-ID', { month: 'short' }) : '';
    var maps = mapsLink(j);
    return '<article class="card jadwal-item">' +
      '<div class="date-box" aria-hidden="true"><div class="mon">' + esc(mon) + '</div><div class="day">' + (d ? d.getDate() : '') + '</div><div class="yr">' + (d ? d.getFullYear() : '') + '</div></div>' +
      '<div class="jadwal-body"><h3>' + esc(j.tema || 'Pengajian Rutin') + '</h3>' +
      '<div class="meta"><span>📅 ' + esc(U.fmtTanggal(j.tanggal)) + '</span><span>🕘 ' + esc(j.jam) + '</span><span>📍 ' + esc(j.tempat) + '</span>' +
      (j.pembicara ? '<span>🎙️ ' + esc(j.pembicara) + '</span>' : '') + '</div>' +
      (!compact && maps ? '<a class="btn btn-outline btn-small" href="' + esc(maps) + '" target="_blank" rel="noopener">📍 Lihat Lokasi</a>' : '') +
      '</div></article>';
  }

  function ytEmbed(id, autoplay) {
    return '<iframe src="https://www.youtube-nocookie.com/embed/' + id + (autoplay ? '?autoplay=1&rel=0' : '?rel=0') +
      '" title="Video kajian" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  }

  function videoCard(k) {
    var yid = U.ytId(k.url), did = U.driveId(k.url);
    var box;
    if (yid) {
      box = '<div class="video-box" data-yt="' + yid + '"><img src="https://img.youtube.com/vi/' + yid + '/hqdefault.jpg" alt="" loading="lazy">' +
        '<button class="play-btn" type="button" aria-label="Putar video ' + esc(k.judul) + '">▶</button></div>';
    } else if (did) {
      box = '<div class="video-box"><iframe src="https://drive.google.com/file/d/' + did + '/preview" title="' + esc(k.judul) + '" allowfullscreen></iframe></div>';
    } else {
      box = '<a class="btn btn-block" href="' + esc(U.safeUrl(k.url)) + '" target="_blank" rel="noopener">▶ Tonton Video</a>';
    }
    return '<article class="card">' + box + '<div class="date-chip">' + esc(U.fmtTanggal(k.tanggal, true)) + '</div><h3>' + esc(k.judul) + '</h3>' +
      (k.ringkasan ? '<p class="muted">' + esc(k.ringkasan) + '</p>' : '') + '</article>';
  }

  function audioCard(k) {
    var did = U.driveId(k.url);
    var src = did ? 'https://drive.google.com/uc?export=download&id=' + did : U.safeUrl(k.url);
    var open = U.safeUrl(k.url);
    return '<article class="card"><div class="date-chip">' + esc(U.fmtTanggal(k.tanggal, true)) + '</div><h3>' + esc(k.judul) + '</h3>' +
      (k.ringkasan ? '<p class="muted">' + esc(k.ringkasan) + '</p>' : '') +
      '<div class="audio-box"><button class="btn btn-gold btn-block btn-lg" type="button" data-audio-toggle>▶ Putar Ceramah</button>' +
      '<audio controls preload="none" src="' + esc(src) + '"></audio></div>' +
      (open ? '<a class="btn btn-outline btn-small" href="' + esc(open) + '" target="_blank" rel="noopener">Buka di tab baru</a>' : '') + '</article>';
  }

  function artikelCard(k, i) {
    var link = U.safeUrl(k.url);
    return '<article class="card"><div class="date-chip">' + esc(U.fmtTanggal(k.tanggal, true)) + '</div><h3>' + esc(k.judul) + '</h3>' +
      '<p class="artikel-text clamp" id="art' + i + '">' + esc(k.ringkasan) + '</p>' +
      '<div class="card-actions"><button class="btn btn-outline btn-small" type="button" data-expand="art' + i + '">Baca selengkapnya</button>' +
      (link ? '<a class="btn btn-small" href="' + esc(link) + '" target="_blank" rel="noopener">Buka materi</a>' : '') + '</div></article>';
  }

  function galleryGrid(items) {
    return '<div class="gallery">' + items.map(function (g) {
      return '<button type="button" data-lb="' + esc(U.img(g.url)) + '" data-cap="' + esc(g.caption) + '" aria-label="Perbesar foto ' + esc(g.caption) + '">' +
        '<img src="' + esc(U.img(g.url)) + '" alt="' + esc(g.caption || 'Foto kegiatan') + '" loading="lazy"></button>';
    }).join('') + '</div>';
  }

  /* ================= Halaman ================= */
  function viewBeranda() {
    var nama = setting('nama', CFG.NAMA);
    var hero = U.img(setting('hero_url'));
    var next = upcoming()[0];
    var maps = mapsLink(next);
    var live = setting('live_url');
    var kajian = byDateDesc((DATA.kajian || []).filter(function (k) { return k.tipe !== 'artikel'; })).slice(0, 2)
      .concat(byDateDesc((DATA.kajian || []).filter(function (k) { return k.tipe === 'artikel'; })).slice(0, 1));
    var galeri = byDateDesc(DATA.galeri || []).slice(0, 6);

    var html = '<section class="hero"><div class="container hero-inner">' +
      (hero ? '<div class="arch"><img src="' + esc(hero) + '" alt="Kegiatan ' + esc(nama) + '"></div>'
        : '<div class="arch logo-fill"><img src="assets/logo.jpg" alt="Logo ' + esc(nama) + '"></div>') +
      '<div><div class="salam">Assalamu\'alaikum warahmatullahi wabarakatuh</div>' +
      '<h1>Selamat datang di ' + esc(nama) + '</h1>' +
      '<p>' + esc(setting('tagline')) + '. ' + esc(setting('alamat', CFG.ALAMAT)) + '.</p>' +
      '<div class="hero-actions"><a class="btn btn-gold btn-lg" href="#/jadwal">📅 Lihat Jadwal</a>' +
      '<a class="btn btn-outline btn-lg" style="color:#fff;border-color:#fff" href="#/daftar">📝 Daftar Anggota</a></div></div>' +
      '</div></section>';

    html += '<div class="container">';

    // Jadwal terdekat
    html += '<section class="card next-card" aria-labelledby="nextTitle"><span class="label">Pengajian Terdekat</span>';
    if (next) {
      html += '<h2 id="nextTitle">' + esc(next.tema || 'Pengajian Rutin') + '</h2><ul class="info-list">' +
        '<li><span class="ic">📅</span><span><b>Hari & Tanggal</b>' + esc(U.fmtTanggal(next.tanggal)) + '</span></li>' +
        '<li><span class="ic">🕘</span><span><b>Jam</b>' + esc(next.jam) + '</span></li>' +
        '<li><span class="ic">📍</span><span><b>Tempat</b>' + esc(next.tempat) + '</span></li>' +
        (next.pembicara ? '<li><span class="ic">🎙️</span><span><b>Ustaz / Ustazah</b>' + esc(next.pembicara) + '</span></li>' : '') +
        '</ul><div class="card-actions">' +
        (maps ? '<a class="btn" href="' + esc(maps) + '" target="_blank" rel="noopener">📍 Lokasi</a>' : '') +
        '<a class="btn btn-outline" href="#/jadwal">Semua Jadwal</a></div>';
    } else {
      html += '<h2 id="nextTitle">Belum ada jadwal</h2><p class="muted">Jadwal pengajian berikutnya akan diumumkan di sini. Silakan cek kembali nanti.</p>';
    }
    html += '</section>';

    // Tombol cepat
    html += '<section class="section" aria-label="Akses cepat"><div class="quick">' +
      (maps || U.safeUrl(setting('maps_url'))
        ? '<a class="tile" href="' + esc(maps || U.safeUrl(setting('maps_url'))) + '" target="_blank" rel="noopener"><span class="big" aria-hidden="true">📍</span>Lokasi<small>Buka peta</small></a>'
        : '<a class="tile" href="#/daftar"><span class="big" aria-hidden="true">📍</span>Lokasi<small>Lihat alamat</small></a>') +
      '<a class="tile live" href="#/kajian" data-tab="' + (live ? 'live' : 'video') + '"><span class="big" aria-hidden="true">🎙️</span>Kajian Live<small>' + (live ? 'Tonton siaran' : 'Rekaman kajian') + '</small></a>' +
      '<a class="tile" href="#/kajian" data-tab="audio"><span class="big" aria-hidden="true">🎧</span>Dengar Ceramah<small>Rekaman audio</small></a>' +
      '<a class="tile" href="#/daftar"><span class="big" aria-hidden="true">📝</span>Daftar<small>Anggota baru</small></a>' +
      '</div></section>';

    // Kajian terbaru
    html += '<section class="section"><div class="section-title"><h2>Kajian Terbaru</h2><a href="#/kajian">Lihat semua</a></div>';
    if (kajian.length) {
      html += '<div class="media-grid">' + kajian.map(function (k, i) {
        return k.tipe === 'audio' ? audioCard(k) : k.tipe === 'artikel' ? artikelCard(k, 'h' + i) : videoCard(k);
      }).join('') + '</div>';
    } else html += empty('🎧', 'Belum ada kajian yang diunggah.');
    html += '</section>';

    // Galeri
    if (galeri.length) {
      html += '<section class="section"><div class="section-title"><h2>Kegiatan Kita</h2><a href="#/kajian" data-tab="galeri">Lihat galeri</a></div>' + galleryGrid(galeri) + '</section>';
    }

    // Tentang
    html += '<section class="section"><div class="card"><h2>Tentang Kami</h2><p>' + esc(setting('tentang')) + '</p></div></section>';
    html += '</div>';
    view.innerHTML = html;
  }

  function viewJadwal() {
    var list = state.jadwalTab === 'lewat' ? past() : upcoming();
    var html = '<div class="container section"><h1>Jadwal & Kegiatan</h1>' +
      '<div class="tabs" role="tablist"><button class="tab' + (state.jadwalTab === 'akan' ? ' active' : '') + '" data-jtab="akan" role="tab">Akan Datang</button>' +
      '<button class="tab' + (state.jadwalTab === 'lewat' ? ' active' : '') + '" data-jtab="lewat" role="tab">Sudah Lewat</button></div>';
    html += list.length ? '<div class="list">' + list.map(function (j) { return jadwalCard(j); }).join('') + '</div>'
      : empty('📅', state.jadwalTab === 'lewat' ? 'Belum ada kegiatan yang sudah lewat.' : 'Belum ada jadwal yang akan datang.');
    html += '</div>';
    view.innerHTML = html;
  }

  function viewKajian() {
    var live = setting('live_url');
    var tabs = [
      { id: 'live', ico: '🔴', label: 'Live' },
      { id: 'video', ico: '🎬', label: 'Video' },
      { id: 'audio', ico: '🎧', label: 'Audio' },
      { id: 'artikel', ico: '📖', label: 'Artikel' },
      { id: 'galeri', ico: '🖼️', label: 'Galeri' }
    ];
    if (!state.kajianTab) state.kajianTab = live ? 'live' : 'video';
    var tab = state.kajianTab;
    var items = DATA.kajian || [];
    var html = '<div class="container section"><h1>Kumpulan Kajian</h1><div class="tabs" role="tablist">' +
      tabs.map(function (t) {
        return '<button class="tab' + (t.id === tab ? ' active' : '') + '" data-ktab="' + t.id + '" role="tab"><span aria-hidden="true">' + t.ico + '</span> ' + t.label + '</button>';
      }).join('') + '</div>';

    if (tab === 'live') {
      var yid = U.ytId(live);
      if (live && yid) {
        html += '<div class="card"><h2>Kajian Live</h2><div class="video-box">' + ytEmbed(yid, false) + '</div>' +
          '<p class="muted">Jika video belum tampil, siaran mungkin belum dimulai.</p>' +
          '<a class="btn btn-block" href="' + esc(U.safeUrl(live)) + '" target="_blank" rel="noopener">Buka di YouTube</a></div>';
      } else if (live) {
        html += '<div class="card"><h2>Kajian Live</h2><a class="btn btn-lg btn-block" href="' + esc(U.safeUrl(live)) + '" target="_blank" rel="noopener">▶ Tonton Siaran Langsung</a></div>';
      } else html += empty('🔴', 'Belum ada siaran live saat ini. Lihat rekaman pada tab Video atau Audio.');
    } else if (tab === 'video' || tab === 'audio') {
      var arr = byDateDesc(items.filter(function (k) { return k.tipe === tab; }));
      html += arr.length ? '<div class="media-grid">' + arr.map(tab === 'video' ? videoCard : audioCard).join('') + '</div>'
        : empty(tab === 'video' ? '🎬' : '🎧', 'Belum ada ' + (tab === 'video' ? 'video' : 'rekaman audio') + ' yang diunggah.');
    } else if (tab === 'artikel') {
      var art = byDateDesc(items.filter(function (k) { return k.tipe === 'artikel'; }));
      html += art.length ? '<div class="media-grid">' + art.map(artikelCard).join('') + '</div>' : empty('📖', 'Belum ada ringkasan materi.');
    } else {
      var g = byDateDesc(DATA.galeri || []);
      html += g.length ? galleryGrid(g) : empty('🖼️', 'Belum ada foto kegiatan.');
    }
    html += '</div>';
    view.innerHTML = html;
  }

  function viewKas() {
    var kas = byDateDesc(DATA.kas || []);
    var masuk = 0, keluar = 0;
    kas.forEach(function (r) { var n = Number(r.jumlah) || 0; if (r.jenis === 'keluar') keluar += n; else masuk += n; });
    var bank = setting('bank_nama'), rek = setting('bank_rekening'), an = setting('bank_atas_nama'), qris = U.img(setting('qris_url'));
    var wa = setting('wa_admin');

    var html = '<div class="container section"><h1>Kas & Donasi</h1>' +
      '<div class="stats"><div class="card stat saldo"><div class="muted">Saldo Kas</div><div class="num">' + U.rupiah(masuk - keluar) + '</div></div>' +
      '<div class="card stat"><div class="muted">Total Pemasukan</div><div class="num">' + U.rupiah(masuk) + '</div></div>' +
      '<div class="card stat"><div class="muted">Total Pengeluaran</div><div class="num">' + U.rupiah(keluar) + '</div></div></div>';

    html += '<section class="section"><div class="card"><h2>Salurkan Donasi</h2>';
    if (rek || qris) {
      html += '<p>Donasi untuk kegiatan sosial dan operasional majelis taklim dapat disalurkan melalui:</p>';
      if (rek) html += '<div class="muted">' + esc(bank) + (an ? ' a.n. ' + esc(an) : '') + '</div><div class="rek" id="rekNum">' + esc(rek) + '</div>' +
        '<div class="card-actions" style="margin-top:.8rem"><button class="btn" type="button" data-copy="' + esc(rek) + '">📋 Salin Nomor Rekening</button></div>';
      if (qris) html += '<img class="qris" src="' + esc(qris) + '" alt="Kode QRIS donasi">';
      if (wa) html += '<a class="btn btn-wa btn-block" style="margin-top:.8rem" target="_blank" rel="noopener" href="' + esc(U.waLink(wa, 'Assalamu\'alaikum, saya sudah berdonasi untuk Majelis Taklim Nur Annisa. Berikut bukti transfer:')) + '">💬 Konfirmasi Donasi via WhatsApp</a>';
    } else html += '<p class="muted">Informasi rekening donasi belum tersedia. Silakan hubungi admin.</p>';
    html += '</div></section>';

    html += '<section class="section"><div class="card"><h2>Laporan Kas</h2>';
    if (kas.length) {
      var show = state.kasAll ? kas : kas.slice(0, 20);
      html += show.map(function (r) {
        var out = r.jenis === 'keluar';
        return '<div class="trx"><div><b>' + esc(r.keterangan) + '</b><div class="muted" style="font-size:.85rem">' + esc(U.fmtTanggal(r.tanggal, true)) + '</div></div>' +
          '<div class="amt ' + (out ? 'out' : 'in') + '">' + (out ? '− ' : '+ ') + U.rupiah(r.jumlah) + '</div></div>';
      }).join('');
      if (kas.length > 20 && !state.kasAll) html += '<button class="btn btn-outline btn-block" type="button" data-kasall style="margin-top:.8rem">Tampilkan semua (' + kas.length + ')</button>';
    } else html += '<p class="muted">Belum ada catatan kas.</p>';
    html += '</div></section></div>';
    view.innerHTML = html;
  }

  function viewDaftar() {
    var wa = setting('wa_admin'), alamat = setting('alamat', CFG.ALAMAT), maps = U.safeUrl(setting('maps_url'));
    var html = '<div class="container section"><h1>Kontak & Pendaftaran</h1>' +
      '<div class="card"><h2>Daftar Anggota Baru</h2><p class="muted">Isi data singkat di bawah. Admin akan menghubungi Ibu lewat WhatsApp.</p>' +
      '<form class="form" id="formDaftar" novalidate>' +
      '<div><label for="fNama">Nama lengkap</label><input id="fNama" name="nama" autocomplete="name" required maxlength="100"></div>' +
      '<div><label for="fWa">Nomor WhatsApp</label><input id="fWa" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="Contoh: 0812xxxxxxx" required maxlength="30"></div>' +
      '<div><label for="fAlamat">Alamat / Blok rumah</label><input id="fAlamat" name="alamat" autocomplete="street-address" maxlength="200"></div>' +
      '<div><label for="fCatatan">Pesan (boleh dikosongkan)</label><textarea id="fCatatan" name="catatan" maxlength="300"></textarea></div>' +
      '<button class="btn btn-lg btn-block" type="submit" id="btnDaftar">📝 Kirim Pendaftaran</button>' +
      '<div id="daftarMsg" role="status" aria-live="polite"></div></form></div>' +
      '<section class="section"><div class="card"><h2>Hubungi Kami</h2><ul class="info-list">' +
      '<li><span class="ic">📍</span><span><b>Alamat</b>' + esc(alamat) + '</span></li>' +
      (wa ? '<li><span class="ic">💬</span><span><b>WhatsApp Admin</b>' + esc(wa) + '</span></li>' : '') + '</ul><div class="card-actions">' +
      (wa ? '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + esc(U.waLink(wa, 'Assalamu\'alaikum, saya ingin bertanya tentang Majelis Taklim Nur Annisa.')) + '">💬 Chat WhatsApp</a>' : '') +
      (maps ? '<a class="btn btn-outline" target="_blank" rel="noopener" href="' + esc(maps) + '">📍 Buka Peta</a>' : '') +
      '</div></div></section></div>';
    view.innerHTML = html;
    $('#formDaftar').addEventListener('submit', submitDaftar);
  }

  function submitDaftar(e) {
    e.preventDefault();
    var f = e.target, msg = $('#daftarMsg'), btn = $('#btnDaftar');
    var body = { action: 'daftar', nama: f.nama.value.trim(), whatsapp: f.whatsapp.value.trim(), alamat: f.alamat.value.trim(), catatan: f.catatan.value.trim() };
    if (!body.nama || !body.whatsapp) {
      msg.innerHTML = '<div class="notice err">Mohon isi nama dan nomor WhatsApp.</div>';
      return;
    }
    btn.disabled = true; btn.textContent = 'Mengirim...';
    API.post(body).then(function () {
      var wa = setting('wa_admin');
      var text = 'Assalamu\'alaikum, saya ingin mendaftar sebagai anggota Majelis Taklim Nur Annisa.\nNama: ' + body.nama + '\nAlamat: ' + body.alamat;
      msg.innerHTML = '<div class="notice ok">Alhamdulillah, pendaftaran Ibu sudah kami terima.</div>' +
        (wa ? '<a class="btn btn-wa btn-block" style="margin-top:.7rem" target="_blank" rel="noopener" href="' + esc(U.waLink(wa, text)) + '">💬 Kabari Admin via WhatsApp</a>' : '');
      f.reset();
    }).catch(function (err) {
      var wa = setting('wa_admin');
      msg.innerHTML = '<div class="notice err">Pendaftaran belum terkirim: ' + esc(err.message) + '</div>' +
        (wa ? '<a class="btn btn-wa btn-block" style="margin-top:.7rem" target="_blank" rel="noopener" href="' + esc(U.waLink(wa, 'Assalamu\'alaikum, saya ingin mendaftar sebagai anggota. Nama: ' + body.nama)) + '">💬 Daftar lewat WhatsApp saja</a>' : '');
    }).then(function () { btn.disabled = false; btn.textContent = '📝 Kirim Pendaftaran'; });
  }

  /* ================= Router ================= */
  var ROUTES = { beranda: viewBeranda, jadwal: viewJadwal, kajian: viewKajian, kas: viewKas, daftar: viewDaftar };

  function currentId() {
    var id = (location.hash || '#/beranda').replace(/^#\/?/, '') || 'beranda';
    return ROUTES[id] ? id : 'beranda';
  }

  function render(keepScroll) {
    if (!DATA) return;
    var id = currentId();
    markActive(id);
    var y = window.scrollY;
    ROUTES[id]();
    if (keepScroll) window.scrollTo(0, y); else { window.scrollTo(0, 0); }
  }

  /* ================= Interaksi (delegasi klik) ================= */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-jtab],[data-ktab],[data-lb],[data-copy],[data-expand],[data-audio-toggle],[data-kasall],.play-btn');
    if (!t) return;

    if (t.hasAttribute('data-tab')) { state.kajianTab = t.getAttribute('data-tab'); return; } // lalu pindah via href

    if (t.hasAttribute('data-jtab')) { state.jadwalTab = t.getAttribute('data-jtab'); render(true); return; }
    if (t.hasAttribute('data-ktab')) { state.kajianTab = t.getAttribute('data-ktab'); render(true); return; }
    if (t.hasAttribute('data-kasall')) { state.kasAll = true; render(true); return; }

    if (t.hasAttribute('data-lb')) {
      $('#lbImg').src = t.getAttribute('data-lb');
      $('#lbCap').textContent = t.getAttribute('data-cap') || '';
      $('#lightbox').showModal();
      return;
    }
    if (t.hasAttribute('data-copy')) {
      var val = t.getAttribute('data-copy');
      var done = function () { var o = t.textContent; t.textContent = '✔ Tersalin'; setTimeout(function () { t.textContent = o; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(val).then(done, function () { window.prompt('Salin nomor ini:', val); });
      else window.prompt('Salin nomor ini:', val);
      return;
    }
    if (t.hasAttribute('data-expand')) {
      var p = document.getElementById(t.getAttribute('data-expand'));
      var open = p.classList.toggle('clamp') === false;
      t.textContent = open ? 'Tutup' : 'Baca selengkapnya';
      return;
    }
    if (t.hasAttribute('data-audio-toggle')) {
      var a = t.parentNode.querySelector('audio');
      if (a.paused) { a.play(); t.textContent = '⏸ Jeda'; } else { a.pause(); t.textContent = '▶ Putar Ceramah'; }
      a.onended = function () { t.textContent = '▶ Putar Ceramah'; };
      return;
    }
    if (t.classList.contains('play-btn')) {
      var box = t.closest('.video-box');
      box.innerHTML = ytEmbed(box.getAttribute('data-yt'), true);
    }
  });

  $('#lbClose').addEventListener('click', function () { $('#lightbox').close(); });
  $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox') e.target.close(); });
  window.addEventListener('hashchange', function () { render(false); });

  /* ================= Mulai ================= */
  function init() {
    U.bindToggles();
    buildMenus();
    $('#year').textContent = new Date().getFullYear();

    var cached = U.cacheGet('public');
    if (cached) { DATA = cached; applyGlobal(); render(false); }

    API.get('public').then(function (fresh) {
      var changed = JSON.stringify(fresh) !== JSON.stringify(DATA);
      DATA = fresh; U.cacheSet('public', fresh);
      applyGlobal();
      if (changed) render(!!cached);
    }).catch(function (err) {
      if (DATA) return; // tetap pakai data tersimpan
      view.innerHTML = '<div class="container section"><div class="card empty"><span class="big" aria-hidden="true">📡</span>' +
        '<b>Halaman belum bisa dimuat.</b><br>' + esc(err.message) + '<br><br>' +
        '<button class="btn" type="button" onclick="location.reload()">Coba Lagi</button></div></div>';
    });
  }
  init();
})();
