const express = require('express');
const { query } = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { harusLogin } = require('../middleware/auth');
const { upload, urlFoto } = require('../middleware/upload');
const { kirimNotif } = require('../utils/notifikasi');
const { kirimError } = require('../utils/respond');

const router = express.Router();

// Ambil klaim, hanya kalau pengguna saat ini adalah pengklaim atau penemunya.
// Kalau tidak berhak, balasan error sudah dikirim dan hasilnya null.
async function ambilKlaim(req, res) {
  const [klaim] = await query(
    `SELECT c.*,
            l.pengguna_id penemu_id,
            l.judul,
            (SELECT nama FROM pengguna WHERE id=c.pengklaim_id) pengklaim_nama
     FROM klaim c JOIN laporan l ON l.id=c.laporan_temuan_id
     WHERE c.id=?`,
    [req.params.id]
  );

  const berhak = klaim && [klaim.pengklaim_id, klaim.penemu_id].includes(req.session.uid);
  if (!berhak) {
    kirimError(res, 403, 'Tidak punya akses');
    return null;
  }
  return klaim;
}

// Handler untuk aksi yang hanya boleh dilakukan penemu
const hanyaPenemu = (aksi) =>
  asyncHandler(async (req, res) => {
    const klaim = await ambilKlaim(req, res);
    if (!klaim) return;
    if (req.session.uid !== klaim.penemu_id) return kirimError(res, 403, 'Hanya penemu');
    await aksi(req, res, klaim);
  });

// ---- Detail klaim ----
router.get('/:id', harusLogin, asyncHandler(async (req, res) => {
  const klaim = await ambilKlaim(req, res);
  if (!klaim) return;

  klaim.peran = req.session.uid === klaim.penemu_id ? 'penemu' : 'pemilik';
  res.json(klaim);
}));

// ---- Chat ----
// Ambil pesan yang id-nya lebih besar dari ?setelah= (dipakai untuk polling)
router.get('/:id/pesan', harusLogin, asyncHandler(async (req, res) => {
  const klaim = await ambilKlaim(req, res);
  if (!klaim) return;

  const pesan = await query(
    `SELECT id,pengirim_id,
            IF(disembunyikan,'Pesan disembunyikan admin',isi) isi,
            disembunyikan,dikirim_pada
     FROM pesan
     WHERE klaim_id=? AND id>?
     ORDER BY id`,
    [klaim.id, +req.query.setelah || 0]
  );
  res.json(pesan);
}));

router.post('/:id/pesan', harusLogin, asyncHandler(async (req, res) => {
  const klaim = await ambilKlaim(req, res);
  if (!klaim) return;

  const chatMasihBuka = ['chat', 'dipilih'].includes(klaim.status);
  if (!chatMasihBuka || !(req.body.isi || '').trim()) {
    return kirimError(res, 400, 'Pesan tidak dapat dikirim');
  }

  await query(
    'INSERT INTO pesan(klaim_id,pengirim_id,isi) VALUES(?,?,?)',
    [klaim.id, req.session.uid, req.body.isi.trim()]
  );

  const penerima = req.session.uid === klaim.penemu_id ? klaim.pengklaim_id : klaim.penemu_id;
  await kirimNotif(penerima, 'Pesan baru di chat klaim.', String(klaim.laporan_temuan_id));

  res.json({ ok: true });
}));

// ---- Aksi penemu ----

// Pilih pengklaim ini sebagai pemilik. Klaim lain yang masih berjalan ditutup.
router.post('/:id/pilih', harusLogin, hanyaPenemu(async (req, res, klaim) => {
  if (klaim.status !== 'chat') return kirimError(res, 409, 'Klaim tidak dapat dipilih');

  await query("UPDATE klaim SET status='dipilih' WHERE id=?", [klaim.id]);
  await query(
    "UPDATE klaim SET status='ditutup',ditutup_oleh_klaim_id=? WHERE laporan_temuan_id=? AND status='chat' AND id<>?",
    [klaim.id, klaim.laporan_temuan_id, klaim.id]
  );
  await query("UPDATE laporan SET status='dalam_klaim' WHERE id=?", [klaim.laporan_temuan_id]);

  await kirimNotif(
    klaim.pengklaim_id,
    'Kamu dipilih sebagai pemilik. Atur serah terima lewat chat.',
    String(klaim.laporan_temuan_id)
  );
  res.json({ ok: true });
}));

router.post('/:id/tolak', harusLogin, hanyaPenemu(async (req, res, klaim) => {
  await query("UPDATE klaim SET status='ditolak' WHERE id=? AND status='chat'", [klaim.id]);
  res.json({ ok: true });
}));

// Batalkan serah terima: klaim dibatalkan, laporan kembali "ditemukan",
// dan klaim lain yang tadinya ditutup karena pilihan ini dibuka lagi.
router.post('/:id/batalkan-serah-terima', harusLogin, hanyaPenemu(async (req, res, klaim) => {
  if (klaim.status !== 'dipilih') return kirimError(res, 409, 'Tidak dapat dibatalkan');

  await query("UPDATE klaim SET status='dibatalkan' WHERE id=?", [klaim.id]);
  await query(
    "UPDATE klaim SET status='chat',ditutup_oleh_klaim_id=NULL WHERE ditutup_oleh_klaim_id=?",
    [klaim.id]
  );
  await query("UPDATE laporan SET status='ditemukan' WHERE id=?", [klaim.laporan_temuan_id]);

  await kirimNotif(klaim.pengklaim_id, 'Serah terima dibatalkan penemu.', String(klaim.laporan_temuan_id));
  res.json({ ok: true });
}));

// Konfirmasi serah terima. Penemu dapat poin kalau melampirkan foto bukti.
router.post('/:id/serah-terima', harusLogin, upload.single('foto'), hanyaPenemu(async (req, res, klaim) => {
  if (klaim.status !== 'dipilih') return kirimError(res, 409, 'Klaim belum dipilih');

  await query("UPDATE klaim SET status='selesai',foto_bukti=? WHERE id=?", [urlFoto(req.file), klaim.id]);
  await query("UPDATE laporan SET status='dikembalikan' WHERE id=?", [klaim.laporan_temuan_id]);
  if (klaim.laporan_hilang_id) {
    await query("UPDATE laporan SET status='dikembalikan' WHERE id=?", [klaim.laporan_hilang_id]);
  }

  if (req.file) {
    // 10 poin untuk barang yang dikembalikan
    await query(
      "INSERT IGNORE INTO riwayat_poin(pengguna_id,laporan_id,jumlah,alasan) VALUES(?,?,10,'dikembalikan')",
      [klaim.penemu_id, klaim.laporan_temuan_id]
    );
    // Bonus 5 poin kalau dikembalikan dalam 3 hari sejak laporan dibuat
    await query(
      `INSERT IGNORE INTO riwayat_poin(pengguna_id,laporan_id,jumlah,alasan)
       SELECT ?,id,5,'bonus_cepat' FROM laporan
       WHERE id=? AND TIMESTAMPDIFF(DAY,dibuat_pada,NOW())<=3`,
      [klaim.penemu_id, klaim.laporan_temuan_id]
    );
  }

  await kirimNotif(klaim.pengklaim_id, 'Barangmu tercatat sudah dikembalikan.', String(klaim.laporan_temuan_id));
  res.json({ ok: true });
}));

module.exports = router;
