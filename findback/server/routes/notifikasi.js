const express = require('express');
const { query } = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { harusLogin } = require('../middleware/auth');

const router = express.Router();

// Ambil 50 notifikasi terbaru lalu tandai semuanya sudah dibaca
router.get('/', harusLogin, asyncHandler(async (req, res) => {
  const notifikasi = await query(
    'SELECT * FROM notifikasi WHERE pengguna_id=? ORDER BY id DESC LIMIT 50',
    [req.session.uid]
  );
  await query('UPDATE notifikasi SET sudah_dibaca=1 WHERE pengguna_id=?', [req.session.uid]);
  res.json(notifikasi);
}));

module.exports = router;
