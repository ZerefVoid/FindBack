const express = require('express');
const { query } = require('../db');
const { BATAS_LAPORAN, STATUS_AKTIF, KOLOM_LAPORAN_PUBLIK } = require('../config');
const asyncHandler = require('../middleware/asyncHandler');
const { harusLogin } = require('../middleware/auth');
const { upload, urlFoto } = require('../middleware/upload');
const { cocokkanLaporan } = require('../services/pencocokan');
const { kirimNotif } = require('../utils/notifikasi');
const { kirimError } = require('../utils/respond');

const router = express.Router();

// Status yang tidak boleh dilihat publik
const STATUS_TERSEMBUNYI = ['menunggu_persetujuan', 'ditutup', 'ditolak', 'dicabut'];

// ---- Daftar laporan (publik) ----
router.get('/', asyncHandler(async (req, res) => {
  const { jenis, kategori, q, status } = req.query;

  const kondisi = ["l.status IN ('hilang','ditemukan','dalam_klaim','dikembalikan')"];
  const params = [];

  if (jenis) {
    kondisi.push('l.jenis=?');
    params.push(jenis);
  }
  if (kategori) {
    kondisi.push('k.nama=?');
    params.push(kategori);
  }
  if (status) {
    kondisi.push('l.status=?');
    params.push(status);
  }
  if (q) {
    kondisi.push('(l.judul LIKE ? OR l.deskripsi LIKE ? OR l.lokasi_cerita LIKE ?)');
    params.push(...Array(3).fill('%' + q + '%'));
  }

  const laporan = await query(
    `SELECT ${KOLOM_LAPORAN_PUBLIK}
     FROM laporan l JOIN kategori k ON k.id=l.kategori_id
     WHERE ${kondisi.join(' AND ')}
     ORDER BY l.id DESC LIMIT 100`,
    params
  );
  res.json(laporan);
}));

// ---- Laporan milik saya (harus didefinisikan sebelum '/:id') ----
router.get('/saya', harusLogin, asyncHandler(async (req, res) => {
  const laporan = await query(
    `SELECT ${KOLOM_LAPORAN_PUBLIK},
            l.ciri_rahasia,
            (SELECT id FROM klaim WHERE laporan_temuan_id=l.id AND status='dipilih') klaim_dipilih
     FROM laporan l JOIN kategori k ON k.id=l.kategori_id
     WHERE l.pengguna_id=?
     ORDER BY l.id DESC`,
    [req.session.uid]
  );
  res.json(laporan);
}));

// ---- Detail laporan ----
router.get('/:id', asyncHandler(async (req, res) => {
  const [laporan] = await query(
    `SELECT ${KOLOM_LAPORAN_PUBLIK}, l.ciri_rahasia
     FROM laporan l JOIN kategori k ON k.id=l.kategori_id
     WHERE l.id=?`,
    [req.params.id]
  );

  const me = req.session.uid;
  const isAdmin = me && (await query("SELECT 1 FROM pengguna WHERE id=? AND peran='admin'", [me])).length > 0;

  const tidakBolehDilihat = !laporan || (!isAdmin && STATUS_TERSEMBUNYI.includes(laporan.status));
  if (tidakBolehDilihat) return kirimError(res, 404, 'Laporan tidak ditemukan');

  const milikSaya = laporan.pengguna_id === me;

  // Ciri rahasia hanya untuk pemilik laporan dan admin
  if (!milikSaya && !isAdmin) delete laporan.ciri_rahasia;
  laporan.admin = isAdmin;

  if (me && laporan.jenis === 'temuan') {
    if (milikSaya || isAdmin) {
      // Penemu dan admin melihat semua klaim
      laporan.klaim = await query(
        `SELECT c.id,c.status,p.nama,c.pengklaim_id
         FROM klaim c JOIN pengguna p ON p.id=c.pengklaim_id
         WHERE c.laporan_temuan_id=?`,
        [laporan.id]
      );
    } else {
      // Pengguna lain hanya melihat klaimnya sendiri
      laporan.klaim = await query(
        'SELECT id,status FROM klaim WHERE laporan_temuan_id=? AND pengklaim_id=?',
        [laporan.id, me]
      );
    }
  }

  laporan.milik_saya = milikSaya;
  res.json(laporan);
}));

