import { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { STAT, ASTAT } from '../../constants.js';
import { fmt, isStale } from '../../utils.js';

// Halaman tinjau satu aduan. id = id aduan
export default function Tinjau({ id, user, go, toast, setDlg }) {
  const [a, setA] = useState();
  const [keputusan, setKeputusan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [chat, setChat] = useState(null); // isi chat klaim kalau sudah dibuka admin

  const muat = () => api('/admin/aduan/' + id).then(setA);
  useEffect(() => { muat(); }, [id]);

  if (!a) return null;

  // ---- Turunan data ----
  const sayaPenangan = a.penangan_id === user.id;
  const selesai = a.status === 'selesai';
  const bisaMemutuskan = sayaPenangan && !selesai;
  const pemilik = a.owner;                        // pengguna yang diadukan
  const batasPeringatanTercapai = a.peringatan.length >= 3;
  const laporan = a.t.laporan;
  const pesan = a.t.pesan;

  // Pilihan keputusan: [kode, judul, penjelasan]
  const opsiKeputusan = [
    ['laporan_sah', 'Laporan sah', 'Tidak melanggar. Laporan tayang lagi.'],
    ['hapus_laporan', 'Hapus laporan', 'Hapus lunak, slot pembuat terbuka.'],
    ...(a.jenis === 'pesan'
      ? [['sembunyikan_pesan', 'Sembunyikan pesan', 'Isi tidak diubah, tampil sebagai Pesan disembunyikan admin.']]
      : []),
    ['peringatkan', 'Peringatkan pengguna', 'Peringatan dicatat dan pengguna diberi notifikasi.'],
    ['tutup', 'Tutup aduan', 'Tanpa tindakan.'],
  ];

  // ---- Aksi ----
  const simpanKeputusan = async () => {
    if (!keputusan) {
      return setDlg({ t: 'ok', title: 'Pilih keputusan', msg: 'Pilih salah satu keputusan sebelum menyimpan.' });
    }

    try {
      const hasil = await api(`/admin/aduan/${id}/putus`, { body: { keputusan, catatan } });
      toast('Aduan selesai.' + (hasil.note || ''));
      go('admin');
    } catch (x) {
      setDlg({ t: 'ok', title: 'Gagal', msg: x.message });
    }
  };

  const bukaChat = async () => {
    setChat(await api(`/admin/klaim/${pesan.klaim_id}/pesan?aduan=${a.id}`));
  };

  const ambilAlih = async () => {
    await api(`/admin/aduan/${a.id}/ambil`, { body: {} });
    muat();
  };

  const ubahStatusAkun = async () => {
    await api('/admin/akun/' + pemilik.id, { body: {} });
    muat();
  };

  return (
    <div className="w960">
      <div style={{ marginBottom: 12 }}>
        <a onClick={() => go('admin')}>← Dashboard admin</a>
      </div>

      <h1 className="pt">
        Tinjau aduan{' '}
        <span className={'badge s-' + a.status} style={{ verticalAlign: 'middle' }}>{ASTAT[a.status]}</span>
      </h1>
      <p className="subt">Aduan #{a.id} · {String(a.dibuat_pada).slice(0, 10)}</p>

      <div className="two" style={{ marginTop: 20 }}>
        {/* ===== Kolom kiri ===== */}
        <div className="stk">

          {/* Ringkasan aduan */}
          <div className="panel">
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Ringkasan aduan</h3>
            <div className="rows">
              <div><b>Jenis</b><span>{a.jenis === 'laporan' ? 'Laporan' : 'Pesan'}</span></div>
              <div><b>Alasan</b><span>{a.alasan}</span></div>
              <div><b>Keterangan</b><span>{a.keterangan || '-'}</span></div>
              <div><b>Pelapor</b><span>{a.pelapor}</span></div>
              <div><b>Ditangani oleh</b><span>{a.penangan || 'Belum ada'}</span></div>
            </div>

            {!sayaPenangan && !selesai && (
              <div className="info" style={{ marginTop: 12 }}>
                Sedang ditangani {a.penangan || 'admin lain'}. Tombol keputusan nonaktif.
                {isStale(a) && <> <a onClick={ambilAlih}>Ambil alih</a></>}
              </div>
            )}
          </div>

          {/* Target aduan: laporan atau pesan */}
          <div className="panel">
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Target</h3>

            {laporan && (
              <>
                <div className="cards" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="card">
                    <div
                      className={'ph ' + (laporan.foto_url ? '' : 'no')}
                      style={laporan.foto_url ? { backgroundImage: `url(${laporan.foto_url})` } : {}}
                    >
                      <span className={'b1 badge s-' + laporan.status}>
                        {STAT[laporan.status] || laporan.status}
                      </span>
                      <span className="b2">{laporan.kategori}</span>
                      {!laporan.foto_url && 'Tanpa foto'}
                    </div>
                    <div className="cb">
                      <h3>{laporan.judul}</h3>
                      <div className="sm">{laporan.lokasi_cerita}</div>
                      <div className="sm">{fmt(laporan.tanggal_kejadian)} · Pengguna FindBack</div>
                    </div>
                  </div>
                </div>

                {laporan.jenis === 'temuan' && (
                  <div className="tipbox" style={{ marginTop: 12 }}>
                    <b>Ciri rahasia (hanya admin):</b> {laporan.ciri_rahasia}
                  </div>
                )}
              </>
            )}

            {pesan && (
              <>
                <div className={'bub ' + (pesan.disembunyikan ? 'hid' : '')} style={{ maxWidth: '100%' }}>
                  <span className="who">{pesan.nama}</span>
                  {pesan.disembunyikan ? 'Pesan disembunyikan admin' : pesan.isi}
                </div>

                <div className="lbtns">
                  <button className="btn out" disabled={!sayaPenangan} onClick={bukaChat}>
                    Buka chat klaim
                  </button>
                </div>
                <div className="sm" style={{ marginTop: 8 }}>Akses chat dicatat di log.</div>

                {chat && (
                  <div
                    className="msgs"
                    style={{ marginTop: 10, border: '1px solid var(--line)', borderRadius: 10, padding: 10 }}
                  >
                    {chat.map((m) => (
                      <div
                        className="bub"
                        key={m.id}
                        style={m.id === pesan.id ? { outline: '2px solid var(--red)' } : {}}
                      >
                        <span className="who">{m.nama}</span>
                        {m.disembunyikan ? <i>Pesan disembunyikan admin</i> : m.isi}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Riwayat pengguna yang diadukan */}
          <div className="panel">
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Riwayat pengguna yang diadukan</h3>

            {pemilik ? (
              <>
                <div className="sm">
                  {pemilik.nama} · {a.peringatan.length} dari 3 peringatan · {a.lain} aduan lain
                </div>

                {a.peringatan.map((w, i) => (
                  <div className="lrow" key={i}>
                    <div className="gr">
                      <b>{w.alasan}</b>
                      <div className="sm">{String(w.dibuat_pada).slice(0, 10)}</div>
                    </div>
                  </div>
                ))}

                {batasPeringatanTercapai && (
                  <div className="warnb" style={{ marginTop: 12 }}>
                    Pengguna ini sudah mencapai batas peringatan. Pertimbangkan menonaktifkan akun.
                    <div className="lbtns">
                      <button className="btn warn" disabled={!pemilik.aktif} onClick={ubahStatusAkun}>
                        {pemilik.aktif ? 'Nonaktifkan akun' : 'Akun sudah nonaktif'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="sm">Target sudah dihapus.</div>
            )}
          </div>
        </div>

        {/* ===== Kolom kanan: keputusan ===== */}
        <div className="panel stk">
          <h3 style={{ fontSize: 20 }}>Keputusan</h3>

          {selesai ? (
            <div className="info">
              <b>Keputusan:</b> {a.keputusan}
              {a.catatan && <><br /><b>Catatan:</b> {a.catatan}</>}
            </div>
          ) : (
            <>
              {opsiKeputusan.map(([kode, judul, penjelasan]) => (
                <label className="opt" key={kode} style={{ opacity: bisaMemutuskan ? 1 : 0.55 }}>
                  <input
                    type="radio"
                    name="kep"
                    checked={keputusan === kode}
                    disabled={!bisaMemutuskan}
                    onChange={() => setKeputusan(kode)}
                  />
                  <span>
                    <b>{judul}</b><br />
                    <span className="sm">{penjelasan}</span>
                  </span>
                </label>
              ))}

              <div>
                <label className="sm" style={{ color: 'var(--fg)' }}>Catatan admin (opsional)</label>
                <textarea
                  className="inp"
                  disabled={!bisaMemutuskan}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>

              <button
                className={'btn pri lg ' + (bisaMemutuskan ? '' : 'off')}
                disabled={!bisaMemutuskan}
                onClick={simpanKeputusan}
              >
                Simpan keputusan
              </button>
            </>
          )}

          <button className="btn net lg" onClick={() => go('admin')}>Kembali</button>
        </div>
      </div>
    </div>
  );
}
