import { useState } from 'react';
import { api } from '../api.js';

const ALASAN = [
  'Penipuan atau mengaku barang bukan miliknya',
  'Isi tidak pantas',
  'Memuat data kartu',
  'Spam atau laporan ganda',
  'Lainnya',
];

// Isi dialog "Laporkan ini?" untuk mengadukan sebuah laporan
export default function ReportForm({ d, close, toast }) {
  const [alasan, setAlasan] = useState(ALASAN[0]);
  const [keterangan, setKeterangan] = useState('');
  const [error, setError] = useState('');

  const kirim = async () => {
    try {
      await api('/aduan', { body: { jenis: 'laporan', target: d.id, alasan, keterangan } });
      close();
      toast('Aduan terkirim. Terima kasih sudah membantu.');
    } catch (x) {
      setError(x.message);
    }
  };

  return (
    <>
      <h3>Laporkan ini?</h3>
      <p style={{ fontSize: 14, color: 'var(--fg2)' }}>
        Aduan dikirim ke admin untuk ditinjau. Identitasmu tidak ditampilkan kepada pengguna yang diadukan.
      </p>

      <div>
        <label className="sm" style={{ color: 'var(--fg)' }}>Alasan</label>
        <select className="inp" value={alasan} onChange={(e) => setAlasan(e.target.value)}>
          {ALASAN.map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div>
        <label className="sm" style={{ color: 'var(--fg)' }}>Keterangan tambahan (opsional)</label>
        <textarea
          className="inp"
          maxLength={255}
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
        />
      </div>

      <div className="sm" style={{ color: 'var(--redfg)' }}>{error}</div>

      <div className="act">
        <button className="btn net" onClick={close}>Batal</button>
        <button className="btn pri" onClick={kirim}>Kirim aduan</button>
      </div>
    </>
  );
}
