const { query } = require('../db');
const { kirimError } = require('../utils/respond');

const harusLogin = (req, res, next) => {
  if (req.session.uid) return next();
  res.status(401).json({ error: 'Silakan masuk dulu' });
};

const harusAdmin = async (req, res, next) => {
  if (!req.session.uid) return kirimError(res, 401, 'Silakan masuk dulu');

  const [u] = await query('SELECT peran FROM pengguna WHERE id=?', [req.session.uid]);
  if (u && u.peran === 'admin') return next();
  kirimError(res, 403, 'Hanya admin');
};

module.exports = { harusLogin, harusAdmin };
