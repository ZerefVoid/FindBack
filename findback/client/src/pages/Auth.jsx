import { useState } from 'react';
import { api } from '../api.js';
import { LOGO } from '../components/Icons.jsx';

const labelStyle = { color: 'var(--fg)' };

// Halaman masuk (mode = 'masuk') dan daftar (mode = 'daftar')
export default function Auth({ mode, go, reload }) {
  const daftar = mode === 'daftar';
  const [D, setD] = useState({});
  const [error, setError] = useState('');

  const setField = (key) => (e) => setD({ ...D, [key]: e.target.value });

  const kirim = async () => {
    if (daftar && !D.setuju) return setError('Centang persetujuan syarat penggunaan.');

    try {
      await api('/auth/' + (daftar ? 'daftar' : 'masuk'), {
        body: { nama: D.nama, email: D.email, kata_sandi: D.pass },
      });
      await reload();
      go('home');
    } catch (x) {
      setError(x.message);
    }
  };

  return (
    <div className="auth">
      {/* Kolom kiri: penjelasan */}
      <div className="l">
        {LOGO}
        <h2>{daftar ? 'Siapa saja di kampus bisa memakai FindBack.' : 'Selamat datang kembali.'}</h2>

        {daftar ? (
          <>
            <p style={{ fontSize: 17 }}>
              <b>Email apa saja</b><br />
              <span className="sm">Boleh email pribadi, boleh juga email kampus bagi mahasiswa.</span>
            </p>
            <p style={{ fontSize: 17 }}>
              <b>Tanpa persetujuan admin</b><br />
              <span className="sm">Akun langsung aktif setelah daftar.</span>
            </p>
          </>
        ) : (
          <p style={{ fontSize: 17, color: 'var(--fg2)' }}>
            Masuk untuk melapor, mengklaim barang, dan memantau laporanmu.
          </p>
        )}

        <a onClick={() => go('home')}>Lihat daftar barang tanpa masuk</a>
      </div>

      {/* Kolom kanan: form */}
      <div className="r">
        <div className="card2">
          <h3>{daftar ? 'Buat akun' : 'Masuk'}</h3>

          {daftar && (
            <div>
              <label className="sm" style={labelStyle}>Nama lengkap</label>
              <input className="inp" onChange={setField('nama')} />
            </div>
          )}

          <div>
            <label className="sm" style={labelStyle}>Email</label>
            <input className="inp" type="email" placeholder="nama@email.com" onChange={setField('email')} />
          </div>

          <div>
            <label className="sm" style={labelStyle}>Kata sandi</label>
            <input className="inp" type="password" onChange={setField('pass')} />
            {daftar && <div className="sm">Minimal 8 karakter.</div>}
          </div>

          {daftar && (
            <label className="sm" style={{ display: 'flex', gap: 8 }}>
              <input type="checkbox" onChange={(e) => setD({ ...D, setuju: e.target.checked })} />{' '}
              Saya setuju dengan syarat penggunaan, termasuk riwayat chat yang disimpan untuk penyelesaian sengketa.
            </label>
          )}

          <div className="sm" style={{ color: 'var(--redfg)' }}>{error}</div>

          <button className="btn pri lg" style={{ width: '100%' }} onClick={kirim}>
            {daftar ? 'Buat akun' : 'Masuk'}
          </button>

          {!daftar && (
            <div className="sm">
              Akun contoh: rina@kampus.ac.id, budi@kampus.ac.id, admin@findback.id. Kata sandi: demo1234
            </div>
          )}

          <div className="sm" style={{ textAlign: 'center' }}>
            {daftar ? (
              <>Sudah punya akun? <a onClick={() => go('masuk')}>Masuk</a></>
            ) : (
              <>Belum punya akun? <a onClick={() => go('daftar')}>Daftar</a></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
