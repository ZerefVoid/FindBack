# FindBack (MySQL + Express + React)
1. `mysql -u root -p < server/schema.sql`
2. `cd server && cp .env.example .env && npm i && npm run seed && npm start`  (API :4000)
3. `cd client && npm i && npm run dev`  (web :5173)

Akun demo (kata sandi `demo1234`): rina@kampus.ac.id, budi@kampus.ac.id, admin@findback.id

## Struktur folder

```
server/
  server.js          setup Express + pasang semua route
  config.js          konstanta (batas laporan, status aktif, lencana)
  db.js              koneksi MySQL
  middleware/        auth (login/admin), upload foto, penangkap error
  routes/            satu file per fitur: auth, laporan, klaim, admin, ...
  services/          logika pencocokan laporan hilang/temuan
  utils/             helper kecil (notifikasi, balasan error)

client/src/
  App.jsx            routing sederhana + state global
  api.js             pembungkus fetch
  constants.js       label status, posisi barang, lencana, dll
  utils.js           fmt tanggal, inisial
  context.js         Ctx (dialog + toast)
  components/        Header, Card, Chat, Dialog, Field, PhotoDrop, ...
  hooks/             usePhoto
  pages/             satu file per halaman
  pages/admin/       Admin (dashboard) dan Tinjau (detail aduan)
```
