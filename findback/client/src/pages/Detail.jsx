import { useState, useEffect, useCallback, useContext } from 'react';
import { Ctx } from '../context.js';
import { api } from '../api.js';
import { STAT, POS, ACTIVE } from '../constants.js';
import { fmt, ini } from '../utils.js';
import Foto from '../components/Foto.jsx';
import Chat from '../components/Chat.jsx';

const LANGKAH = ['Hilang', 'Ditemukan', 'Dalam klaim', 'Dikembalikan'];

export default function Detail({ id, user, go, reload }) {
  const D = useContext(Ctx);
  const [r, setR] = useState();
  const [error, setError] = useState('');
  const [klaimBaruId, setKlaimBaruId] = useState(); // id klaim yang baru saja dimulai
  const [tabKlaim, setTabKlaim] = useState();       // klaim yang sedang dibuka (penemu/admin)

  const muat = useCallback(
    () => api('/laporan/' + id).then(setR).catch((x) => setError(x.message)),
    [id]
  );
  useEffect(() => { muat(); }, [muat]);

  if (error) return <div className="pg"><div className="panel">{error}</div></div>;
  if (!r) return null;

  // ---- Turunan data ----
  const milikSaya = r.milik_saya;
  const adminLain = r.admin && !milikSaya; // admin yang melihat laporan orang lain
  const daftarKlaim = Array.isArray(r.klaim) ? r.klaim : [];
  const klaimSaya = !milikSaya && r.klaim && r.klaim[0];
  const klaimAktifId = klaimBaruId || (klaimSaya && klaimSaya.id);
  const klaimDibuka = daftarKlaim.find((c) => c.id === tabKlaim) || daftarKlaim[0];

  // Posisi pada indikator langkah (0 sampai 3)
  let langkah;
  if (r.status === 'ditemukan' || r.status === 'hilang') langkah = r.jenis === 'hilang' ? 0 : 1;
  else if (r.status === 'dalam_klaim') langkah = 2;
  else langkah = 3;

  // ---- Aksi ----
  const tombolLaporkan = (
    <button className="btn warn" onClick={() => D.setDlg({ t: 'rpt', id: r.id })}>Laporkan</button>
  );

  const mulaiKlaim = async () => {
    try {
      const klaim = await api(`/laporan/${id}/klaim`, { body: {} });
      setKlaimBaruId(klaim.id);
      muat();
    } catch (x) {
      D.setDlg({ t: 'ok', title: 'Tidak dapat mengklaim', msg: x.message });
    }
  };

  // Panel kanan sederhana: judul, teks, dan tombol
  const panelAksi = (judul, teks, tombol) => (
    <div className="panel stk">
      <h2 style={{ fontSize: 22 }}>{judul}</h2>
      <p>{teks}</p>
      {tombol}
    </div>
  );

  // ---- Kolom kiri: informasi laporan ----
  const kolomKiri = (
    <div className="panel">
      <div className="steps4">
        {LANGKAH.map((s, i) => (
          <span key={s} className={i === langkah ? 'on' : ''}>{s}</span>
        ))}
      </div>

      <Foto r={r} tinggi={200} />
      <h2 style={{ fontSize: 26, margin: '16px 0 8px' }}>{r.judul}</h2>
      <span className={'badge s-' + r.status}>{STAT[r.status]}</span>

      <div className="rows" style={{ marginTop: 8 }}>
        <div><b>Kategori</b><span>{r.kategori}</span></div>
        <div>
          <b>{r.jenis === 'temuan' ? 'Ditemukan di' : 'Terakhir terlihat'}</b>
          <span>{r.lokasi_cerita}</span>
        </div>
        <div><b>Tanggal</b><span>{fmt(r.tanggal_kejadian)}</span></div>
        {r.jenis === 'temuan' && (
          <div><b>Posisi barang</b><span>{POS[r.posisi_barang]}</span></div>
        )}
        {r.jenis === 'temuan' && r.kondisi_titipan && (
          <div><b>Kondisi</b><span>{r.kondisi_titipan}</span></div>
        )}
        <div>
          <b>{r.jenis === 'temuan' ? 'Penemu' : 'Pelapor'}</b>
          <span>Pengguna FindBack</span>
        </div>
      </div>

      <p style={{ margin: '14px 0', fontSize: 14, color: 'var(--fg2)' }}>{r.deskripsi}</p>

      {r.jenis === 'temuan' &&
        (milikSaya || adminLain ? (
          <div className="tipbox">
            <b>Ciri rahasia (hanya penemu{adminLain ? ' dan admin' : ''}):</b> {r.ciri_rahasia}
          </div>
        ) : (
          <div className="tipbox">
            Ciri rahasia disembunyikan. Hanya penemu yang mengetahuinya dan memakainya untuk verifikasi.
          </div>
        ))}

      {milikSaya && ACTIVE.includes(r.status) && (
        <div style={{ marginTop: 14 }}>
          <button className="btn net" onClick={() => go('edit', r.id)}>Edit laporan</button>
        </div>
      )}
    </div>
  );

  // ---- Kolom kanan: isinya tergantung siapa yang melihat dan status laporan ----
  let kolomKanan;

  if (!user) {
    // Belum login
    kolomKanan = (
      <div className="panel" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 22 }}>Barang ini milikmu?</h2>
        <p>Masuk untuk menghubungi penemu dan membuktikan kepemilikan lewat chat.</p>
        <button className="btn pri lg" onClick={() => go('masuk')}>Masuk</button>
        <button className="btn out lg" onClick={() => go('daftar')}>Daftar</button>
        <div className="info">
          Ciri rahasia dan nama lengkap penemu hanya terlihat setelah masuk dan klaim disetujui.
        </div>
      </div>
    );
  } else if (r.jenis === 'hilang') {
    // Laporan barang hilang
    if (milikSaya || adminLain) {
      kolomKanan = (
        <div className="panel stk">
          <h2 style={{ fontSize: 20 }}>{milikSaya ? 'Laporan hilangmu' : 'Laporan hilang'}</h2>
          <p className="sm">
            Pemilik akan diberi tahu saat ada laporan temuan yang cocok. Penemu menghubungimu lewat
            chat setelah kamu menekan Ini barang saya pada laporan temuan.
          </p>
          {!milikSaya && tombolLaporkan}
        </div>
      );
    } else {
      kolomKanan = panelAksi(
        'Kamu menemukan barang ini?',
        'Buat laporan temuan dengan foto dan ciri rahasia. Sistem akan memberi tahu pemilik.',
        <>
          <button className="btn pri lg" onClick={() => go('lapor', 'temuan')}>Buat laporan temuan</button>
          {tombolLaporkan}
        </>
      );
    }
  } else if (milikSaya || adminLain) {
    // Laporan temuan, dilihat penemu atau admin: daftar klaim + chat
    kolomKanan = (
      <div className="panel chat">
        <h3 style={{ fontSize: 20 }}>{adminLain ? 'Klaim pada laporan ini' : 'Chat dengan pengklaim'}</h3>
        {daftarKlaim.length ? (
          <>
            <div className="chips" style={{ margin: 0 }}>
              {daftarKlaim.map((c) => (
                <span
                  key={c.id}
                  className={'chip ' + (c === klaimDibuka ? 'on' : '')}
                  onClick={() => setTabKlaim(c.id)}
                >
                  {ini(c.nama)} · {c.status}
                </span>
              ))}
            </div>
            <Chat
              key={klaimDibuka.id}
              id={klaimDibuka.id}
              me={user.id}
              fin
              ro={adminLain}
              reload={muat}
              go={go}
            />
          </>
        ) : (
          <div className="info">
            Belum ada yang mengklaim barang ini. Notifikasi akan muncul saat ada klaim baru.
          </div>
        )}
      </div>
    );
  } else if (klaimAktifId) {
    // Laporan temuan, pengklaim yang sudah memulai klaim
    kolomKanan = (
      <div className="panel chat">
        <div>
          <h3 style={{ fontSize: 20 }}>Chat dengan penemu</h3>
          <div className="sm">Klaim: Ini barang saya</div>
        </div>
        <Chat id={klaimAktifId} me={user.id} reload={muat} go={go} />
      </div>
    );
  } else if (r.status !== 'ditemukan') {
    // Laporan tidak menerima klaim baru
    kolomKanan = panelAksi(
      r.status === 'dalam_klaim' ? 'Sedang diklaim' : 'Sudah kembali ke pemiliknya',
      'Laporan ini tidak menerima klaim baru.',
      tombolLaporkan
    );
  } else {
    // Bisa mulai klaim
    kolomKanan = panelAksi(
      'Barang ini milikmu?',
      'Mulai klaim, lalu jawab pertanyaan penemu lewat chat untuk membuktikan kepemilikan.',
      <>
        <button className="btn pri lg" onClick={mulaiKlaim}>Ini barang saya</button>
        {tombolLaporkan}
      </>
    );
  }

  return (
    <div className="pg">
      <div style={{ marginBottom: 16 }}>
        <a onClick={() => go('home')}>← Kembali ke daftar</a>
      </div>
      <div className="two">
        {kolomKiri}
        {kolomKanan}
      </div>
    </div>
  );
}
