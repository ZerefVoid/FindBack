const express = require('express');
const { query } = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM kategori ORDER BY urutan'));
}));

module.exports = router;
