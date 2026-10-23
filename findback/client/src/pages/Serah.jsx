import { useState, useEffect, useContext } from 'react';
import { Ctx } from '../context.js';
import { api } from '../api.js';
import { POS } from '../constants.js';
import { fmt } from '../utils.js';
import usePhoto from '../hooks/usePhoto.js';
import PhotoDrop from '../components/PhotoDrop.jsx';

// Halaman serah terima. id = id klaim yang dipilih penemu
export default function Serah({ id, go }) {
  const D = useContext(Ctx);
  const [klaim, setKlaim] = useState();
  const [laporan, setLaporan] = useState();
  const foto = usePhoto();

  useEffect(() => {
    api('/klaim/' + id).then((k) => {
      setKlaim(k);
      api('/laporan/' + k.laporan_temuan_id).then(setLaporan);
    });
  }, [id]);

  if (!klaim || !laporan) return <div className="pg"><div className="panel">Memuat...</div></div>;

  const konfirmasi = async () => {
    try {
      const form = new FormData();
      if (foto.file) form.append('foto', foto.file);
      await api(`/klaim/${id}/serah-terima`, { body: form });
      go('detail', laporan.id);
    } catch (x) {
      D.setDlg({ t: 'ok', title: 'Gagal', msg: x.message });
    }
  };

  const batalkan = () => D.setDlg({ t: 'batalask', id, rid: laporan.id, nama: laporan.judul });

  return (
    <div className="w960">
      <h1 className="pt">Serahkan barang</h1>
      <p className="subt">Konfirmasi setelah barang berpindah tangan ke pemilik.</p>

      <div className="two" style={{ marginTop: 20 }}>
        {/* Kiri: ringkasan laporan */}
        <div className="panel">
          <span className="badge s-dalam_klaim">Dalam proses klaim</span>
          <h2 style={{ fontSize: 22, margin: '10px 0' }}>{laporan.judul}</h2>

          <div className="rows">
            <div><b>Pemilik terpilih</b><span>{klaim.pengklaim_nama}</span></div>
            <div><b>Posisi barang</b><span>{POS[laporan.posisi_barang]}</span></div>
            <div><b>Laporan dibuat</b><span>{fmt(laporan.dibuat_pada)}</span></div>
          </div>

          <div className="stp"><i className="d">✓</i>Pemilik terverifikasi lewat chat</div>
          <div className="stp"><i className="c">2</i>Serahkan barang dan konfirmasi di sini</div>
          <div className="stp"><i>3</i>Laporan menjadi Dikembalikan</div>
        </div>

        {/* Kanan: foto bukti serah terima */}
        <div className="panel stk">
          <div className="sbar">
            <h2 style={{ fontSize: 22 }}>Foto bukti serah terima</h2>
            <span className="badge s-ditemukan" style={{ fontSize: 13 }}>Dapat 10 poin</span>
          </div>

          <PhotoDrop
            kelas="pr"
            teks="Tarik foto ke sini atau ambil dengan kamera"
            preview={foto.preview}
            onPilih={foto.pilih}
          />

          <div className="sm">Foto barang saat diserahkan. Tutup nama, NIM, dan nomor kartu.</div>

          <button className="btn pri lg" onClick={konfirmasi}>Sudah diserahkan</button>
          <button className="btn net lg" onClick={() => go('detail', laporan.id)}>Kembali ke chat</button>
          <button className="btn warn lg" onClick={batalkan}>Batalkan serah terima</button>
        </div>
      </div>
    </div>
  );
}
