import { useState } from 'react';
import { api } from '../api.js';
import { POS, TODAY } from '../constants.js';
import usePhoto from '../hooks/usePhoto.js';
import Field from '../components/Field.jsx';
import PhotoDrop from '../components/PhotoDrop.jsx';

const TIPS_HILANG = [
  'Laporan tayang 30 hari dengan pengingat di hari ke-25.',
  'Sistem langsung mencari laporan temuan yang mirip.',
  'Foto membantu, tetapi tutup nama, NIM, dan nomor kartu.',
  'Nomor HP tidak tampil di publik.',
  'Reward adalah kesepakatan kedua pihak dan di luar tanggung jawab FindBack.',
  'Jangan bagikan ciri rahasia di luar chat verifikasi.',
];

const TIPS_TEMUAN = [
  'Foto wajib, dan tutup data kartu (untuk KTM jangan perlihatkan nama dan nomor).',
  'Isi ciri rahasia yang hanya diketahui pemilik asli.',
  'Jangan menyebut ciri rahasia saat chat.',
  'Serah terima di pos satpam atau kantor kemahasiswaan.',
  'Pilih posisi barang sesuai kenyataan.',
  'Poin diberikan untuk serah terima yang disertai foto bukti (10 poin).',
];

// Form laporan. j = 'hilang' atau 'temuan'
export default function Lapor({ j, kat, user, go, reload }) {
  const hilang = j === 'hilang';
  const [D, setD] = useState({});
  const [error, setError] = useState('');
  const foto = usePhoto();

  const jumlahAktif = user.laporan_aktif;
  const full = jumlahAktif >= user.batas;
  const tips = hilang ? TIPS_HILANG : TIPS_TEMUAN;

  // ---- Helper untuk isian form ----
  const setField = (key) => (e) => setD({ ...D, [key]: e.target.value });

  const inputField = (key, placeholder, type) => (
    <input
      className="inp"
      type={type}
      placeholder={placeholder}
      value={D[key] || ''}
      onChange={setField(key)}
    />
  );

  const textField = (key, placeholder) => (
    <textarea
      className="inp"
      placeholder={placeholder}
      value={D[key] || ''}
      onChange={setField(key)}
    />
  );

  // ---- Kirim laporan ----
  const kirim = async () => {
    try {
      if (D.kat === 'KTM' && !hilang && !D.ktm) {
        return setError('Centang bahwa data kartu pada foto sudah ditutup.');
      }

      const form = new FormData();
      const kategori = kat.find((c) => c.nama === D.kat);

      form.append('jenis', j);
      form.append('ktm', D.ktm ? 1 : 0);
      form.append('kategori_id', kategori ? kategori.id : '');
      form.append('judul', D.nama || '');
      form.append('deskripsi', D.ciri || '');
      form.append('tanggal_kejadian', D.tgl || '');
      form.append('lokasi_cerita', D.lok || '');

      if (hilang) {
        form.append('reward', D.reward || '');
      } else {
        form.append('ciri_rahasia', D.rahasia || '');
        form.append('posisi_barang', Object.keys(POS).find((kode) => POS[kode] === D.posisi) || '');
        form.append('kondisi_titipan', D.kondisi || '');
      }

      if (foto.file) form.append('foto', foto.file);

      const hasil = await api('/laporan', { body: form });
      await reload();
      go('detail', hasil.id);
    } catch (x) {
      setError(x.message);
    }
  };

  return (
    <div className="w860">
      <h1 className="pt">{hilang ? 'Laporkan barang hilang' : 'Laporkan barang temuan'}</h1>
      <p className="subt">
        {hilang
          ? 'Semakin lengkap ciri yang kamu isi, semakin mudah sistem menemukan kecocokan.'
          : 'Terima kasih sudah mau membantu. Foto dan ciri rahasia adalah dua hal terpenting.'}
      </p>

      {full ? (
        <div className="warnb" style={{ margin: '16px 0' }}>
          Kamu sudah punya 3 laporan aktif. Selesaikan atau cabut salah satu untuk membuat laporan baru.{' '}
          <a onClick={() => go('saya')}>Laporan saya</a>
        </div>
      ) : (
        <div className="sm" style={{ marginTop: 12 }}>Kamu punya {jumlahAktif} dari 3 laporan aktif.</div>
      )}

      <div className="tipbox" style={{ marginTop: 12, padding: '20px 24px' }}>
        <b>Baca dulu sebelum mengisi</b>
        <ul className="tip6">
          {tips.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </div>

      <div className="legend">
        <b>Tingkat prioritas isian</b>
        <span className="pl p-sg">Sangat penting: isi dengan teliti</span>
        <span className="pl p-wj">Wajib: harus diisi</span>
        {hilang && <span className="pl p-op">Opsional: boleh dikosongkan</span>}
      </div>

      <fieldset disabled={full} style={{ border: 0, padding: 0, margin: 0, opacity: full ? 0.55 : 1 }}>
        <div className="panel fl">

          {/* Khusus temuan: foto dan ciri rahasia */}
          {!hilang && (
            <Field c="sg" lab="Foto barang" tag="Sangat penting">
              <PhotoDrop
                kelas="sg"
                teks="Tarik foto ke sini atau ambil dengan kamera"
                preview={foto.preview}
                onPilih={foto.pilih}
              />
            </Field>
          )}
          {!hilang && (
            <Field
              c="sg"
              lab="Ciri rahasia"
              tag="Sangat penting"
              hint="Contoh: Wallpaper gambar kucing. Tidak tampil di publik. Dipakai untuk memastikan pemilik asli."
            >
              {inputField('rahasia')}
            </Field>
          )}

          <Field c="wj" lab="Kategori barang" tag="Wajib">
            <select className="inp" value={D.kat || ''} onChange={setField('kat')}>
              <option value="">Pilih kategori</option>
              {kat.map((c) => <option key={c.id}>{c.nama}</option>)}
            </select>
          </Field>

          {D.kat === 'KTM' && !hilang && (
            <label className="opt">
              <input
                type="checkbox"
                checked={!!D.ktm}
                onChange={(e) => setD({ ...D, ktm: e.target.checked })}
              />{' '}
              Saya sudah menutup nama, NIM, dan nomor kartu pada foto.
            </label>
          )}

          <Field c="wj" lab="Nama barang" tag="Wajib">
            {inputField('nama', hilang ? 'Contoh: Dompet kulit cokelat' : 'Contoh: Botol minum biru')}
          </Field>

          {hilang ? (
            <Field
              c="sg"
              lab="Ciri-ciri"
              tag="Sangat penting"
              hint="Warna, merek, goresan, stiker, atau isi. Semakin rinci, semakin mudah dicocokkan."
            >
              {textField('ciri')}
            </Field>
          ) : (
            <Field
              c="wj"
              lab="Ciri-ciri yang boleh dilihat publik"
              tag="Wajib"
              hint="Tulis ciri umum saja. Ciri khusus ditulis di kolom rahasia."
            >
              {textField('ciri')}
            </Field>
          )}

          <Field c="wj" lab={hilang ? 'Tanggal hilang' : 'Tanggal ditemukan'} tag="Wajib">
            <input
              className="inp"
              style={{ maxWidth: 320 }}
              type="date"
              max={TODAY}
              value={D.tgl || ''}
              onChange={setField('tgl')}
            />
          </Field>

          {hilang ? (
            <Field
              c="sg"
              lab="Di mana terakhir kali kamu melihatnya?"
              tag="Sangat penting"
              hint="Ceritakan sebebas mungkin: ruangan, jalur yang dilewati, atau kegiatan terakhir."
            >
              {textField('lok', 'Contoh: Terakhir kupakai di kantin Gedung B sekitar jam 12, lalu jalan ke parkiran timur.')}
            </Field>
          ) : (
            <Field c="wj" lab="Di mana kamu menemukannya?" tag="Wajib" hint="Ceritakan sebebas mungkin.">
              {textField('lok', 'Contoh: Di bangku depan perpustakaan lantai 1')}
            </Field>
          )}

          {/* Khusus temuan: posisi barang */}
          {!hilang && (
            <Field c="wj" lab="Barang sekarang ada di mana?" tag="Wajib">
              <select className="inp" value={D.posisi || ''} onChange={setField('posisi')}>
                <option value="">Pilih posisi</option>
                {Object.values(POS).map((teks) => <option key={teks}>{teks}</option>)}
              </select>
            </Field>
          )}

          {!hilang && D.posisi === POS.staf_satpam && (
            <Field
              c="wj"
              lab="Ceritakan kondisinya"
              tag="Wajib"
              hint="Tulis siapa stafnya (nama atau jabatan), di mana barang dititipkan, dan kondisi barang saat ini."
            >
              {textField('kondisi', 'Contoh: Dititipkan ke Pak Budi, petugas Gedung B, di pos lantai 1. Layar HP retak di pojok.')}
            </Field>
          )}

          {/* Khusus hilang: isian opsional */}
          {hilang && (
            <Field c="op" lab="Foto barang" tag="Opsional">
              <PhotoDrop
                teks="Tarik foto ke sini atau pilih file"
                preview={foto.preview}
                onPilih={foto.pilih}
              />
            </Field>
          )}
          {hilang && (
            <Field
              c="op"
              lab="Reward"
              tag="Opsional"
              hint="Contoh: Traktir makan. Ucapan terima kasih untuk penemu. Kesepakatan kedua pihak."
            >
              {inputField('reward')}
            </Field>
          )}

          <div className="info">
            {hilang ? 'Penemu' : 'Pengklaim'} menghubungimu lewat chat di website ini, tanpa perlu nomor HP.
          </div>
          {error && <div className="sm" style={{ color: 'var(--redfg)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className={'btn pri lg ' + (full ? 'off' : '')} onClick={kirim}>Kirim laporan</button>
            <button className="btn net lg" type="button" onClick={() => go('home')}>Batal</button>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
