// Pembungkus fetch ke backend. Otomatis menangani JSON, FormData, dan error.
export const api = async (url, opsi = {}) => {
  const isFormData = opsi.body instanceof FormData;

  const res = await fetch('/api' + url, {
    method: opsi.method || (opsi.body ? 'POST' : 'GET'),
    credentials: 'include',
    headers: isFormData || !opsi.body ? {} : { 'Content-Type': 'application/json' },
    body: isFormData ? opsi.body : opsi.body && JSON.stringify(opsi.body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Gagal');
  return data;
};
