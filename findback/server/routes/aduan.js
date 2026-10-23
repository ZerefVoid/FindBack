const express = require('express');
const { query } = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { harusLogin } = require('../middleware/auth');
const { kirimError } = require('../utils/respond');

const router = express.Router();

const BATAS_ADUAN_PER_HARI = 5;
const PELAPOR_UNTUK_TANGGUHKAN = 3;

// Kirim aduan terhadap sebuah laporan (jenis 'laporan', target = id laporan)
// atau sebuah pesan chat (jenis 'pesan', target = "idKlaim:idPesan")
router.post('/', harusLogin, asyncHandler(async (req, res) => {
  const me = req.session.uid;
  const { jenis, target, alasan, keterangan } = req.body;

  let pemilikId;        // pemilik laporan/pesan yang diadukan
  let laporanId = null; // hanya terisi kalau yang diadukan adalah laporan

  if (jenis === 'laporan') {
    const [laporan] = await query('SELECT id,pengguna_id,status FROM laporan WHERE id=?', [target]);
    if (!laporan) return kirimError(res, 404, 'Laporan tidak ditemukan');

    pemilikId = laporan.pengguna_id;
    laporanId = laporan.id;
  } else {
    const [klaimId, pesanId] = String(target).split(':');
    const [pesan] = await query(
      `SELECT m.pengirim_id, c.pengklaim_id, l.pengguna_id penemu
       FROM pesan m
       JOIN klaim c ON c.id=m.klaim_id
       JOIN laporan l ON l.id=c.laporan_temuan_id
       WHERE m.id=? AND c.id=?`,
      [pesanId, klaimId]
    );

    // Hanya peserta chat yang boleh mengadukan pesannya
    if (!pesan || ![pesan.pengklaim_id, pesan.penemu].includes(me)) {
      return kirimError(res, 403, 'Tidak punya akses');
    }
    pemilikId = pesan.pengirim_id;
  }

  if (pemilikId === me) {
    return kirimError(res, 400, 'Kamu tidak bisa mengadukan laporan atau pesanmu sendiri.');
  }

  const sudahDiadukan = await query(
    'SELECT 1 FROM aduan WHERE pelapor_id=? AND jenis=? AND target_id=?',
    [me, jenis, String(target)]
  );
  if (sudahDiadukan.length) return kirimError(res, 409, 'Kamu sudah mengadukan ini.');

  const [aduanHariIni] = await query(
    'SELECT COUNT(*) c FROM aduan WHERE pelapor_id=? AND dibuat_pada>NOW()-INTERVAL 1 DAY',
    [me]
  );
  if (aduanHariIni.c >= BATAS_ADUAN_PER_HARI) {
    return kirimError(res, 429, 'Batas aduan hari ini sudah tercapai.');
  }

  await query(
    'INSERT INTO aduan(pelapor_id,jenis,target_id,alasan,keterangan) VALUES(?,?,?,?,?)',
    [me, jenis, String(target), alasan, (keterangan || '').slice(0, 255)]
  );

  // Laporan yang diadukan 3 orang berbeda disembunyikan sementara sampai ditinjau admin
  if (laporanId) {
    const [pelaporBerbeda] = await query(
      "SELECT COUNT(DISTINCT pelapor_id) c FROM aduan WHERE jenis='laporan' AND target_id=?",
      [String(laporanId)]
    );
    if (pelaporBerbeda.c >= PELAPOR_UNTUK_TANGGUHKAN) {
      await query(
        `UPDATE laporan SET status_sebelum=status, status='menunggu_persetujuan'
         WHERE id=? AND status IN ('hilang','ditemukan','dalam_klaim')`,
        [laporanId]
      );
    }
  }

  res.json({ ok: true });
}));

module.exports = router;
