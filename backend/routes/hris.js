const express = require('express');
const router  = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const {
  getConnections, saveConnection, testConnection, syncHRIS,
  getSyncLogs, deleteConnection,
  getBranches, saveBranch, deleteBranch,
} = require('../controllers/hrisController');

router.use(companyAuth);

// Connections
router.get('/',                          getConnections);
router.post('/connect',                  saveConnection);
router.post('/:connectionId/test',       testConnection);
router.post('/:connectionId/sync',       syncHRIS);
router.delete('/:connectionId',          deleteConnection);

// Sync history
router.get('/logs',                      getSyncLogs);

// Branch management
router.get('/branches',                  getBranches);
router.post('/branches',                 saveBranch);
router.delete('/branches/:branchId',     deleteBranch);

// POST /api/hris/zoho-exchange — one-time: exchange auth code for refresh token
// Called from HR settings page to get refresh token from authorization code
router.post('/zoho-exchange', companyAuth, async (req, res) => {
  try {
    const { code, client_id, client_secret, redirect_uri } = req.body;
    if (!code || !client_id || !client_secret) {
      return res.status(400).json({ error: 'code, client_id and client_secret are required' });
    }
    const params = new URLSearchParams({
      code, client_id, client_secret,
      redirect_uri: redirect_uri || 'https://thankeeu.com',
      grant_type: 'authorization_code',
    });
    const r = await require('axios').post(
      'https://accounts.zoho.com/oauth/v2/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );
    if (!r.data.refresh_token) {
      return res.status(400).json({ error: 'Zoho did not return a refresh token', detail: r.data });
    }
    res.json({
      refresh_token: r.data.refresh_token,
      access_token:  r.data.access_token,
      expires_in:    r.data.expires_in,
    });
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('zoho-exchange error:', detail);
    res.status(400).json({ error: 'Token exchange failed', detail });
  }
});

module.exports = router;
