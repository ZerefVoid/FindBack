import { useState, useEffect, useCallback } from 'react';
import { Ctx } from './context.js';
import { api } from './api.js';

import Header from './components/Header.jsx';
import Dialog from './components/Dialog.jsx';
import Toast from './components/Toast.jsx';

import Home from './pages/Home.jsx';
import DaftarBarang from './pages/DaftarBarang.jsx';
import Detail from './pages/Detail.jsx';
import Lapor from './pages/Lapor.jsx';
import EditLaporan from './pages/EditLaporan.jsx';
import Auth from './pages/Auth.jsx';
import Saya from './pages/Saya.jsx';
import Serah from './pages/Serah.jsx';
import Peringkat from './pages/Peringkat.jsx';
import Notif from './pages/Notif.jsx';
import Bantuan from './pages/Bantuan.jsx';
import Profil from './pages/Profil.jsx';
import Admin from './pages/admin/Admin.jsx';
import Tinjau from './pages/admin/Tinjau.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [kat, setKat] = useState([]);
  const [rute, setRute] = useState({ p: 'home' }); // p = nama halaman, x = parameternya
  const [dlg, setDlg] = useState(null);
  const [pesanToast, setPesanToast] = useState(null);

  const halaman = rute.p;
  const admin = user && user.peran === 'admin';
  const full = user && user.laporan_aktif >= user.batas;

  // ---- Toast ----
  const toast = (teks) => {
    setPesanToast(teks);
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => setPesanToast(null), 2600);
  };

  // ---- Data pengguna dan kategori ----
  const reload = useCallback(() => api('/auth/saya').then(setUser), []);

  useEffect(() => {
    reload();
    api('/kategori').then(setKat);
  }, [reload]);

  // Segarkan data pengguna tiap 15 detik (jumlah notifikasi dan slot laporan)
  useEffect(() => {
    const timer = setInterval(() => user && reload(), 15000);
    return () => clearInterval(timer);
  }, [user, reload]);

  // ---- Navigasi ----
  const go = (p, x) => {
    setRute({ p, x });
    window.scrollTo(0, 0);
  };

  // ---- Tombol "Buat laporan" ----
  // jenis kosong: tampilkan dialog untuk memilih hilang atau temuan
  const buat = (jenis) => {
    if (!user) return go('masuk');

    if (full) {
      return setDlg({
        t: 'ok',
        title: 'Slot laporan penuh',
        msg: 'Kamu sudah punya 3 laporan aktif. Selesaikan atau cabut salah satu untuk membuat laporan baru.',
      });
    }

    if (jenis) go('lapor', jenis);
    else setDlg({ t: 'pilih' });
  };

  const keluar = async () => {
    await api('/auth/keluar', { body: {} });
    setUser(null);
    go('home');
  };

  // Halaman yang butuh login memakai ini kalau belum masuk
  const halamanMasuk = <Auth mode="masuk" go={go} reload={reload} />;
  const hanyaAdmin = <div className="pg"><div className="panel">Halaman ini hanya untuk admin.</div></div>;

  return (
    <Ctx.Provider value={{ setDlg, toast }}>
      <Header
        user={user}
        admin={admin}
        halaman={halaman}
        full={full}
        go={go}
        buat={buat}
        keluar={keluar}
      />

      {/* Halaman publik */}
      {halaman === 'home' && <Home go={go} kat={kat} buat={buat} full={full} />}
      {(halaman === 'hilang' || halaman === 'temuan') && (
        <DaftarBarang key={halaman} j={halaman} go={go} kat={kat} buat={buat} full={full} />
      )}
      {halaman === 'detail' && <Detail key={rute.x} id={rute.x} user={user} go={go} reload={reload} />}
      {(halaman === 'masuk' || halaman === 'daftar') && (
        <Auth key={halaman} mode={halaman} go={go} reload={reload} />
      )}
      {halaman === 'serah' && <Serah id={rute.x} go={go} />}
      {halaman === 'peringkat' && <Peringkat />}
      {halaman === 'bantuan' && <Bantuan />}

      {/* Halaman yang wajib login */}
      {halaman === 'lapor' && (user
        ? <Lapor key={rute.x} j={rute.x} kat={kat} user={user} go={go} reload={reload} />
        : halamanMasuk)}
      {halaman === 'saya' && (user ? <Saya go={go} buat={buat} /> : halamanMasuk)}
      {halaman === 'notif' && (user ? <Notif go={go} /> : halamanMasuk)}
      {halaman === 'edit' && (user
        ? <EditLaporan key={rute.x} id={rute.x} kat={kat} go={go} reload={reload} toast={toast} setDlg={setDlg} />
        : halamanMasuk)}
      {halaman === 'profil' && (user ? <Profil /> : halamanMasuk)}

      {/* Halaman admin */}
      {halaman === 'admin' && (admin ? <Admin user={user} go={go} toast={toast} /> : hanyaAdmin)}
      {halaman === 'tinjau' && (admin
        ? <Tinjau key={rute.x} id={rute.x} user={user} go={go} toast={toast} setDlg={setDlg} />
        : hanyaAdmin)}

      <Dialog d={dlg} setDlg={setDlg} go={go} reload={reload} toast={toast} />
      <Toast t={pesanToast} />
    </Ctx.Provider>
  );
}
