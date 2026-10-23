import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { POS, TODAY } from '../constants.js';
import usePhoto from '../hooks/usePhoto.js';
import Field from '../components/Field.jsx';
import PhotoDrop from '../components/PhotoDrop.jsx';

// Edit laporan milik sendiri. id = id laporan
export default function EditLaporan({ id, kat, go, reload, toast, setDlg }) {
  const [r, setR] = useState(); // undefined = memuat, false = tidak bisa diedit
  const [D, setD] = useState();
  const foto = usePhoto();

  useEffect(() => {
    api('/laporan/' + id)
      .then((laporan) => {
        setR(laporan);
        setD({
          kat: laporan.kategori,
          nama: laporan.judul,
          ciri: laporan.deskripsi || '',
          rahasia: laporan.ciri_rahasia || '',
          tgl: String(laporan.tanggal_kejadian).slice(0, 10),
          lok: laporan.lokasi_cerita || '',
          posisi: POS[laporan.posisi_barang] || '',
          kondisi: laporan.kondisi_titipan || '',
          reward: laporan.reward || '',
        });
      })
      .catch(() => setR(false));
  }, [id]);

  if (r === false) {
    return <div className="pg"><div className="panel">Laporan ini tidak dapat diedit.</div></div>;
  }
  if (!r || !D) return null;

  const hilang = r.jenis === 'hilang';

  // Selama ada klaim aktif, ciri-ciri dan ciri rahasia dikunci
  const terkunci = (r.klaim || []).some((c) => ['chat', 'dipilih'].includes(c.status));

  // ---- Helper untuk isian form ----
  const setField = (key) => (e) => setD({ ...D, [key]: e.target.value });

  const inputField = (key, type) => (
    <input className="inp" type={type} value={D[key] || ''} onChange={setField(key)} />
  );

  const textField = (key) => (
    <textarea className="inp" value={D[key] || ''} onChange={setField(key)} />
  );

  const kotakTerkunci = (nilai) => (
    <div className="inp" style={{ background: 'var(--mint)', minHeight: 44 }}>{nilai}</div>
  );

  // ---- Simpan perubahan ----
  const simpan = async () => {
    const kurang = [];
    if (!D.kat) kurang.push('kategori');
    if (!D.nama) kurang.push('nama barang');
    if (!terkunci && !D.ciri) kurang.push('ciri-ciri');
    if (!D.tgl) kurang.push('tanggal');
    if (!D.lok) kurang.push('lokasi');
    if (!hilang) {
      if (!terkunci && !D.rahasia) kurang.push('ciri rahasia');
      if (!D.posisi) kurang.push('posisi barang');
      if (D.posisi === POS.staf_satpam && !D.kondisi) kurang.push('cerita kondisi barang');
    }
    if (kurang.length) {
      return setDlg({ t: 'ok', title: 'Lengkapi dulu isian ini', msg: kurang.join(', ') + '.' });
    }

    try {
      const form = new FormData();
      const kategori = kat.find((c) => c.nama === D.kat);

      form.append('kategori_id', kategori ? kategori.id : '');
      form.append('judul', D.nama);
      form.append('deskripsi', D.ciri);
      form.append('tanggal_kejadian', D.tgl);
      form.append('lokasi_cerita', D.lok);
      form.append('ciri_rahasia', D.rahasia);
      form.append('posisi_barang', Object.keys(POS).find((kode) => POS[kode] === D.posisi) || '');
      form.append('kondisi_titipan', D.kondisi);
      form.append('reward', D.reward);
      if (foto.file) form.append('foto', foto.file);

      await api('/laporan/' + id, { method: 'PUT', body: form });
      toast('Perubahan disimpan.');
      await reload();
      go('detail', id);
    } catch (x) {
      setDlg({ t: 'ok', title: 'Gagal menyimpan', msg: x.message });
    }
  };

  return (
    <div className="w860">
      <h1 className="pt">Edit laporan</h1>
      <p className="subt">{r.judul}. Perubahan langsung tampil di laporan.</p>

      {terkunci && (
        <div className="warnb" style={{ margin: '16px 0' }}>
          Ada klaim aktif pada laporan ini. Ciri-ciri dan ciri rahasia dikunci, dan pengklaim akan
          diberi tahu jika kamu menyimpan perubahan.
        </div>
      )}

      <div className="panel fl" style={{ marginTop: 16 }}>
        <Field c="wj" lab="Kategori barang" tag="Wajib">
          <select className="inp" value={D.kat} onChange={setField('kat')}>
            <option value="">Pilih kategori</option>
            {kat.map((c) => <option key={c.id}>{c.nama}</option>)}
          </select>
        </Field>

        <Field c="wj" lab="Nama barang" tag="Wajib">{inputField('nama')}</Field>

        {terkunci ? (
          <Field c="wj" lab="Ciri-ciri" tag="Terkunci" hint="Dikunci saat ada klaim aktif.">
            {kotakTerkunci(r.deskripsi)}
          </Field>
        ) : (
          <Field c="wj" lab="Ciri-ciri" tag="Wajib">{textField('ciri')}</Field>
        )}

        {!hilang && (terkunci ? (
          <Field c="sg" lab="Ciri rahasia" tag="Terkunci" hint="Dikunci saat ada klaim aktif.">
            {kotakTerkunci(r.ciri_rahasia)}
          </Field>
        ) : (
          <Field c="sg" lab="Ciri rahasia" tag="Sangat penting" hint="Tidak tampil di publik.">
            {inputField('rahasia')}
          </Field>
        ))}

        <Field c="wj" lab={hilang ? 'Tanggal hilang' : 'Tanggal ditemukan'} tag="Wajib">
          <input
            className="inp"
            style={{ maxWidth: 320 }}
            type="date"
            max={TODAY}
            value={D.tgl}
            onChange={setField('tgl')}
          />
        </Field>

        <Field c="wj" lab={hilang ? 'Terakhir terlihat di mana?' : 'Ditemukan di mana?'} tag="Wajib">
          {textField('lok')}
        </Field>

        {hilang ? (
          <Field c="op" lab="Reward" tag="Opsional">{inputField('reward')}</Field>
        ) : (
          <Field c="wj" lab="Barang sekarang ada di mana?" tag="Wajib">
            <select className="inp" value={D.posisi} onChange={setField('posisi')}>
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
            {textField('kondisi')}
          </Field>
        )}

        <Field c="op" lab="Ganti foto" tag="Opsional" hint="Kosongkan jika foto tidak diubah.">
          <PhotoDrop
            teks="Pilih foto baru untuk mengganti"
            preview={foto.preview}
            onPilih={foto.pilih}
          />
        </Field>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn pri lg" onClick={simpan}>Simpan perubahan</button>
          <button className="btn net lg" type="button" onClick={() => go('detail', id)}>Batal</button>
        </div>
      </div>
    </div>
  );
}