// ---- Buat laporan ----
router.post('/', harusLogin, upload.single('foto'), asyncHandler(async (req, res) => {
  const b = req.body;
  const me = req.session.uid;

  const [aktif] = await query(
    `SELECT COUNT(*) c FROM laporan WHERE pengguna_id=? AND status IN ${STATUS_AKTIF}`,
    [me]
  );
  if (aktif.c >= BATAS_LAPORAN) {
    return kirimError(res, 409, 'Kamu sudah punya 3 laporan aktif. Selesaikan atau cabut salah satu.');
  }

  const jenisValid = ['hilang', 'temuan'].includes(b.jenis);
  if (!jenisValid || !b.kategori_id || !b.judul || !b.tanggal_kejadian) {
    return kirimError(res, 400, 'Lengkapi isian wajib');
  }

  const temuan = b.jenis === 'temuan';

  if (temuan && (!req.file || !b.ciri_rahasia || !b.posisi_barang)) {
    return kirimError(res, 400, 'Temuan wajib foto, ciri rahasia, dan posisi barang');
  }
  if (temuan && b.posisi_barang === 'staf_satpam' && !b.kondisi_titipan) {
    return kirimError(res, 400, 'Ceritakan kondisinya');
  }

  const hasil = await query(
    `INSERT INTO laporan(
       pengguna_id,jenis,kategori_id,judul,deskripsi,tanggal_kejadian,lokasi_cerita,
       ciri_rahasia,posisi_barang,kondisi_titipan,reward,status,foto_url,ktm
     ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      me,
      b.jenis,
      b.kategori_id,
      b.judul,
      b.deskripsi || '',
      b.tanggal_kejadian,
      b.lokasi_cerita || '',
      temuan ? b.ciri_rahasia : null,
      temuan ? b.posisi_barang : null,
      temuan ? b.kondisi_titipan || null : null,
      b.reward || null,
      temuan ? 'ditemukan' : 'hilang',
      urlFoto(req.file),
      b.ktm === '1' ? 1 : 0,
    ]
  );

  await cocokkanLaporan(hasil.insertId);
  res.json({ id: hasil.insertId });
}));

// ---- Cabut laporan ----
router.post('/:id/cabut', harusLogin, asyncHandler(async (req, res) => {
  const hasil = await query(
    "UPDATE laporan SET status='dicabut' WHERE id=? AND pengguna_id=? AND status IN ('hilang','ditemukan')",
    [req.params.id, req.session.uid]
  );
  if (!hasil.affectedRows) return kirimError(res, 409, 'Laporan tidak dapat dicabut');

  await query("UPDATE klaim SET status='ditutup' WHERE laporan_temuan_id=? AND status='chat'", [req.params.id]);
  res.json({ ok: true });
}));

// ---- Mulai klaim ("Ini barang saya") ----
router.post('/:id/klaim', harusLogin, asyncHandler(async (req, res) => {
  const me = req.session.uid;

  const [laporan] = await query(
    "SELECT * FROM laporan WHERE id=? AND jenis='temuan' AND status='ditemukan'",
    [req.params.id]
  );
  if (!laporan) return kirimError(res, 404, 'Laporan tidak tersedia');
  if (laporan.pengguna_id === me) return kirimError(res, 409, 'Ini laporanmu sendiri');

  // Kalau sudah pernah klaim, pakai klaim yang lama
  const [klaimLama] = await query(
    'SELECT id,status FROM klaim WHERE laporan_temuan_id=? AND pengklaim_id=?',
    [laporan.id, me]
  );
  if (klaimLama) {
    if (klaimLama.status === 'dibatalkan') return kirimError(res, 409, 'Klaim kamu dibatalkan penemu');
    return res.json({ id: klaimLama.id });
  }

  // Hubungkan dengan laporan hilang terbaru milik pengklaim di kategori yang sama (kalau ada)
  const [laporanHilang] = await query(
    `SELECT id FROM laporan
     WHERE pengguna_id=? AND jenis='hilang' AND kategori_id=? AND status='hilang'
     ORDER BY id DESC LIMIT 1`,
    [me, laporan.kategori_id]
  );

  const hasil = await query(
    'INSERT INTO klaim(laporan_temuan_id,pengklaim_id,laporan_hilang_id) VALUES(?,?,?)',
    [laporan.id, me, laporanHilang ? laporanHilang.id : null]
  );

  await kirimNotif(laporan.pengguna_id, 'Ada yang mengklaim barang temuanmu.', String(laporan.id));
  res.json({ id: hasil.insertId });
}));

// ---- Edit laporan ----
router.put('/:id', harusLogin, upload.single('foto'), asyncHandler(async (req, res) => {
  const me = req.session.uid;
  const b = req.body;

  const [laporan] = await query('SELECT * FROM laporan WHERE id=? AND pengguna_id=?', [req.params.id, me]);
  if (!laporan || !['hilang', 'ditemukan', 'dalam_klaim'].includes(laporan.status)) {
    return kirimError(res, 409, 'Laporan ini tidak dapat diedit');
  }

  // Selama ada klaim aktif, ciri-ciri dan ciri rahasia dikunci
  const klaimAktif = await query(
    "SELECT pengklaim_id FROM klaim WHERE laporan_temuan_id=? AND status IN ('chat','dipilih')",
    [laporan.id]
  );
  const terkunci = klaimAktif.length > 0;
  const temuan = laporan.jenis === 'temuan';

  if (!b.kategori_id || !b.judul || !b.tanggal_kejadian || !b.lokasi_cerita) {
    return kirimError(res, 400, 'Lengkapi isian wajib');
  }
  if (temuan && (!b.posisi_barang || (b.posisi_barang === 'staf_satpam' && !b.kondisi_titipan))) {
    return kirimError(res, 400, 'Lengkapi posisi barang');
  }

  const deskripsi = terkunci ? laporan.deskripsi : b.deskripsi || '';
  const ciriRahasia = temuan ? (terkunci ? laporan.ciri_rahasia : b.ciri_rahasia) : null;
  const posisiBarang = temuan ? b.posisi_barang : null;
  const kondisiTitipan = temuan ? (b.posisi_barang === 'staf_satpam' ? b.kondisi_titipan : null) : null;
  const reward = temuan ? null : b.reward || null;
  const fotoUrl = req.file ? urlFoto(req.file) : laporan.foto_url;

  await query(
    `UPDATE laporan SET
       kategori_id=?,judul=?,tanggal_kejadian=?,lokasi_cerita=?,deskripsi=?,
       ciri_rahasia=?,posisi_barang=?,kondisi_titipan=?,reward=?,foto_url=?
     WHERE id=?`,
    [
      b.kategori_id, b.judul, b.tanggal_kejadian, b.lokasi_cerita, deskripsi,
      ciriRahasia, posisiBarang, kondisiTitipan, reward, fotoUrl,
      laporan.id,
    ]
  );

  // Beri tahu semua pengklaim yang sedang aktif
  for (const klaim of klaimAktif) {
    await kirimNotif(
      klaim.pengklaim_id,
      'Laporan diperbarui: penemu memperbarui laporan "' + b.judul + '".',
      String(laporan.id)
    );
  }

  res.json({ ok: true });
}));

module.exports = router;
