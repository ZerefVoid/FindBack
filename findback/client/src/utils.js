import { MONTHS } from './constants.js';

// "2026-10-22 08:00:00" -> "22 Okt 2026"
export const fmt = (tanggal) => {
  const d = new Date(String(tanggal).replace(' ', 'T'));
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// "Rina Maharani" -> "RM"
export const ini = (nama) =>
  nama.split(' ').map((kata) => kata[0]).slice(0, 2).join('').toUpperCase();

// Aduan yang diambil admin lebih dari 24 jam lalu boleh diambil alih
export const isStale = (aduan) =>
  aduan.diambil_pada &&
  Date.parse(String(aduan.diambil_pada).replace(' ', 'T')) < Date.now() - 864e5;
