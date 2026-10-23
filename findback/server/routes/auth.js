const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { query } = require('../db');
const { BATAS_LAPORAN, STATUS_AKTIF } = require('../config');
const asyncHandler = require('../middleware/asyncHandler');
const { kirimError } = require('../utils/respond');

const router = express.Router();

// Maksimal 10 percobaan masuk per 15 menit
const batasPercobaanMasuk = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Terlalu banyak percobaan masuk' },
});

router.post('/daftar', asyncHandler(async (req, res) => {
  const { nama, email, kata_sandi } = req.body;

  if (!nama || !email || !kata_sandi || kata_sandi.length < 8) {
    return kirimError(res, 400, 'Isi nama, email, dan kata sandi (min. 8 karakter)');
  }

  const sudahAda = await query('SELECT id FROM pengguna WHERE email=?', [email]);
  if (sudahAda.length) return kirimError(res, 409, 'Email sudah terdaftar');

  const hasil = await query(
    'INSERT INTO pengguna(nama,email,kata_sandi_hash) VALUES(?,?,?)',
    [nama, email, await bcrypt.hash(kata_sandi, 10)]
  );

  req.session.uid = hasil.insertId;
  res.json({ ok: true });
}));

router.post('/masuk', batasPercobaanMasuk, asyncHandler(async (req, res) => {
  const [pengguna] = await query('SELECT * FROM pengguna WHERE email=?', [req.body.email]);

  const sandiBenar = pengguna && (await bcrypt.compare(req.body.kata_sandi || '', pengguna.kata_sandi_hash));
  if (!sandiBenar) return kirimError(res, 401, 'Email atau kata sandi salah');

  if (!pengguna.aktif) return kirimError(res, 403, 'Akun dinonaktifkan');

  req.session.uid = pengguna.id;
  res.json({ ok: true });
}));

router.post('/keluar', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Data pengguna yang sedang login (null kalau belum login)
router.get('/saya', asyncHandler(async (req, res) => {
  if (!req.session.uid) return res.json(null);

  const [pengguna] = await query('SELECT id,nama,email,peran FROM pengguna WHERE id=?', [req.session.uid]);

  const [aktif] = await query(
    `SELECT COUNT(*) c FROM laporan WHERE pengguna_id=? AND status IN ${STATUS_AKTIF}`,
    [pengguna.id]
  );
  const [belumDibaca] = await query(
    'SELECT COUNT(*) c FROM notifikasi WHERE pengguna_id=? AND sudah_dibaca=0',
    [pengguna.id]
  );

  res.json({
    ...pengguna,
    laporan_aktif: aktif.c,
    batas: BATAS_LAPORAN,
    belum_dibaca: belumDibaca.c,
  });
}));

module.exports = router;
