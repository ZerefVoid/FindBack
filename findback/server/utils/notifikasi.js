const { query } = require('../db');

const kirimNotif = (penggunaId, isi, tautan) =>
  query('INSERT INTO notifikasi(pengguna_id,isi,tautan) VALUES(?,?,?)', [penggunaId, isi, tautan]);

module.exports = { kirimNotif };
