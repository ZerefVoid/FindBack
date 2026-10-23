import { api } from '../api.js';
import ReportForm from './ReportForm.jsx';

// Pilih jenis laporan yang akan dibuat
function PilihJenis({ close, go }) {
  const mulai = (jenis) => {
    close();
    go('lapor', jenis);
  };

  return (
    <>
      <h3>Buat laporan</h3>
      <p className="sm">Apa yang ingin kamu laporkan?</p>
      <div className="act" style={{ justifyContent: 'stretch', flexDirection: 'column' }}>
        <button className="btn drk lg" onClick={() => mulai('hilang')}>Saya kehilangan barang</button>
        <button className="btn outd lg" onClick={() => mulai('temuan')}>Saya menemukan barang</button>
        <button className="btn net" onClick={close}>Batal</button>
      </div>
    </>
  );
}

// Konfirmasi mencabut laporan
function CabutLaporan({ d, close, setDlg, go, reload, toast }) {
  const cabut = async () => {
    try {
      await api(`/laporan/${d.id}/cabut`, { body: {} });
      close();
      toast('Laporan dicabut. Slotmu terbuka kembali.');
      await reload();
      go('saya', Date.now());
    } catch (x) {
      setDlg({ t: 'ok', title: 'Gagal', msg: x.message });
    }
  };

  return (
    <>
      <h3>Cabut laporan?</h3>
      <p style={{ fontSize: 14 }}>
        Laporan tidak akan tampil lagi di publik dan pencabutan tidak dapat dibatalkan.
        Slot laporanmu akan terbuka kembali.
      </p>
      <div className="sm"><b>{d.nama}</b></div>
      <div className="act">
        <button className="btn net" onClick={close}>Batal</button>
        <button className="btn danger" onClick={cabut}>Cabut laporan</button>
      </div>
    </>
  );
}

// Konfirmasi membatalkan serah terima
function BatalSerahTerima({ d, close, setDlg, go, reload, toast }) {
  const batalkan = async () => {
    try {
      await api(`/klaim/${d.id}/batalkan-serah-terima`, { body: {} });
      close();
      toast('Serah terima dibatalkan. Laporan kembali Ditemukan.');
      await reload();
      go('detail', d.rid);
    } catch (x) {
      setDlg({ t: 'ok', title: 'Gagal', msg: x.message });
    }
  };

  return (
    <>
      <h3>Batalkan serah terima?</h3>
      <p style={{ fontSize: 14 }}>
        Gunakan ini jika setelah bertemu ternyata orang tersebut bukan pemilik barang.
        Serah terima dibatalkan, klaimnya ditutup, laporan kembali berstatus Ditemukan,
        dan klaim lain yang ditutup karena pilihanmu dibuka lagi.
      </p>
      <div className="sm"><b>{d.nama}</b></div>
      <div className="act">
        <button className="btn net" onClick={close}>Batal</button>
        <button className="btn danger" onClick={batalkan}>Ya, batalkan</button>
      </div>
    </>
  );
}

// Pesan sederhana dengan tombol "Mengerti"
function Pesan({ d, close }) {
  return (
    <>
      <h3>{d.title}</h3>
      <p style={{ fontSize: 14 }}>{d.msg}</p>
      <div className="act">
        <button className="btn pri" onClick={close}>Mengerti</button>
      </div>
    </>
  );
}

// Dialog global. Jenisnya ditentukan oleh d.t:
// pilih | cabut | batalask | rpt | ok
export default function Dialog({ d, setDlg, go, reload, toast }) {
  if (!d) return null;

  const close = () => setDlg(null);
  const props = { d, close, setDlg, go, reload, toast };

  let isi;
  if (d.t === 'pilih') isi = <PilihJenis {...props} />;
  if (d.t === 'cabut') isi = <CabutLaporan {...props} />;
  if (d.t === 'batalask') isi = <BatalSerahTerima {...props} />;
  if (d.t === 'rpt') isi = <ReportForm {...props} />;
  if (d.t === 'ok') isi = <Pesan {...props} />;

  return (
    <div className="ovl" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="dlg" role="dialog" aria-modal="true">{isi}</div>
    </div>
  );
}
