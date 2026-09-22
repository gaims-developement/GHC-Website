const { pool } = require('../config/db');

const getCountries = async (req, res) => {
  try {
    const [countries] = await pool.query('SELECT id, name, iso2 FROM countries ORDER BY name ASC');
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};

const getStates = async (req, res) => {
  const { countryId } = req.params;
  try {
    const [states] = await pool.query(
      'SELECT id, name, state_code FROM states WHERE country_id = ? ORDER BY name ASC',
      [countryId]
    );
    res.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
};

const searchCities = async (req, res) => {
  const { stateId, search } = req.query;
  try {
    if (!stateId) {
      return res.status(400).json({ error: 'stateId is required' });
    }

    let query = 'SELECT id, name FROM cities WHERE state_id = ?';
    const params = [stateId];

    if (search && search.trim() !== '') {
      query += ' AND name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    query += ' ORDER BY name ASC LIMIT 100';

    const [cities] = await pool.query(query, params);
    res.json(cities);
  } catch (error) {
    console.error('Error searching cities:', error);
    res.status(500).json({ error: 'Failed to search cities' });
  }
};

module.exports = {
  getCountries,
  getStates,
  searchCities,
};
