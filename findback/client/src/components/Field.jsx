// Satu isian form: label + penanda prioritas + petunjuk + isian itu sendiri.
// c: 'sg' (sangat penting), 'wj' (wajib), selain itu opsional.
export default function Field({ c, lab, tag, hint, children }) {
  const prioritas = c === 'sg' ? 'p-sg' : c === 'wj' ? 'p-wj' : 'p-op';

  return (
    <div className={'fld ' + c}>
      <label>
        {lab}
        <span className={'pl ' + prioritas}>{tag}</span>
      </label>
      {hint && <div className="h">{hint}</div>}
      {children}
    </div>
  );
}
