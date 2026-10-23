import { useRef } from 'react';

// Kotak pilih foto. Klik membuka dialog pilih file.
export default function PhotoDrop({ kelas = '', teks, preview, onPilih }) {
  const inputRef = useRef();

  const saatDipilih = (e) => {
    const f = e.target.files[0];
    if (f) onPilih(f);
  };

  return (
    <>
      <div className={'drop ' + kelas} onClick={() => inputRef.current.click()}>
        {preview && <img src={preview} alt="Pratinjau foto" />}
        {preview ? 'Foto dipilih. Klik untuk mengganti.' : teks}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={saatDipilih}
      />
    </>
  );
}
