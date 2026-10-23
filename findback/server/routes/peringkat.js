const express = require('express');
const { query } = require('../db');
const { LENCANA } = require('../config');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

const inisial = (nama) => nama.split(' ').map((kata) => kata[0]).slice(0, 2).join('').toUpperCase();

// Lencana tertinggi yang sudah dicapai berdasarkan jumlah barang dikembalikan
const cariLencana = (jumlah) => {
  const lencana = LENCANA.find(([minimal]) => jumlah >= minimal);
  return lencana ? lencana[1] : null;
};

// ?periode=bulan untuk peringkat bulan ini, selain itu sepanjang waktu
router.get('/', asyncHandler(async (req, res) => {
  const filterBulan = req.query.periode === 'bulan'
    ? "WHERE r.dibuat_pada>=DATE_FORMAT(NOW(),'%Y-%m-01')"
    : '';

  const baris = await query(
    `SELECT p.nama, SUM(r.jumlah) poin, COUNT(*) n
     FROM riwayat_poin r JOIN pengguna p ON p.id=r.pengguna_id
     ${filterBulan}
     GROUP BY p.id
     ORDER BY poin DESC
     LIMIT 20`
  );

  res.json(baris.map((r) => ({
    inisial: inisial(r.nama),
    poin: +r.poin,
    lencana: cariLencana(r.n),
  })));
}));

module.exports = router;
