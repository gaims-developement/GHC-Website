require('dotenv').config();
const { pool } = require('./config/db');
const { Country, State, City } = require('country-state-city');

async function setupLocations() {
  console.log("Starting location database setup...");

  try {
    // 1. Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        iso2 VARCHAR(2) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phonecode VARCHAR(255)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS states (
        id INT PRIMARY KEY AUTO_INCREMENT,
        country_id INT NOT NULL,
        state_code VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
        UNIQUE KEY unique_state (country_id, state_code)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        state_id INT NOT NULL,
        country_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
        FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
      )
    `);

    // Add indexes for searching
    await pool.query('CREATE INDEX idx_cities_name ON cities(name(50))');
    await pool.query('CREATE INDEX idx_states_name ON states(name(50))');
    await pool.query('CREATE INDEX idx_countries_name ON countries(name(50))');

    console.log("Tables and indexes created successfully.");
  } catch (e) {
    if (e.code === 'ER_DUP_KEYNAME') {
      console.log("Indexes already exist.");
    } else if (e.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log("Tables already exist.");
    } else {
      console.error("Error creating tables:", e.message);
    }
  }

  try {
    console.log("Importing Countries...");
    const countries = Country.getAllCountries();
    let countriesInserted = 0;
    
    // Store country ID mapping for states
    const countryMap = new Map(); // iso2 -> id

    for (const c of countries) {
      const [result] = await pool.query(
        `INSERT IGNORE INTO countries (iso2, name, phonecode) VALUES (?, ?, ?)`,
        [c.isoCode, c.name, c.phonecode]
      );
      
      let countryId;
      if (result.insertId) {
        countryId = result.insertId;
        countriesInserted++;
      } else {
        const [existing] = await pool.query(`SELECT id FROM countries WHERE iso2 = ?`, [c.isoCode]);
        countryId = existing[0].id;
      }
      countryMap.set(c.isoCode, countryId);
    }
    console.log(`Countries: Inserted ${countriesInserted}, Total ${countryMap.size}`);

    console.log("Importing States...");
    const states = State.getAllStates();
    let statesInserted = 0;
    
    // Store state ID mapping for cities
    const stateMap = new Map(); // countryCode_stateCode -> id

    for (const s of states) {
      const countryId = countryMap.get(s.countryCode);
      if (!countryId) continue; // Should not happen, but safe

      const [result] = await pool.query(
        `INSERT IGNORE INTO states (country_id, state_code, name) VALUES (?, ?, ?)`,
        [countryId, s.isoCode, s.name]
      );

      let stateId;
      if (result.insertId) {
        stateId = result.insertId;
        statesInserted++;
      } else {
        const [existing] = await pool.query(
          `SELECT id FROM states WHERE country_id = ? AND state_code = ?`, 
          [countryId, s.isoCode]
        );
        stateId = existing[0]?.id;
      }
      
      if (stateId) {
        stateMap.set(`${s.countryCode}_${s.isoCode}`, stateId);
      }
    }
    console.log(`States: Inserted ${statesInserted}, Total ${stateMap.size}`);

    console.log("Importing Cities... (This might take a minute)");
    const cities = City.getAllCities();
    let citiesInserted = 0;
    
    // We'll insert cities in batches to avoid overwhelming MySQL
    const batchSize = 1000;
    let batchValues = [];

    // First, clear cities table to avoid duplicate checking for millions of rows
    // Since cities only depend on states/countries, it's safer to truncate if we're re-seeding
    console.log("Truncating cities table for fresh import...");
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE cities');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    for (const city of cities) {
      const countryId = countryMap.get(city.countryCode);
      const stateId = stateMap.get(`${city.countryCode}_${city.stateCode}`);
      
      if (!countryId || !stateId) continue;

      batchValues.push([stateId, countryId, city.name]);

      if (batchValues.length === batchSize) {
        await pool.query(
          `INSERT INTO cities (state_id, country_id, name) VALUES ?`,
          [batchValues]
        );
        citiesInserted += batchValues.length;
        batchValues = [];
        if (citiesInserted % 10000 === 0) console.log(`...Inserted ${citiesInserted} cities`);
      }
    }

    // Insert remaining
    if (batchValues.length > 0) {
      await pool.query(
        `INSERT INTO cities (state_id, country_id, name) VALUES ?`,
        [batchValues]
      );
      citiesInserted += batchValues.length;
    }

    console.log(`Cities: Inserted ${citiesInserted}`);
    console.log("Location database setup complete.");

  } catch (e) {
    console.error("Error during data import:", e);
  }

  process.exit(0);
}

setupLocations();
