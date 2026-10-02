const express = require('express');
const router = express.Router();

// Nigerian states
const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara'
].sort();

// Major cities per state (subset for autocomplete)
const STATE_CITIES = {
  'Lagos': ['Ikeja','Victoria Island','Lekki','Surulere','Yaba','Ajah','Ikorodu','Badagry','Ojo','Alimosho'],
  'FCT Abuja': ['Garki','Wuse','Maitama','Asokoro','Gwarinpa','Karu','Lugbe','Kubwa'],
  'Kano': ['Kano City','Nasarawa','Fagge','Gwale','Tarauni','Ungogo'],
  'Rivers': ['Port Harcourt','Obio-Akpor','Eleme','Ikwerre','Oyigbo','Okrika'],
  'Oyo': ['Ibadan','Ogbomoso','Oyo','Iseyin','Saki'],
  'Anambra': ['Awka','Onitsha','Nnewi','Ekwulobia'],
  'Delta': ['Asaba','Warri','Sapele','Ughelli'],
  'Enugu': ['Enugu','Nsukka','Agbani','Oji River'],
  'Kaduna': ['Kaduna','Zaria','Kafanchan','Makarfi'],
  'Ogun': ['Abeokuta','Sagamu','Ijebu-Ode','Ota'],
};

// ─── GET /locations/states ─────────────────────────────────────────
router.get('/states', (req, res) => {
  res.json({ success: true, states: NIGERIAN_STATES });
});

// ─── GET /locations/cities/:state ─────────────────────────────────
router.get('/cities/:state', (req, res) => {
  const state = decodeURIComponent(req.params.state);
  const cities = STATE_CITIES[state] || [];
  res.json({ success: true, cities: cities.sort() });
});

module.exports = router;
