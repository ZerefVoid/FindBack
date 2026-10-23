const express = require('express');
const { query } = require('../db');
const { STATUS_AKTIF, KOLOM_LAPORAN_PUBLIK } = require('../config');
const asyncHandler = require('../middleware/asyncHandler');
const { harusAdmin } = require('../middleware/auth');
const { kirimNotif } = require('../utils/notifikasi');
const { kirimError } = require('../utils/respond');

const router = express.Router();

// Semua route di file ini hanya untuk admin
router.use(harusAdmin);

const KEPUTUSAN_VALID = ['laporan_sah', 'hapus_laporan', 'sembunyikan_pesan', 'peringatkan', 'tutup'];
const BATAS_PERINGATAN = 3;

// Catat tindakan admin ke log
const catatLog = (adminId, teks) =>
  query('INSERT INTO log_admin(admin_id,teks) VALUES(?,?)', [adminId, teks]);

// ---- Dashboard ----
router.get('/dashboard', asyncHandler(async (req, res) => {
  const hitung = async (sql) => (await query(sql))[0].c;

  // Aduan yang belum selesai ditampilkan lebih dulu
  const aduan = await query(
    `SELECT a.*, p.nama pelapor, pn.nama penangan,
            IF(a.jenis='laporan',(SELECT judul FROM laporan WHERE id=a.target_id),NULL) judul
     FROM aduan a
     JOIN pengguna p ON p.id=a.pelapor_id
     LEFT JOIN pengguna pn ON pn.id=a.penangan_id
     ORDER BY (a.status='selesai'), a.id DESC`
  );

  res.json({
    pengguna: await hitung('SELECT COUNT(*) c FROM pengguna'),
    aktif: await hitung(`SELECT COUNT(*) c FROM laporan WHERE status IN ${STATUS_AKTIF}`),
    kembali: await hitung("SELECT COUNT(*) c FROM laporan WHERE status='dikembalikan'"),
    terbuka: aduan.filter((a) => a.status !== 'selesai').length,
    aduan,
    users: await query(
      `SELECT p.id,p.nama,p.email,p.peran,p.aktif,
              (SELECT COUNT(*) FROM peringatan w WHERE w.pengguna_id=p.id) peringatan
       FROM pengguna p ORDER BY p.id`
    ),
    log: await query(
      `SELECT l.dibuat_pada,l.teks,p.nama admin
       FROM log_admin l JOIN pengguna p ON p.id=l.admin_id
       ORDER BY l.id DESC LIMIT 8`
    ),
  });
}));

// ---- Detail aduan ----
router.get('/aduan/:id', asyncHandler(async (req, res) => {
  const [aduan] = await query(
    `SELECT a.*, p.nama pelapor, pn.nama penangan
     FROM aduan a
     JOIN pengguna p ON p.id=a.pelapor_id
     LEFT JOIN pengguna pn ON pn.id=a.penangan_id
     WHERE a.id=?`,
    [req.params.id]
  );
  if (!aduan) return kirimError(res, 404, 'Tidak ada');

  const target = {};
  let pemilikId = null;

  if (aduan.jenis === 'laporan') {
    const [laporan] = await query(
      `SELECT ${KOLOM_LAPORAN_PUBLIK}, l.ciri_rahasia
       FROM laporan l JOIN kategori k ON k.id=l.kategori_id
       WHERE l.id=?`,
      [aduan.target_id]
    );
    target.laporan = laporan;
    pemilikId = laporan && laporan.pengguna_id;
  } else {
    const [klaimId, pesanId] = aduan.target_id.split(':');
    const [pesan] = await query(
      `SELECT m.id,m.klaim_id,m.pengirim_id,m.isi,m.disembunyikan,p.nama
       FROM pesan m JOIN pengguna p ON p.id=m.pengirim_id
       WHERE m.id=? AND m.klaim_id=?`,
      [pesanId, klaimId]
    );
    target.pesan = pesan;
    pemilikId = pesan && pesan.pengirim_id;
  }

  const pemilik = pemilikId
    ? (await query('SELECT id,nama,aktif FROM pengguna WHERE id=?', [pemilikId]))[0]
    : null;

  const peringatan = pemilik
    ? await query('SELECT alasan,dibuat_pada FROM peringatan WHERE pengguna_id=?', [pemilik.id])
    : [];

  // Jumlah aduan lain terhadap laporan atau pesan milik orang yang sama
  const aduanLain = pemilik
    ? (await query(
        `SELECT COUNT(*) c FROM aduan x
         WHERE x.id<>?
           AND (
             (x.jenis='laporan' AND x.target_id IN (SELECT id FROM laporan WHERE pengguna_id=?))
             OR
             (x.jenis='pesan' AND SUBSTRING_INDEX(x.target_id,':',-1) IN (SELECT id FROM pesan WHERE pengirim_id=?))
           )`,
        [aduan.id, pemilik.id, pemilik.id]
      ))[0].c
    : 0;

  res.json({ ...aduan, t: target, owner: pemilik, peringatan, lain: aduanLain });
}));

// ---- Mulai tinjau aduan ----
router.post('/aduan/:id/tinjau', asyncHandler(async (req, res) => {
  const hasil = await query(
    "UPDATE aduan SET status='diproses',penangan_id=?,diambil_pada=NOW() WHERE id=? AND status='baru'",
    [req.session.uid, req.params.id]
  );
  if (hasil.affectedRows) await catatLog(req.session.uid, 'Mulai tinjau aduan #' + req.params.id);

  res.json({ ok: true });
}));

