const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const GIPHY_BASE = 'https://api.giphy.com/v1/gifs';
const GIPHY_KEY  = () => process.env.GIPHY_API_KEY || '';

// GET /api/gifs/search?q=birthday&limit=24&offset=0
router.get('/search', async (req, res) => {
  try {
    const key = GIPHY_KEY();
    if (!key) return res.status(503).json({ error: 'GIF service not configured' });
    const { q = 'celebration', limit = 24, offset = 0 } = req.query;
    const r = await axios.get(`${GIPHY_BASE}/search`, {
      params: { api_key: key, q, limit: Math.min(Number(limit), 50), offset: Number(offset), rating: 'g', bundle: 'messaging_non_clips' },
      timeout: 8000,
    });
    res.json(r.data);
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GIPHY search error:', status, err.message);
    res.status(status < 500 ? status : 502).json({ error: 'Could not fetch GIFs' });
  }
});

// GET /api/gifs/trending?limit=24&offset=0
router.get('/trending', async (req, res) => {
  try {
    const key = GIPHY_KEY();
    if (!key) return res.status(503).json({ error: 'GIF service not configured' });
    const { limit = 24, offset = 0 } = req.query;
    const r = await axios.get(`${GIPHY_BASE}/trending`, {
      params: { api_key: key, limit: Math.min(Number(limit), 50), offset: Number(offset), rating: 'g', bundle: 'messaging_non_clips' },
      timeout: 8000,
    });
    res.json(r.data);
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('GIPHY trending error:', status, err.message);
    res.status(status < 500 ? status : 502).json({ error: 'Could not fetch GIFs' });
  }
});

module.exports = router;
