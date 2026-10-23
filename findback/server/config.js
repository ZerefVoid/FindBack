const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Maksimal laporan aktif per pengguna
const BATAS_LAPORAN = 3;

// Status yang dihitung sebagai laporan aktif (dipakai di klausa SQL "IN ...")
const STATUS_AKTIF = "('menunggu_persetujuan','hilang','ditemukan','dalam_klaim')";

// Kolom laporan yang boleh dilihat publik (tanpa ciri_rahasia)
const KOLOM_LAPORAN_PUBLIK = [
  'l.id', 'l.jenis', 'l.judul', 'l.deskripsi', 'l.tanggal_kejadian',
  'l.lokasi_cerita', 'l.posisi_barang', 'l.kondisi_titipan', 'l.reward',
  'l.status', 'l.foto_url', 'l.ktm', 'l.dibuat_pada', 'l.pengguna_id',
  'k.nama kategori',
].join(',');

// Lencana penemu: [minimal barang dikembalikan, nama]. Urut dari tertinggi.
const LENCANA = [
  [10, 'Pahlawan Kampus'],
  [5, 'Penemu Andal'],
  [1, 'Penemu Pertama'],
];

module.exports = { UPLOAD_DIR, BATAS_LAPORAN, STATUS_AKTIF, KOLOM_LAPORAN_PUBLIK, LENCANA };
