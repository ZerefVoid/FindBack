import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { STAT, HOW } from '../constants.js';
import Card from '../components/Card.jsx';

const FILTER = ['Semua aktif', 'Hilang', 'Ditemukan', 'Dalam proses klaim', 'Dikembalikan'];

export default function Home({ go, kat, buat, full }) {
  const [q, setQ] = useState('');
  const [k, setK] = useState('');
  const [pencarian, setPencarian] = useState({ q: '', k: '' }); // hanya berubah saat klik "Cari"
  const [filter, setFilter] = useState('Semua aktif');
  const [laporan, setLaporan] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (pencarian.k) params.set('kategori', pencarian.k);
    if (pencarian.q) params.set('q', pencarian.q);
    api('/laporan?' + params).then(setLaporan);
  }, [pencarian]);

  const tampil = laporan.filter((r) =>
    filter === 'Semua aktif' ? r.status !== 'dikembalikan' : STAT[r.status] === filter
  );

  return (
    <>
      <div className="hero">
        <div className="in">
          <h1>Barang hilang? Temukan kembali di sini.</h1>
          <p>
            Satu tempat untuk melapor, mencari, dan mencocokkan barang hilang di kampus,
            dengan verifikasi pemilik yang aman.
          </p>

          <div className="search">
            <input
              className="inp"
              placeholder="Cari: dompet, kunci, HP..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="inp" value={k} onChange={(e) => setK(e.target.value)}>
              <option value="">Semua kategori</option>
              {kat.map((c) => <option key={c.id}>{c.nama}</option>)}
            </select>
            <button className="btn pri lg" onClick={() => setPencarian({ q, k })}>Cari</button>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
            <button className={'btn lg ' + (full ? 'off' : 'drk')} onClick={() => buat('hilang')}>
              Saya kehilangan barang
            </button>
            <button className={'btn lg ' + (full ? 'off' : 'outd')} onClick={() => buat('temuan')}>
              Saya menemukan barang
            </button>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="sec">
          <h2>Cara kerja FindBack</h2>
          <div className="grid4 how">
            {HOW.map((h) => (
              <div className="panel" key={h[0]}>
                <div className="l">{h[0]}</div>
                <h3>{h[1]}</h3>
                <p>{h[2]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sec" style={{ paddingBottom: 56 }}>
          <h2>Laporan terbaru</h2>
          <div className="chips">
            {FILTER.map((f) => (
              <span key={f} className={'chip ' + (filter === f ? 'on' : '')} onClick={() => setFilter(f)}>
                {f}
              </span>
            ))}
          </div>

          {tampil.length ? (
            <div className="cards">
              {tampil.map((r) => <Card key={r.id} r={r} go={go} />)}
            </div>
          ) : (
            <div className="panel sm">Belum ada laporan yang cocok dengan pencarianmu.</div>
          )}
        </div>
      </div>
    </>
  );
}
