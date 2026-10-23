require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const KATA_SANDI_DEMO = 'demo1234';

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'findback',
  });

  const hash = bcrypt.hashSync(KATA_SANDI_DEMO, 10);

  // Akun demo (dilewati kalau emailnya sudah ada)
  await db.query(
    `INSERT IGNORE INTO pengguna(nama,email,kata_sandi_hash,peran) VALUES
       ('Rina Maharani','rina@kampus.ac.id',?,'pengguna'),
       ('Budi Santoso','budi@kampus.ac.id',?,'pengguna'),
       ('Admin FindBack','admin@findback.id',?,'admin')`,
    [hash, hash, hash]
  );

  // Satu laporan contoh, hanya kalau tabel laporan masih kosong
  const [[jumlah]] = await db.query('SELECT COUNT(*) c FROM laporan');
  if (!jumlah.c) {
    await db.query(
      `INSERT INTO laporan(
         pengguna_id,jenis,kategori_id,judul,deskripsi,tanggal_kejadian,lokasi_cerita,
         ciri_rahasia,posisi_barang,status
       ) VALUES(
         1,'temuan',3,'HP Samsung hitam','Samsung hitam casing bening retak di pojok',CURDATE(),
         'Bangku depan perpustakaan lantai 1','Wallpaper gambar kucing','dipegang_penemu','ditemukan'
       )`
    );
  }

  console.log('Seed selesai');
  process.exit();
})();
