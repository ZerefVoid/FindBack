import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { BADGES } from '../constants.js';
import { fmt, ini } from '../utils.js';

const keteranganPoin = (alasan) =>
  alasan === 'bonus_cepat' ? 'Bonus kembali dalam 3 hari' : 'Barang dikembalikan dengan foto bukti';

export default function Profil() {
  const [p, setP] = useState();

  useEffect(() => {
    api('/profil').then(setP);
  }, []);

  if (!p) return null;

  const jumlah = p.n; // barang yang sudah dikembalikan
  const lencanaBerikutnya = BADGES.find((b) => b[1] > jumlah);
  const lencanaSekarang = [...BADGES].reverse().find((b) => jumlah >= b[1]);

  const statistik = [
    [jumlah, 'Barang dikembalikan'],
    [p.poin, 'Total poin'],
    [p.rank ? '#' + p.rank : '-', 'Peringkat bulan ini'],
  ];

  return (
    <div className="w960">
      {/* Kartu profil */}
      <div className="panel">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="av" style={{ width: 72, height: 72, fontSize: 26 }}>{ini(p.nama)}</div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: 26 }}>{p.nama}</h1>
            <div className="sm">
              {lencanaSekarang ? lencanaSekarang[0] + ', ' : ''}bergabung {fmt(p.gabung)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {statistik.map((s) => (
              <div key={s[1]}>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{s[0]}</div>
                <div className="sm">{s[1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progres menuju lencana berikutnya */}
      {lencanaBerikutnya && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="sbar">
            <b>Menuju {lencanaBerikutnya[0]}</b>
            <span>{jumlah} dari {lencanaBerikutnya[1]} barang</span>
          </div>
          <div className="bar" style={{ margin: '10px 0' }}>
            <i style={{ width: Math.min(100, (jumlah / lencanaBerikutnya[1]) * 100) + '%' }} />
          </div>
          <div className="sm">
            {lencanaBerikutnya[1] - jumlah} barang lagi untuk mendapat lencana berikutnya.
          </div>
        </div>
      )}

      <div className="two" style={{ marginTop: 16 }}>
        {/* Lencana */}
        <div className="panel">
          <h3 style={{ fontSize: 20, marginBottom: 14 }}>Lencana</h3>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {BADGES.map((b) => (
              <div key={b[0]} style={{ textAlign: 'center', width: 90 }}>
                <div className={'bdg ' + (jumlah >= b[1] ? 'on' : '')} style={{ margin: '0 auto 6px' }}>
                  {b[1]}
                </div>
                <div className="sm" style={{ color: jumlah >= b[1] ? 'var(--acc2)' : '#7A8885' }}>
                  {b[0]}
                </div>
              </div>
            ))}
          </div>

          <label className="sm" style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <input type="checkbox" defaultChecked />{' '}
            Tampilkan lencana dan peringkatku di profil publik
          </label>
        </div>

        {/* Riwayat poin */}
        <div className="panel">
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>Riwayat poin</h3>

          {p.riwayat.map((h, i) => (
            <div className="lrow" key={i}>
              <div className="gr">
                <b>{h.judul}</b>
                <div className="sm">{fmt(h.dibuat_pada)} · {keteranganPoin(h.alasan)}</div>
              </div>
              <b style={{ color: 'var(--acc)' }}>+{h.jumlah}</b>
            </div>
          ))}
          {!p.riwayat.length && <div className="sm">Belum ada poin.</div>}

          <div className="sm" style={{ marginTop: 10 }}>
            Poin diberikan untuk serah terima yang disertai foto bukti dari penemu.
          </div>
        </div>
      </div>
    </div>
  );
}
