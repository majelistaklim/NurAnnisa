/* Halaman admin - Majelis Taklim Nur Annisa */
(function () {
  'use strict';
  var esc = U.esc, $ = U.$, $$ = U.$$;
  var TOKEN_KEY = 'mtna_token';
  var MAX_MB = 20;

  /* ================= Skema data ================= */
  var SCHEMA = {
    jadwal: {
      label: 'Jadwal', ico: '📅', add: 'Tambah Jadwal', sortBy: 'tanggal',
      fields: [
        { k: 'tanggal', l: 'Tanggal', t: 'date', req: 1 },
        { k: 'jam', l: 'Jam', t: 'text', req: 1, ph: 'Contoh: 09.00 - 11.00 WIB' },
        { k: 'tempat', l: 'Tempat', t: 'text', req: 1, ph: 'Contoh: Masjid / Rumah Ibu ...' },
        { k: 'pembicara', l: 'Ustaz / Ustazah', t: 'text' },
        { k: 'tema', l: 'Tema kajian', t: 'text' },
        { k: 'maps', l: 'Link Google Maps (boleh kosong)', t: 'url', hint: 'Jika kosong, dipakai link peta dari menu Pengaturan.' }
      ],
      title: function (r) { return r.tema || 'Pengajian Rutin'; },
      meta: function (r) { return ['📅 ' + U.fmtTanggal(r.tanggal, true) + ' • 🕘 ' + r.jam, '📍 ' + r.tempat, r.pembicara ? '🎙️ ' + r.pembicara : '']; }
    },
    kajian: {
      label: 'Kajian', ico: '🎧', add: 'Tambah Kajian', sortBy: 'tanggal',
      fields: [
        { k: 'judul', l: 'Judul', t: 'text', req: 1 },
        { k: 'tipe', l: 'Jenis', t: 'select', req: 1, opts: [['video', 'Video (YouTube / file)'], ['audio', 'Audio ceramah'], ['artikel', 'Artikel / ringkasan materi']] },
        { k: 'url', l: 'Link atau file', t: 'file', accept: 'audio/*,video/*,application/pdf,image/*', up: 'media',
          hint: 'Video: tempel link YouTube (disarankan). Audio: unggah file atau tempel link Google Drive. Artikel: boleh kosong.' },
        { k: 'ringkasan', l: 'Ringkasan / isi artikel', t: 'textarea' },
        { k: 'tanggal', l: 'Tanggal kajian', t: 'date', req: 1 }
      ],
      validate: function (d) { if (d.tipe !== 'artikel' && !d.url) return 'Link atau file wajib diisi untuk video/audio.'; if (d.tipe === 'artikel' && !d.ringkasan && !d.url) return 'Isi ringkasan artikel terlebih dulu.'; },
      title: function (r) { return r.judul; },
      meta: function (r) { return ['🏷️ ' + ({ video: 'Video', audio: 'Audio', artikel: 'Artikel' }[r.tipe] || r.tipe) + ' • ' + U.fmtTanggal(r.tanggal, true), r.url ? '🔗 ' + r.url.slice(0, 60) : '']; }
    },
    galeri: {
      label: 'Galeri', ico: '🖼️', add: 'Tambah Foto', sortBy: 'tanggal',
      fields: [
        { k: 'url', l: 'Foto', t: 'file', req: 1, accept: 'image/*', up: 'image', hint: 'Foto akan otomatis dikecilkan agar ringan dibuka di HP.' },
        { k: 'caption', l: 'Keterangan foto', t: 'text', ph: 'Contoh: Pengajian rutin bulan Oktober' },
        { k: 'tanggal', l: 'Tanggal', t: 'date', req: 1 }
      ],
      title: function (r) { return r.caption || 'Foto kegiatan'; },
      meta: function (r) { return [U.fmtTanggal(r.tanggal, true)]; },
      thumb: function (r) { return U.img(r.url); }
    },
    kas: {
      label: 'Kas', ico: '💝', add: 'Catat Kas', sortBy: 'tanggal',
      fields: [
        { k: 'tanggal', l: 'Tanggal', t: 'date', req: 1 },
        { k: 'keterangan', l: 'Keterangan', t: 'text', req: 1, ph: 'Contoh: Infak pengajian / Beli konsumsi' },
        { k: 'jenis', l: 'Jenis', t: 'select', req: 1, opts: [['masuk', 'Pemasukan'], ['keluar', 'Pengeluaran']] },
        { k: 'jumlah', l: 'Jumlah (Rp)', t: 'number', req: 1, ph: 'Contoh: 150000' }
      ],
      title: function (r) { return r.keterangan; },
      meta: function (r) { return [U.fmtTanggal(r.tanggal, true), (r.jenis === 'keluar' ? '➖ Pengeluaran ' : '➕ Pemasukan ') + U.rupiah(r.jumlah)]; }
    },
    anggota: {
      label: 'Pendaftar', ico: '👥', readonly: true, sortBy: 'waktu',
      fields: [],
      title: function (r) { return r.nama; },
      meta: function (r) { return ['📱 ' + r.whatsapp, r.alamat ? '🏠 ' + r.alamat : '', r.catatan ? '💬 ' + r.catatan : '', '🕘 ' + r.waktu]; }
    }
  };

  var SETTINGS_GROUPS = [
    { title: 'Informasi Umum', fields: [
      { k: 'nama', l: 'Nama majelis taklim', t: 'text' },
      { k: 'tagline', l: 'Kalimat singkat di beranda', t: 'text' },
      { k: 'tentang', l: 'Tentang kami', t: 'textarea' },
      { k: 'alamat', l: 'Alamat', t: 'text' }
    ] },
    { title: 'Foto Utama Beranda', fields: [
      { k: 'hero_url', l: 'Foto kegiatan ibu-ibu', t: 'file', accept: 'image/*', up: 'image', hint: 'Dipakai di bagian atas beranda. Jika kosong, logo yang tampil.' }
    ] },
    { title: 'WhatsApp & Lokasi', fields: [
      { k: 'wa_admin', l: 'Nomor WhatsApp admin', t: 'tel', ph: 'Contoh: 081234567890', hint: 'Dipakai untuk tombol chat melayang dan pendaftaran.' },
      { k: 'maps_url', l: 'Link Google Maps lokasi pengajian', t: 'url' }
    ] },
    { title: 'Kajian Live', fields: [
      { k: 'live_url', l: 'Link YouTube Live', t: 'url', hint: 'Tempel link siaran YouTube. Kosongkan jika tidak sedang ada siaran.' }
    ] },
    { title: 'Donasi', fields: [
      { k: 'bank_nama', l: 'Nama bank', t: 'text', ph: 'Contoh: BSI' },
      { k: 'bank_rekening', l: 'Nomor rekening', t: 'text' },
      { k: 'bank_atas_nama', l: 'Atas nama', t: 'text' },
      { k: 'qris_url', l: 'Gambar QRIS (boleh kosong)', t: 'file', accept: 'image/*', up: 'image' }
    ] }
  ];

  var rowsCache = {};
  var current = 'jadwal';
  var editing = null; // {table, id}

  /* ================= Pembantu ================= */
  function msg(el, type, text) {
    el.innerHTML = text ? '<div class="notice ' + type + '">' + esc(text) + '</div>' : '';
  }
  function token() { return sessionStorage.getItem(TOKEN_KEY); }
  function call(payload) {
    payload.token = token();
    return API.post(payload).catch(function (err) {
      if (/Sesi habis/.test(err.message)) { logout(); }
      throw err;
    });
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ================= Login ================= */
  function showLogin() {
    $('#loginView').hidden = false; $('#dashView').hidden = true; $('#btnLogout').hidden = true;
  }
  function showDash() {
    $('#loginView').hidden = true; $('#dashView').hidden = false; $('#btnLogout').hidden = false;
    buildTabs(); openTab(current);
    if (sessionStorage.getItem('mtna_defpw')) msg($('#adminMsg'), 'err', 'Anda masih memakai password awal. Segera ganti di menu Pengaturan > Ganti Password Admin.');
  }
  function logout() { sessionStorage.removeItem(TOKEN_KEY); showLogin(); }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('#btnLogin'), m = $('#loginMsg');
    btn.disabled = true; btn.textContent = 'Memeriksa...'; msg(m, '', '');
    API.post({ action: 'login', password: $('#pw').value }).then(function (r) {
      sessionStorage.setItem(TOKEN_KEY, r.token);
      if (r.defaultPw) sessionStorage.setItem('mtna_defpw', '1'); else sessionStorage.removeItem('mtna_defpw');
      $('#pw').value = '';
      showDash();
    }).catch(function (err) {
      msg(m, 'err', err.message);
    }).then(function () { btn.disabled = false; btn.textContent = 'Masuk'; });
  });
  $('#btnLogout').addEventListener('click', logout);

  /* ================= Tab ================= */
  function buildTabs() {
    var keys = Object.keys(SCHEMA).concat(['pengaturan']);
    $('#adminTabs').innerHTML = keys.map(function (k) {
      var s = SCHEMA[k] || { ico: '⚙️', label: 'Pengaturan' };
      return '<button class="tab" role="tab" data-tab="' + k + '"><span aria-hidden="true">' + s.ico + '</span> ' + s.label + '</button>';
    }).join('');
  }
  function openTab(k) {
    current = k;
    $$('#adminTabs .tab').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === k); });
    if (!sessionStorage.getItem('mtna_defpw')) msg($('#adminMsg'), '', '');
    if (k === 'pengaturan') renderSettings(); else renderList(k);
  }
  $('#adminTabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]'); if (b) openTab(b.getAttribute('data-tab'));
  });

  /* ================= Daftar data ================= */
  function renderList(table) {
    var s = SCHEMA[table], box = $('#adminContent');
    box.innerHTML = '<div class="loading"><div class="spinner"></div>Memuat data...</div>';
    call({ action: 'adminList', table: table }).then(function (rows) {
      rows.sort(function (a, b) { return String(b[s.sortBy]) < String(a[s.sortBy]) ? -1 : 1; });
      rowsCache[table] = rows;
      var html = '<div class="toolbar"><h2>' + s.label + ' (' + rows.length + ')</h2>' +
        (s.readonly ? '' : '<button class="btn" type="button" data-add="' + table + '">＋ ' + s.add + '</button>') + '</div>';
      if (!rows.length) html += '<div class="card empty"><span class="big" aria-hidden="true">' + s.ico + '</span>Belum ada data.</div>';
      html += rows.map(function (r) {
        var th = s.thumb ? '<img class="thumb" src="' + esc(s.thumb(r)) + '" alt="" loading="lazy">' : '';
        var wa = table === 'anggota' ? '<a class="btn btn-wa btn-small" target="_blank" rel="noopener" href="' + esc(U.waLink(r.whatsapp, 'Assalamu\'alaikum Ibu ' + r.nama + ', terima kasih sudah mendaftar di Majelis Taklim Nur Annisa.')) + '">💬 WhatsApp</a>' : '';
        return '<div class="card row-item">' + th + '<div class="row-main"><h3>' + esc(s.title(r)) + '</h3><div class="meta">' +
          s.meta(r).filter(Boolean).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') + '</div></div>' +
          '<div class="row-actions">' + wa +
          (s.readonly ? '' : '<button class="btn btn-outline btn-small" type="button" data-edit="' + esc(r.id) + '">✏️ Ubah</button>') +
          '<button class="btn btn-danger btn-small" type="button" data-del="' + esc(r.id) + '">🗑️ Hapus</button></div></div>';
      }).join('');
      box.innerHTML = html;
    }).catch(function (err) { box.innerHTML = ''; msg($('#adminMsg'), 'err', err.message); });
  }

  $('#adminContent').addEventListener('click', function (e) {
    var t = e.target.closest('[data-add],[data-edit],[data-del]'); if (!t) return;
    if (t.hasAttribute('data-add')) return openForm(current, null);
    if (t.hasAttribute('data-edit')) {
      var row = (rowsCache[current] || []).filter(function (r) { return r.id === t.getAttribute('data-edit'); })[0];
      return openForm(current, row);
    }
    if (t.hasAttribute('data-del')) {
      if (!confirm('Hapus data ini? Tindakan ini tidak bisa dibatalkan.')) return;
      t.disabled = true;
      call({ action: 'delete', table: current, id: t.getAttribute('data-del') }).then(function () {
        msg($('#adminMsg'), 'ok', 'Data berhasil dihapus.'); renderList(current);
      }).catch(function (err) { t.disabled = false; msg($('#adminMsg'), 'err', err.message); });
    }
  });

  /* ================= Pembuat form ================= */
  function fieldHtml(f, val, p) {
    var id = p + f.k, req = f.req ? ' required' : '', ph = f.ph ? ' placeholder="' + esc(f.ph) + '"' : '', input;
    val = val == null ? '' : val;
    if (f.t === 'textarea') input = '<textarea id="' + id + '"' + req + '>' + esc(val) + '</textarea>';
    else if (f.t === 'select') input = '<select id="' + id + '"' + req + '>' + f.opts.map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
    }).join('') + '</select>';
    else if (f.t === 'file') input = '<input id="' + id + '" type="url" inputmode="url" value="' + esc(val) + '"' + req + ' placeholder="https://... (atau unggah file di bawah)">' +
      '<div class="upload-box"><label for="' + id + '_f">Unggah dari HP / komputer</label>' +
      '<input id="' + id + '_f" type="file" accept="' + esc(f.accept) + '" data-up="' + id + '" data-kind="' + f.up + '"><div class="progress" id="' + id + '_p" role="status"></div></div>' +
      (f.up === 'image' ? '<img class="thumb-lg" id="' + id + '_prev" alt="" ' + (val ? 'src="' + esc(U.img(val)) + '"' : 'hidden') + '>' : '');
    else input = '<input id="' + id + '" type="' + (f.t || 'text') + '"' + (f.t === 'number' ? ' min="0" inputmode="numeric"' : '') + (f.t === 'tel' ? ' inputmode="tel"' : '') + ' value="' + esc(val) + '"' + req + ph + '>';
    return '<div><label for="' + id + '">' + esc(f.l) + (f.req ? ' <span class="muted">(wajib)</span>' : '') + '</label>' + input + (f.hint ? '<div class="hint">' + esc(f.hint) + '</div>' : '') + '</div>';
  }

  function collect(fields, p) {
    var o = {};
    fields.forEach(function (f) { o[f.k] = $('#' + p + f.k).value.trim(); });
    return o;
  }

  /* ---------- Unggah file ke Google Drive via Apps Script ---------- */
  function fileToBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1]); };
      r.onerror = function () { rej(new Error('File tidak bisa dibaca')); };
      r.readAsDataURL(blob);
    });
  }
  function compressImage(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1600, r = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { URL.revokeObjectURL(url); b ? res(b) : rej(new Error('Gagal memproses gambar')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { rej(new Error('Gambar tidak bisa dibaca')); };
      img.src = url;
    });
  }

  function handleUpload(input) {
    var file = input.files[0]; if (!file) return;
    var id = input.getAttribute('data-up'), prog = $('#' + id + '_p'), target = $('#' + id), kind = input.getAttribute('data-kind');
    var isImg = /^image\//.test(file.type);
    if (kind === 'image' && !isImg) { prog.textContent = '❌ Pilih file gambar (JPG/PNG).'; input.value = ''; return; }
    if (!isImg && file.size > MAX_MB * 1024 * 1024) {
      prog.textContent = '❌ File terlalu besar (maks ' + MAX_MB + ' MB). Unggah ke Google Drive/YouTube lalu tempel linknya.'; input.value = ''; return;
    }
    prog.textContent = '⏳ Mengunggah... mohon tunggu, jangan tutup halaman.';
    var name = file.name, mime = file.type;
    (isImg ? compressImage(file).then(function (b) { mime = 'image/jpeg'; name = name.replace(/\.\w+$/, '') + '.jpg'; return b; }) : Promise.resolve(file))
      .then(fileToBase64)
      .then(function (b64) { return call({ action: 'upload', filename: name, mime: mime, data: b64 }); })
      .then(function (r) {
        target.value = r.url;
        prog.textContent = '✅ Berhasil diunggah. Jangan lupa tekan "Simpan".';
        var prev = $('#' + id + '_prev'); if (prev) { prev.src = U.img(r.url); prev.hidden = false; }
      })
      .catch(function (err) { prog.textContent = '❌ ' + err.message; })
      .then(function () { input.value = ''; });
  }
  document.addEventListener('change', function (e) { if (e.target.matches('input[data-up]')) handleUpload(e.target); });

  /* ================= Dialog tambah / ubah ================= */
  function openForm(table, row) {
    var s = SCHEMA[table];
    editing = { table: table, id: row ? row.id : null };
    $('#dlgTitle').textContent = (row ? 'Ubah ' : 'Tambah ') + s.label;
    var data = row || {};
    if (!row) { s.fields.forEach(function (f) { if (f.t === 'date') data[f.k] = todayStr(); }); }
    $('#dlgFields').innerHTML = s.fields.map(function (f) { return fieldHtml(f, data[f.k], 'f_'); }).join('');
    msg($('#dlgMsg'), '', '');
    $('#formDlg').showModal();
  }

  $('#dlgCancel').addEventListener('click', function () { $('#formDlg').close(); });
  $('#dlgForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var s = SCHEMA[editing.table], d = collect(s.fields, 'f_'), m = $('#dlgMsg'), btn = $('#dlgSave');
    for (var i = 0; i < s.fields.length; i++) {
      var f = s.fields[i];
      if (f.req && !d[f.k]) { msg(m, 'err', 'Mohon isi: ' + f.l); return; }
    }
    if (s.validate) { var er = s.validate(d); if (er) { msg(m, 'err', er); return; } }
    if (editing.id) d.id = editing.id;
    btn.disabled = true; btn.textContent = 'Menyimpan...';
    call({ action: 'save', table: editing.table, data: d }).then(function () {
      $('#formDlg').close();
      msg($('#adminMsg'), 'ok', 'Tersimpan. Perubahan langsung tampil di website.');
      renderList(editing.table);
    }).catch(function (err) { msg(m, 'err', err.message); })
      .then(function () { btn.disabled = false; btn.textContent = 'Simpan'; });
  });

  /* ================= Pengaturan ================= */
  function renderSettings() {
    var box = $('#adminContent');
    box.innerHTML = '<div class="loading"><div class="spinner"></div>Memuat pengaturan...</div>';
    call({ action: 'getSettings' }).then(function (S) {
      var all = [];
      var html = '<div class="toolbar"><h2>Pengaturan Website</h2></div><form id="setForm" class="form">';
      SETTINGS_GROUPS.forEach(function (g) {
        html += '<div class="card settings-group"><h3>' + esc(g.title) + '</h3><div class="form">' +
          g.fields.map(function (f) { all.push(f); return fieldHtml(f, S[f.k], 's_'); }).join('') + '</div></div>';
      });
      html += '<div class="sticky-save"><button class="btn btn-lg btn-block" type="submit" id="setSave">💾 Simpan Pengaturan</button></div></form>' +
        '<div class="card settings-group" style="margin-top:1.2rem"><h3>Ganti Password Admin</h3><form class="form" id="pwForm">' +
        '<div><label for="newPw">Password baru (minimal 6 karakter)</label><input id="newPw" type="password" autocomplete="new-password" minlength="6" required></div>' +
        '<button class="btn btn-outline" type="submit">Ganti Password</button></form></div>';
      box.innerHTML = html;

      $('#setForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = $('#setSave'); btn.disabled = true; btn.textContent = 'Menyimpan...';
        call({ action: 'saveSettings', data: collect(all, 's_') }).then(function () {
          localStorage.removeItem('mtna_public'); // paksa website memuat data terbaru
          msg($('#adminMsg'), 'ok', 'Pengaturan tersimpan.'); window.scrollTo(0, 0);
        }).catch(function (err) { msg($('#adminMsg'), 'err', err.message); window.scrollTo(0, 0); })
          .then(function () { btn.disabled = false; btn.textContent = '💾 Simpan Pengaturan'; });
      });
      $('#pwForm').addEventListener('submit', function (e) {
        e.preventDefault();
        call({ action: 'changePassword', newPassword: $('#newPw').value }).then(function () {
          $('#newPw').value = ''; sessionStorage.removeItem('mtna_defpw'); msg($('#adminMsg'), 'ok', 'Password berhasil diganti. Gunakan password baru saat masuk berikutnya.'); window.scrollTo(0, 0);
        }).catch(function (err) { msg($('#adminMsg'), 'err', err.message); });
      });
    }).catch(function (err) { box.innerHTML = ''; msg($('#adminMsg'), 'err', err.message); });
  }

  /* ================= Mulai ================= */
  U.bindToggles();
  if (token()) showDash(); else showLogin();
})();
