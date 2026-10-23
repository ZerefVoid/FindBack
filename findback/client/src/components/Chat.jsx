import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Ctx } from '../context.js';
import { api } from '../api.js';

// Chat klaim antara penemu dan pengklaim.
// id: id klaim, me: id pengguna saat ini, fin: saya penemu, ro: hanya baca (admin)
export default function Chat({ id, me, fin, ro, reload, go }) {
  const D = useContext(Ctx);
  const [klaim, setKlaim] = useState();
  const [pesan, setPesan] = useState([]);
  const [teks, setTeks] = useState('');
  const [error, setError] = useState('');
  const idTerakhir = useRef(0);
  const kotakPesan = useRef();

  // Ambil data klaim dan pesan yang belum pernah diterima
  const muat = useCallback(async () => {
    setKlaim(await api('/klaim/' + id));

    const baru = await api(`/klaim/${id}/pesan?setelah=${idTerakhir.current}`);
    if (baru.length) {
      idTerakhir.current = baru[baru.length - 1].id;
      setPesan((lama) => [...lama, ...baru]);
    }
  }, [id]);

  // Muat saat dibuka, lalu cek pesan baru tiap 3 detik
  useEffect(() => {
    idTerakhir.current = 0;
    setPesan([]);
    muat();
    const timer = setInterval(muat, 3000);
    return () => clearInterval(timer);
  }, [muat]);

  // Gulir otomatis ke pesan terbaru
  useEffect(() => {
    if (kotakPesan.current) kotakPesan.current.scrollTop = 1e9;
  }, [pesan]);

  // Kirim aksi ke server (pesan, pilih, tolak), lalu muat ulang
  const aksi = (path, body) => async () => {
    try {
      await api(`/klaim/${id}/${path}`, { body: body || {} });
      await muat();
      reload();
    } catch (x) {
      setError(x.message);
    }
  };

  const kirimPesan = async () => {
    if (!teks.trim()) return;
    await aksi('pesan', { isi: teks })();
    setTeks('');
  };

  if (!klaim) return null;

  const chatTerbuka = ['chat', 'dipilih'].includes(klaim.status);

  let banner;
  if (klaim.status === 'dipilih') {
    banner = (
      <div className="warnb" style={{ background: 'var(--mint)', color: 'var(--acc2)' }}>
        <b>Pemilik terverifikasi.</b> Lanjutkan percakapan lewat chat di website ini untuk mengatur serah terima.
      </div>
    );
  } else if (chatTerbuka) {
    banner = (
      <div className="info">
        {fin
          ? 'Jangan sebutkan ciri rahasia. Tanyakan, lalu biarkan pengklaim menjawab.'
          : 'Penemu akan menanyakan ciri barang. Jawab dari ingatanmu.'}
      </div>
    );
  } else {
    banner = <div className="info">Klaim {klaim.status}.</div>;
  }

  return (
    <>
      {banner}
      {error && <div className="sm" style={{ color: 'var(--redfg)' }}>{error}</div>}

      <div className="msgs" ref={kotakPesan}>
        {pesan.length ? (
          pesan.map((m) => {
            const punyaSaya = m.pengirim_id === me;
            return (
              <div key={m.id} className={'bub ' + (punyaSaya ? 'me' : '')}>
                <span className="who">
                  {punyaSaya ? 'Kamu' : fin ? klaim.pengklaim_nama : 'Penemu'}
                </span>
                {m.isi}
              </div>
            );
          })
        ) : (
          <div className="sm">Belum ada pesan.</div>
        )}
      </div>

      {chatTerbuka && !ro && (
        <div className="crow">
          <input
            className="inp"
            placeholder="Tulis pesan..."
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && kirimPesan()}
          />
          <button className="btn pri" onClick={kirimPesan}>Kirim</button>
        </div>
      )}

      {/* Penemu: pilih atau tolak pengklaim */}
      {fin && !ro && klaim.status === 'chat' && (
        <div className="lbtns">
          <button className="btn pri" onClick={aksi('pilih')}>Pilih pemilik</button>
          <button className="btn net" onClick={aksi('tolak')}>Tolak</button>
        </div>
      )}

      {/* Penemu: serah terima setelah pemilik dipilih */}
      {fin && !ro && klaim.status === 'dipilih' && (
        <div className="lbtns">
          <button className="btn pri" onClick={() => go('serah', id)}>Serahkan barang</button>
          <button
            className="btn warn"
            onClick={() =>
              D.setDlg({ t: 'batalask', id, rid: klaim.laporan_temuan_id, nama: klaim.judul })
            }
          >
            Batalkan serah terima
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn warn"
          onClick={() => D.setDlg({ t: 'rpt', id: klaim.laporan_temuan_id })}
        >
          Laporkan
        </button>
      </div>
    </>
  );
}
