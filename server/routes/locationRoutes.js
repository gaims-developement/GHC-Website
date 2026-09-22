const express = require('express');
const router = express.Router();
const { getCountries, getStates, searchCities } = require('../controllers/locationController');

router.get('/countries', getCountries);
router.get('/states/:countryId', getStates);
router.get('/cities', searchCities);

module.exports = router;
