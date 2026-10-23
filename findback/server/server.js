require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { UPLOAD_DIR } = require('./config');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Foto yang diunggah pengguna
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/kategori', require('./routes/kategori'));
app.use('/api/laporan', require('./routes/laporan'));
app.use('/api/klaim', require('./routes/klaim'));
app.use('/api/notifikasi', require('./routes/notifikasi'));
app.use('/api/peringkat', require('./routes/peringkat'));
app.use('/api/aduan', require('./routes/aduan'));
app.use('/api/profil', require('./routes/profil'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('API siap di :' + PORT));
