import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function Peringkat() {
  const [periode, setPeriode] = useState('bulan'); // 'bulan' atau 'all'
  const [daftar, setDaftar] = useState([]);

  useEffect(() => {
    api('/peringkat?periode=' + periode).then(setDaftar);
  }, [periode]);

  return (
    <div className="pg">
      <h1 className="pt">Papan peringkat penemu</h1>
      <p className="subt">Terima kasih untuk semua yang membantu barang kembali ke pemiliknya.</p>

      <div className="chips" style={{ marginTop: 16 }}>
        <span className={'chip ' + (periode === 'bulan' ? 'on' : '')} onClick={() => setPeriode('bulan')}>
          Bulan ini
        </span>
        <span className={'chip ' + (periode === 'all' ? 'on' : '')} onClick={() => setPeriode('all')}>
          Sepanjang waktu
        </span>
      </div>

      <div className="two" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="panel" style={{ padding: '12px 24px' }}>
          {daftar.map((x, i) => (
            <div key={i} className={'lrow ' + (i < 3 ? 'top' : '')}>
              <b style={{ width: 32, fontSize: 18 }}>{i + 1}</b>
              <div className="av" style={{ width: 44, height: 44 }}>{x.inisial}</div>
              <div className="gr">
                <b>{x.inisial}</b>
                <div className="sm">{x.lencana || ''}</div>
              </div>
              <b>{x.poin} poin</b>
            </div>
          ))}
          {!daftar.length && <div className="sm" style={{ padding: 16 }}>Belum ada data.</div>}
        </div>

        <div className="panel">
          <h3 style={{ fontSize: 20, marginBottom: 10 }}>Cara mendapat poin</h3>
          <p style={{ fontSize: 14 }}>10 poin untuk tiap barang yang berhasil dikembalikan dengan foto bukti.</p>
          <p className="sm" style={{ marginTop: 10 }}>Peringkat bulanan diatur ulang tiap awal bulan.</p>
        </div>
      </div>
    </div>
  );
}
