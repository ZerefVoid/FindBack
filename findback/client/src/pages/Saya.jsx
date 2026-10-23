import { useState, useEffect, useContext } from 'react';
import { Ctx } from '../context.js';
import { api } from '../api.js';
import { STAT, ACTIVE } from '../constants.js';
import { fmt } from '../utils.js';

const BATAS = 3;

// Halaman "Laporan saya"
export default function Saya({ go, buat }) {
  const D = useContext(Ctx);
  const [laporan, setLaporan] = useState([]);

  useEffect(() => {
    api('/laporan/saya').then(setLaporan);
  }, []);

  const aktif = laporan.filter((r) => ACTIVE.includes(r.status));
  const riwayat = laporan.filter((r) => !ACTIVE.includes(r.status));
  const jumlahAktif = aktif.length;
  const full = jumlahAktif >= BATAS;

  const cabut = (r) => D.setDlg({ t: 'cabut', id: r.id, nama: r.judul });

  const batalkanSerahTerima = (r) =>
    D.setDlg({ t: 'batalask', id: r.klaim_dipilih, rid: r.id, nama: r.judul });

  return (
    <div className="w960">
      <h1 className="pt">Laporan saya</h1>
      <p className="subt">Pantau, edit, dan cabut laporan yang kamu buat.</p>

      {/* Indikator slot laporan */}
      <div
        className="panel"
        style={{ marginTop: 20, ...(full ? { background: 'var(--amber)', color: 'var(--amberfg)' } : {}) }}
      >
        <div className="sbar">
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{jumlahAktif} dari 3 laporan aktif</div>
            <div className="slots">
              {[0, 1, 2].map((i) => <i key={i} className={i < jumlahAktif ? 'f' : ''} />)}
            </div>
            <div className="sm" style={full ? { color: 'inherit' } : {}}>
              {full
                ? 'Slot penuh. Selesaikan atau cabut salah satu laporan untuk membuat laporan baru.'
                : `Kamu masih bisa membuat ${BATAS - jumlahAktif} laporan lagi.`}
            </div>
          </div>
          <button className={'btn pri ' + (full ? 'off' : '')} onClick={() => buat()}>Buat laporan</button>
        </div>
      </div>

      {/* Laporan aktif */}
      {aktif.length ? (
        aktif.map((r) => (
          <div className="panel" key={r.id} style={{ padding: 16, marginTop: 16 }}>
            <div className="sbar">
              <div>
                <span className={'badge s-' + r.status}>{STAT[r.status]}</span>
                <h3 style={{ fontSize: 16, marginTop: 8, cursor: 'pointer' }} onClick={() => go('detail', r.id)}>
                  {r.judul}
                </h3>
                <div className="sm">
                  {r.jenis === 'hilang' ? 'Laporan hilang' : 'Laporan temuan'} · {fmt(r.dibuat_pada)}
                </div>
                {r.jenis === 'temuan' && (
                  <div className="sm" style={{ marginTop: 4 }}>
                    Ciri rahasia (hanya kamu): <b>{r.ciri_rahasia}</b>
                  </div>
                )}
              </div>
            </div>

            <div className="lbtns">
              {r.status === 'dalam_klaim' ? (
                <>
                  <button className="btn pri" onClick={() => go('serah', r.klaim_dipilih)}>Serahkan barang</button>
                  <button className="btn warn" onClick={() => batalkanSerahTerima(r)}>Batalkan serah terima</button>
                  <button className="btn net" onClick={() => go('edit', r.id)}>Edit laporan</button>
                  <button className="btn off" disabled>Cabut laporan</button>
                  <span className="sm">
                    Laporan sedang diklaim: ciri-ciri dan ciri rahasia dikunci, dan laporan tidak dapat dicabut.
                  </span>
                </>
              ) : (
                <>
                  <button className="btn net" onClick={() => go('detail', r.id)}>Lihat</button>
                  <button className="btn net" onClick={() => go('edit', r.id)}>Edit laporan</button>
                  <button className="btn warn" onClick={() => cabut(r)}>Cabut laporan</button>
                </>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="panel" style={{ marginTop: 16, textAlign: 'center' }}>
          <p>Belum ada laporan aktif</p>
          <button className="btn pri" style={{ marginTop: 12 }} onClick={() => buat()}>Buat laporan</button>
        </div>
      )}

      {/* Riwayat (tidak dihitung dalam batas 3 laporan) */}
      <details style={{ marginTop: 28 }}>
        <summary>Riwayat laporan ({riwayat.length})</summary>
        <div className="sm" style={{ margin: '8px 0' }}>Tidak dihitung dalam batas 3 laporan.</div>

        {riwayat.map((r) => (
          <div className="panel" key={r.id} style={{ padding: 16, marginTop: 10 }}>
            <span className={'badge s-' + r.status}>{STAT[r.status]}</span>{' '}
            <b style={{ marginLeft: 6 }}>{r.judul}</b>{' '}
            <span className="sm">· {fmt(r.dibuat_pada)}</span>
          </div>
        ))}
        {!riwayat.length && <div className="sm">Belum ada riwayat.</div>}
      </details>
    </div>
  );
}
