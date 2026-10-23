import { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { ASTAT } from '../../constants.js';
import { isStale } from '../../utils.js';

// Dashboard admin: statistik, daftar aduan, kelola akun, log tindakan
export default function Admin({ user, go, toast }) {
  const [d, setD] = useState();

  const muat = () => api('/admin/dashboard').then(setD);
  useEffect(() => { muat(); }, []);

  if (!d) return null;

  const tinjau = async (aduan) => {
    await api(`/admin/aduan/${aduan.id}/tinjau`, { body: {} });
    go('tinjau', aduan.id);
  };

  const ambilAlih = async (aduan) => {
    try {
      await api(`/admin/aduan/${aduan.id}/ambil`, { body: {} });
      toast('Aduan diambil alih.');
      go('tinjau', aduan.id);
    } catch (x) {
      toast(x.message);
    }
  };

  const ubahStatusAkun = async (u) => {
    const hasil = await api('/admin/akun/' + u.id, { body: {} });
    toast(hasil.aktif ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.');
    muat();
  };

  const statistik = [
    [d.pengguna, 'Pengguna'],
    [d.aktif, 'Laporan aktif'],
    [d.kembali, 'Barang dikembalikan'],
    [d.terbuka, 'Aduan terbuka'],
  ];

  // Tombol aksi di tiap baris aduan
  const tombolAduan = (a) => {
    const ditanganiAdminLain = a.status === 'diproses' && a.penangan_id !== user.id;

    if (a.status === 'selesai') {
      return <button className="btn net" onClick={() => go('tinjau', a.id)}>Lihat</button>;
    }
    if (ditanganiAdminLain) {
      return isStale(a)
        ? <button className="btn out" onClick={() => ambilAlih(a)}>Ambil alih</button>
        : <button className="btn off" disabled>Ditangani {a.penangan.split(' ')[0]}</button>;
    }
    return <button className="btn pri" onClick={() => tinjau(a)}>Tinjau</button>;
  };

  return (
    <div className="pg">
      <h1 className="pt">Dashboard admin</h1>

      {/* Statistik */}
      <div className="sc" style={{ margin: '20px 0' }}>
        {statistik.map((s) => (
          <div className="panel" key={s[1]}>
            <b>{s[0]}</b>
            <span>{s[1]}</span>
          </div>
        ))}
      </div>

      {/* Aduan */}
      <div className="panel">
        <h3 style={{ fontSize: 20 }}>Aduan dan sengketa</h3>

        {d.aduan.map((a) => (
          <div className="lrow" key={a.id}>
            <div className="gr">
              <b>{a.jenis === 'laporan' ? 'Laporan' : 'Pesan'}: {a.alasan}</b>
              <div className="sm">
                {a.jenis === 'laporan'
                  ? (a.judul || '(dihapus)')
                  : 'Pesan di klaim #' + a.target_id.split(':')[0]}
                {' '}· pelapor {a.pelapor}
                {a.penangan && a.status !== 'baru' ? ' · penangan ' + a.penangan : ''}
              </div>
            </div>
            <span className={'badge s-' + a.status}>{ASTAT[a.status]}</span>
            {tombolAduan(a)}
          </div>
        ))}
        {!d.aduan.length && <div className="sm">Tidak ada aduan.</div>}
      </div>

      {/* Kelola akun */}
      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Kelola akun</h3>
        <div className="sx">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Peringatan</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {d.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.nama}
                    {u.peran === 'admin' && <> <span className="badge s-selesai">Admin</span></>}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.peringatan}</td>
                  <td>
                    <span className={'badge ' + (u.aktif ? 's-ditemukan' : 's-hilang')}>
                      {u.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    {u.id === user.id ? '' : (
                      <button
                        className={'btn ' + (u.aktif ? 'net' : 'out')}
                        style={{ height: 36 }}
                        onClick={() => ubahStatusAkun(u)}
                      >
                        {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log */}
      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>Log tindakan admin</h3>
        {d.log.map((l, i) => (
          <div className="sm" key={i} style={{ padding: '4px 0' }}>
            {String(l.dibuat_pada).slice(0, 16)} · {l.admin} · {l.teks}
          </div>
        ))}
      </div>
    </div>
  );
}
