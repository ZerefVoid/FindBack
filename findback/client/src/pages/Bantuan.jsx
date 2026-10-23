import { HOW } from '../constants.js';

const FAQ = [
  [
    'Apakah harus login untuk melihat barang?',
    'Tidak. Melihat dan mencari bisa tanpa akun. Membuat laporan dan chat butuh akun.',
  ],
  [
    'Apakah reward wajib?',
    'Tidak. Reward opsional dan merupakan kesepakatan kedua pihak.',
  ],
  [
    'Berapa laporan yang boleh kubuat?',
    'Maksimal 3 laporan aktif sekaligus. Setelah salah satu dikembalikan atau dicabut, kamu bisa membuat laporan baru.',
  ],
];

export default function Bantuan() {
  return (
    <div className="wrap">
      <div className="sec">
        <h1 className="pt">Cara kerja FindBack</h1>

        <div className="grid4 how" style={{ marginTop: 16 }}>
          {HOW.map((h) => (
            <div className="panel" key={h[0]}>
              <div className="l">{h[0]}</div>
              <h3>{h[1]}</h3>
              <p>{h[2]}</p>
            </div>
          ))}
        </div>

        {FAQ.map(([tanya, jawab]) => (
          <details key={tanya} style={{ marginTop: 12 }}>
            <summary>{tanya}</summary>
            <p className="sm" style={{ margin: '8px 0' }}>{jawab}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
