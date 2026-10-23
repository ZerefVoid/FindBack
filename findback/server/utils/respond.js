const kirimError = (res, status, pesan) => res.status(status).json({ error: pesan });

module.exports = { kirimError };