// ---- Ambil alih aduan yang sudah lebih dari 24 jam ditangani admin lain ----
router.post('/aduan/:id/ambil', asyncHandler(async (req, res) => {
  const hasil = await query(
    `UPDATE aduan SET penangan_id=?,diambil_pada=NOW()
     WHERE id=? AND status='diproses' AND diambil_pada<NOW()-INTERVAL 24 HOUR`,
    [req.session.uid, req.params.id]
  );
  if (!hasil.affectedRows) return kirimError(res, 409, 'Belum bisa diambil alih');

  await catatLog(req.session.uid, 'Ambil alih aduan #' + req.params.id);
  res.json({ ok: true });
}));

// ---- Buka seluruh chat klaim (aksesnya dicatat di log) ----
router.get('/klaim/:cid/pesan', asyncHandler(async (req, res) => {
  await catatLog(req.session.uid, 'Akses chat klaim #' + req.params.cid + ' (aduan #' + req.query.aduan + ')');

  const pesan = await query(
    `SELECT m.id, p.nama, IF(m.disembunyikan,NULL,m.isi) isi, m.disembunyikan
     FROM pesan m JOIN pengguna p ON p.id=m.pengirim_id
     WHERE m.klaim_id=?
     ORDER BY m.id`,
    [req.params.cid]
  );
  res.json(pesan);
}));

// ---- Putuskan aduan ----
router.post('/aduan/:id/putus', asyncHandler(async (req, res) => {
  const keputusan = req.body.keputusan;

  const [aduan] = await query(
    "SELECT * FROM aduan WHERE id=? AND status='diproses' AND penangan_id=?",
    [req.params.id, req.session.uid]
  );
  if (!aduan || !KEPUTUSAN_VALID.includes(keputusan)) {
    return kirimError(res, 409, 'Tidak dapat diputuskan');
  }

  let pemilikId = null;
  let laporanId = null;
  let note = '';

  if (aduan.jenis === 'laporan') {
    const [laporan] = await query('SELECT * FROM laporan WHERE id=?', [aduan.target_id]);
    if (laporan) {
      pemilikId = laporan.pengguna_id;
      laporanId = laporan.id;
    }
  } else {
    const pesanId = aduan.target_id.split(':')[1];
    const [pesan] = await query('SELECT pengirim_id FROM pesan WHERE id=?', [pesanId]);
    pemilikId = pesan && pesan.pengirim_id;
  }

  // Laporan dinyatakan sah: tayang lagi dengan status sebelumnya
  if (keputusan === 'laporan_sah' && laporanId) {
    await query(
      `UPDATE laporan
       SET status=COALESCE(status_sebelum,IF(jenis='hilang','hilang','ditemukan'))
       WHERE id=? AND status='menunggu_persetujuan'`,
      [laporanId]
    );
  }

  // Hapus laporan (hapus lunak): klaim yang masih berjalan ditutup
  if (keputusan === 'hapus_laporan' && laporanId) {
    await query("UPDATE laporan SET status='ditolak' WHERE id=?", [laporanId]);
    await query("UPDATE klaim SET status='ditutup' WHERE laporan_temuan_id=? AND status='chat'", [laporanId]);
  }

  if (keputusan === 'sembunyikan_pesan' && aduan.jenis === 'pesan') {
    await query('UPDATE pesan SET disembunyikan=1 WHERE id=?', [aduan.target_id.split(':')[1]]);
  }

  if (keputusan === 'peringatkan' && pemilikId) {
    await query(
      'INSERT INTO peringatan(pengguna_id,aduan_id,alasan) VALUES(?,?,?)',
      [pemilikId, aduan.id, aduan.alasan]
    );
    await kirimNotif(
      pemilikId,
      'Peringatan dari admin: laporan atau pesanmu melanggar aturan: ' + aduan.alasan + '.',
      null
    );

    const [jumlahPeringatan] = await query('SELECT COUNT(*) c FROM peringatan WHERE pengguna_id=?', [pemilikId]);
    if (jumlahPeringatan.c >= BATAS_PERINGATAN) note = ' Pengguna mencapai batas peringatan.';
  }

  await query(
    "UPDATE aduan SET status='selesai',keputusan=?,catatan=? WHERE id=?",
    [keputusan, req.body.catatan || '', aduan.id]
  );
  await catatLog(req.session.uid, 'Keputusan aduan #' + aduan.id + ': ' + keputusan);
  await kirimNotif(aduan.pelapor_id, 'Aduanmu sudah ditinjau. Terima kasih sudah melapor.', null);

  res.json({ ok: true, note });
}));

// ---- Aktifkan / nonaktifkan akun ----
router.post('/akun/:id', asyncHandler(async (req, res) => {
  if (+req.params.id === req.session.uid) return kirimError(res, 400, 'Tidak bisa pada akun sendiri');

  await query('UPDATE pengguna SET aktif=1-aktif WHERE id=?', [req.params.id]);
  const [pengguna] = await query('SELECT nama,aktif FROM pengguna WHERE id=?', [req.params.id]);

  await catatLog(req.session.uid, (pengguna.aktif ? 'Aktifkan' : 'Nonaktifkan') + ' akun ' + pengguna.nama);
  res.json({ aktif: pengguna.aktif });
}));

module.exports = router;
