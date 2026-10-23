import { useState } from 'react';

// State untuk satu foto yang dipilih pengguna (file asli + URL pratinjau)
export default function usePhoto() {
  const [file, setFile] = useState();
  const [preview, setPreview] = useState();

  const pilih = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return { file, preview, pilih };
}
