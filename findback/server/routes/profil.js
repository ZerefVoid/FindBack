const express = require('express');
const { query } = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { harusLogin } = require('../middleware/auth');

const router = express.Router();

router.get('/', harusLogin, asyncHandler(async (req, res) => {
  const me = req.session.uid;

  const [pengguna] = await query('SELECT nama,dibuat_pada FROM pengguna WHERE id=?', [me]);

  // Total poin dan jumlah barang yang dikembalikan
  const [ringkasan] = await query(
    `SELECT COALESCE(SUM(jumlah),0) poin,
            COUNT(DISTINCT CASE WHEN alasan='dikembalikan' THEN laporan_id END) n
     FROM riwayat_poin WHERE pengguna_id=?`,
    [me]
  );

  // Urutan seluruh penemu bulan ini, untuk mencari peringkat saya
  const peringkatBulanIni = await query(
    `SELECT pengguna_id FROM riwayat_poin
     WHERE dibuat_pada>=DATE_FORMAT(NOW(),'%Y-%m-01')
     GROUP BY pengguna_id
     ORDER BY SUM(jumlah) DESC`
  );

  const riwayat = await query(
    `SELECT r.jumlah,r.alasan,r.dibuat_pada,l.judul
     FROM riwayat_poin r LEFT JOIN laporan l ON l.id=r.laporan_id
     WHERE r.pengguna_id=?
     ORDER BY r.id DESC`,
    [me]
  );

  res.json({
    nama: pengguna.nama,
    gabung: pengguna.dibuat_pada,
    poin: +ringkasan.poin,
    n: ringkasan.n,
    rank: peringkatBulanIni.findIndex((x) => x.pengguna_id === me) + 1,
    riwayat,
  });
}));

module.exports = router;
