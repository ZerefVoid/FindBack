const asyncHandler = (handler) => (req, res) =>
  handler(req, res).catch((e) => {
    console.error(e);
    res.status(500).json({ error: 'Kesalahan server' });
  });

module.exports = asyncHandler;
