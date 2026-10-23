import { LOGO, BELL } from './Icons.jsx';
import { ini } from '../utils.js';

// Bar atas: logo, menu, dan tombol sesuai status login
export default function Header({ user, admin, halaman, full, go, buat, keluar }) {
  const aktif = (nama) => (halaman === nama ? 'on' : '');

  return (
    <div className="hdr">
      <div className="logo" onClick={() => go('home')}>{LOGO}FindBack</div>

      <nav className="nav">
        <a className={aktif('home')} onClick={() => go('home')}>Beranda</a>
        <a className={aktif('hilang')} onClick={() => go('hilang')}>Barang hilang</a>
        <a className={aktif('temuan')} onClick={() => go('temuan')}>Barang temuan</a>
        <a className={aktif('bantuan')} onClick={() => go('bantuan')}>Cara kerja</a>
        <a className={aktif('peringkat')} onClick={() => go('peringkat')}>Peringkat</a>
      </nav>

      <div className="hr">
        {user ? (
          <>
            {admin ? (
              <a
                onClick={() => go('admin')}
                style={halaman === 'admin' || halaman === 'tinjau' ? { fontWeight: 700 } : {}}
              >
                Panel admin
              </a>
            ) : (
              <a onClick={() => go('saya')}>Laporan saya</a>
            )}

            <span className="bell" onClick={() => go('notif')} title="Notifikasi">
              {BELL}
              {user.belum_dibaca > 0 && <i>{user.belum_dibaca}</i>}
            </span>

            <span className="av" style={{ cursor: 'pointer' }} title="Profil" onClick={() => go('profil')}>
              {ini(user.nama)}
            </span>

            <button className="btn net" onClick={keluar}>Keluar</button>

            {!admin && (
              <button className={'btn pri ' + (full ? 'off' : '')} onClick={() => buat()}>
                Buat laporan
              </button>
            )}
          </>
        ) : (
          <>
            <button className="btn out" onClick={() => go('masuk')}>Masuk</button>
            <button className="btn pri" onClick={() => buat()}>Buat laporan</button>
          </>
        )}
      </div>
    </div>
  );
}
