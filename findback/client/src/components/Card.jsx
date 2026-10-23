import { STAT, POS } from '../constants.js';
import { fmt } from '../utils.js';

// Kartu laporan di daftar (beranda, barang hilang, barang temuan)
export default function Card({ r, go }) {
  const buka = () => go('detail', r.id);
  const lokasi = r.lokasi_cerita || '';

  let tombol;
  if (r.status === 'dalam_klaim') {
    tombol = <button className="btn off" disabled>Sedang diklaim</button>;
  } else if (r.status === 'dikembalikan') {
    tombol = <button className="btn off" disabled>Sudah kembali ke pemiliknya</button>;
  } else {
    tombol = (
      <button className={'btn ' + (r.jenis === 'hilang' ? 'out' : 'pri')} onClick={buka}>
        {r.jenis === 'hilang' ? 'Saya menemukannya' : 'Ini barang saya'}
      </button>
    );
  }

  return (
    <div className={'card' + (r.status === 'dikembalikan' ? ' fade' : '')}>
      <div
        className={'ph ' + (r.foto_url ? '' : 'no')}
        onClick={buka}
        style={{
          cursor: 'pointer',
          ...(r.foto_url ? { backgroundImage: `url(${r.foto_url})` } : {}),
        }}
      >
        <span className={'b1 badge s-' + r.status}>{STAT[r.status]}</span>
        <span className="b2">{r.kategori}</span>
        {!r.foto_url && 'Tanpa foto'}
      </div>

      <div className="cb">
        <h3 onClick={buka}>{r.judul}</h3>
        <div className="sm">{lokasi.length > 46 ? lokasi.slice(0, 46) + '…' : lokasi}</div>
        <div className="sm">{fmt(r.tanggal_kejadian)} · Pengguna FindBack</div>

        <div className="tags">
          {r.reward && <span className="tag t-rw">Reward: {r.reward}</span>}
          {r.jenis === 'temuan' && <span className="tag t-pos">{POS[r.posisi_barang]}</span>}
          {r.ktm ? <span className="tag t-rw">Data kartu disembunyikan</span> : null}
        </div>

        {tombol}
      </div>
    </div>
  );
}
