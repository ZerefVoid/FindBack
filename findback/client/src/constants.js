// Label status laporan
export const STAT = {
  hilang: 'Hilang',
  ditemukan: 'Ditemukan',
  dalam_klaim: 'Dalam proses klaim',
  dikembalikan: 'Dikembalikan',
  ditutup: 'Ditutup',
  dicabut: 'Dicabut',
};

// Label status aduan (admin)
export const ASTAT = {
  baru: 'Baru',
  diproses: 'Diproses',
  selesai: 'Selesai',
};

// Status yang dihitung sebagai laporan aktif
export const ACTIVE = ['hilang', 'ditemukan', 'dalam_klaim'];

// Posisi barang temuan: kode di database -> teks yang ditampilkan
export const POS = {
  dipegang_penemu: 'Saya yang memegang',
  kemahasiswaan: 'Dititipkan di kemahasiswaan',
  staf_satpam: 'Dititipkan ke staf atau satpam',
};

// Lencana: [nama, minimal barang dikembalikan]
export const BADGES = [
  ['Penemu Pertama', 1],
  ['Penemu Andal', 5],
  ['Pahlawan Kampus', 10],
];

// Langkah "Cara kerja": [label, judul, penjelasan]
export const HOW = [
  ['1. Lapor', 'Buat laporan', 'Isi kategori, ciri, lokasi, dan tanggal. Penemu wajib menyertakan foto.'],
  ['2. Cocokkan', 'Dicocokkan otomatis', 'Sistem menampilkan kemungkinan cocok dan memberi tahu kedua pihak.'],
  ['3. Verifikasi', 'Chat langsung', 'Penemu bertanya ciri rahasia lewat chat untuk memastikan pemilik asli.'],
  ['4. Serah terima', 'Bertemu di tempat aman', 'Pos satpam atau kantor kemahasiswaan, lalu penemu mengonfirmasi serah terima.'],
];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Tanggal hari ini (YYYY-MM-DD), dipakai sebagai batas maksimal input tanggal
export const TODAY = new Date().toISOString().slice(0, 10);
