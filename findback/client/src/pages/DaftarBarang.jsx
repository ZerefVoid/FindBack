import { useState, useEffect } from 'react';
import { api } from '../api.js';
import Card from '../components/Card.jsx';

// Halaman daftar "Barang hilang" (j = 'hilang') dan "Barang temuan" (j = 'temuan')
export default function DaftarBarang({ j, go, kat, buat, full }) {
  const hilang = j === 'hilang';
  const [q, setQ] = useState('');
  const [k, setK] = useState('');
  const [pencarian, setPencarian] = useState({ q: '', k: '' }); // hanya berubah saat klik "Cari"
  const [laporan, setLaporan] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams({ jenis: j, status: hilang ? 'hilang' : 'ditemukan' });
    if (pencarian.k) params.set('kategori', pencarian.k);
    if (pencarian.q) params.set('q', pencarian.q);
    api('/laporan?' + params).then(setLaporan);
  }, [j, pencarian, hilang]);

  return (
    <div className="wrap">
      <div className="sec" style={{ paddingBottom: 56 }}>
        <h1 className="pt">{hilang ? 'Barang hilang' : 'Barang temuan'}</h1>
        <p className="subt">
          {hilang
            ? 'Laporan barang yang sedang dicari pemiliknya. Kalau kamu menemukannya, buat laporan temuan.'
            : 'Barang yang sudah ditemukan dan menunggu pemiliknya. Kalau ini milikmu, mulai klaim lalu verifikasi lewat chat.'}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0 20px' }}>
          <input
            className="inp"
            style={{ flex: 2, minWidth: 180 }}
            placeholder="Cari: dompet, kunci, HP..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="inp"
            style={{ flex: 1, minWidth: 160 }}
            value={k}
            onChange={(e) => setK(e.target.value)}
          >
            <option value="">Semua kategori</option>
            {kat.map((c) => <option key={c.id}>{c.nama}</option>)}
          </select>
          <button className="btn pri" onClick={() => setPencarian({ q, k })}>Cari</button>
          <button className={'btn ' + (full ? 'off' : 'drk')} onClick={() => buat(j)}>
            {hilang ? 'Saya kehilangan barang' : 'Saya menemukan barang'}
          </button>
        </div>

        {laporan.length ? (
          <div className="cards">
            {laporan.map((r) => <Card key={r.id} r={r} go={go} />)}
          </div>
        ) : (
          <div className="panel sm">
            Belum ada {hilang ? 'barang hilang' : 'barang temuan'} yang cocok dengan pencarianmu.
          </div>
        )}
      </div>
    </div>
  );
}
