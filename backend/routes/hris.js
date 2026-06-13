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
    const { code, client_id, client_secret } = req.body;
    if (!code || !client_id || !client_secret) {
      return res.status(400).json({ error: 'code, client_id and client_secret are required' });
    }

    const axios = require('axios');

    // Zoho Self Client uses 'urn:ietf:wg:oauth:2.0:oob' as redirect_uri — NOT a real URL
    // Try both redirect_uri variants since Zoho is strict about matching
    const variants = [
      'urn:ietf:wg:oauth:2.0:oob',
      'https://thankeeu.com',
      '',
    ];

    let lastError = null;
    for (const redirect_uri of variants) {
      try {
        const params = new URLSearchParams({ code, client_id, client_secret, grant_type: 'authorization_code' });
        if (redirect_uri) params.set('redirect_uri', redirect_uri);

        console.log('[zoho-exchange] trying redirect_uri:', redirect_uri || '(none)');
        const r = await axios.post(
          'https://accounts.zoho.com/oauth/v2/token',
          params.toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
        );
        console.log('[zoho-exchange] response:', JSON.stringify(r.data));

        if (r.data.refresh_token) {
          return res.json({
            refresh_token: r.data.refresh_token,
            access_token:  r.data.access_token,
            expires_in:    r.data.expires_in,
          });
        }
        lastError = r.data;
      } catch (e) {
        lastError = e.response?.data || e.message;
        console.log('[zoho-exchange] variant failed:', lastError);
      }
    }

    return res.status(400).json({
      error: 'Zoho did not return a refresh token — the authorization code may have expired or already been used. Please generate a fresh code in Zoho API Console and try immediately.',
      detail: lastError
    });

  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('zoho-exchange error:', detail);
    res.status(400).json({ error: 'Token exchange failed', detail });
  }
});

module.exports = router;
