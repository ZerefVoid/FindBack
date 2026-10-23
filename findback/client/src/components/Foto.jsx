// Foto laporan (dipakai di halaman detail). "tinggi" opsional.
export default function Foto({ r, tinggi }) {
  const style = {
    ...(tinggi ? { height: tinggi, borderRadius: 12 } : {}),
    ...(r.foto_url ? { backgroundImage: `url(${r.foto_url})` } : {}),
  };

  return (
    <div className={'ph ' + (r.foto_url ? '' : 'no')} style={style}>
      {!r.foto_url && 'Tanpa foto'}
    </div>
  );
}
