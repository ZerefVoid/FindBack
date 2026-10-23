const multer = require('multer');
const { UPLOAD_DIR } = require('../config');

// Hanya menerima gambar, maksimal 5 MB
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 5e6 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

// URL publik file yang baru diunggah (null kalau tidak ada file)
const urlFoto = (file) => (file ? '/uploads/' + file.filename : null);

module.exports = { upload, urlFoto };
