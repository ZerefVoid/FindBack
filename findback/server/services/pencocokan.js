const { query } = require('../db');
const { kirimNotif } = require('../utils/notifikasi');

const MS_PER_HARI = 864e5;
const SKOR_MINIMAL = 80;

// Kumpulan kata (minimal 3 huruf/angka) dari sebuah teks
const ambilKata = (teks) => new Set(String(teks || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []);

// Seberapa banyak kata yang sama antara dua kumpulan kata (0 sampai 1)
const tingkatIrisan = (a, b) => {
  let sama = 0;
  a.forEach((kata) => b.has(kata) && sama++);
  return sama / Math.max(1, Math.min(a.size, b.size));
};

// Makin dekat tanggal temuan dengan tanggal hilang, makin tinggi skornya
const skorSelisihHari = (hari) => (hari <= 1 ? 15 : hari <= 3 ? 12 : hari <= 7 ? 8 : 0);

// Cari laporan lawan (hilang <-> temuan) yang mirip, lalu beri tahu kedua pemilik
async function cocokkanLaporan(laporanId) {
  const [laporan] = await query('SELECT * FROM laporan WHERE id=?', [laporanId]);

  const kandidat = await query(
    "SELECT * FROM laporan WHERE jenis<>? AND kategori_id=? AND status IN ('hilang','ditemukan')",
    [laporan.jenis, laporan.kategori_id]
  );

  for (const lawan of kandidat) {
    const hilang = laporan.jenis === 'hilang' ? laporan : lawan;
    const temuan = laporan.jenis === 'hilang' ? lawan : laporan;

    // Barang tidak mungkin ditemukan sebelum hilang
    if (temuan.tanggal_kejadian < hilang.tanggal_kejadian) continue;

    const selisihHari = (new Date(temuan.tanggal_kejadian) - new Date(hilang.tanggal_kejadian)) / MS_PER_HARI;

    const kemiripanBarang = tingkatIrisan(
      ambilKata(hilang.judul + ' ' + hilang.deskripsi),
      ambilKata(temuan.judul + ' ' + temuan.deskripsi)
    );
    const kemiripanLokasi = tingkatIrisan(ambilKata(hilang.lokasi_cerita), ambilKata(temuan.lokasi_cerita));

    const skor = 40 + 30 * kemiripanBarang + skorSelisihHari(selisihHari) + 15 * kemiripanLokasi;

    if (skor >= SKOR_MINIMAL) {
      await kirimNotif(hilang.pengguna_id, 'Kemungkinan cocok: laporan hilangmu mirip laporan temuan.', String(temuan.id));
      await kirimNotif(temuan.pengguna_id, 'Kemungkinan cocok: laporan temuanmu mirip laporan hilang.', String(temuan.id));
    }
  }
}

module.exports = { cocokkanLaporan };
