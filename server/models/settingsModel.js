const { pool } = require('../config/db');

const SETTINGS_KEY = 'conference_settings';

const defaultSettings = {
  conference: {
    name: 'Global Healthcare Conclave 2026',
    theme: 'Reimagining Healthcare Beyond Borders',
    venue: 'GAIMS Convention Centre',
    startDate: '',
    endDate: '',
  },
  registration: {
    registrationOpen: true,
    abstractSubmissionOpen: true,
  },
  socialLinks: {
    instagram: '',
    linkedin: '',
    twitter: '',
    website: '',
  },
  contact: {
    email: '',
    phone: '',
  },
};

const mergeSettings = (settings = {}) => ({
  conference: { ...defaultSettings.conference, ...(settings.conference || {}) },
  registration: { ...defaultSettings.registration, ...(settings.registration || {}) },
  socialLinks: { ...defaultSettings.socialLinks, ...(settings.socialLinks || {}) },
  contact: { ...defaultSettings.contact, ...(settings.contact || {}) },
});

const parseValue = (value) => {
  if (!value) return defaultSettings;
  if (typeof value === 'object') return mergeSettings(value);

  try {
    return mergeSettings(JSON.parse(value));
  } catch {
    return defaultSettings;
  }
};

const get = async () => {
  const [rows] = await pool.query('SELECT setting_value, updated_at FROM app_settings WHERE setting_key = ? LIMIT 1', [SETTINGS_KEY]);
  return {
    settings: parseValue(rows[0]?.setting_value),
    updatedAt: rows[0]?.updated_at || null,
  };
};

const update = async (settings) => {
  const nextSettings = mergeSettings(settings);
  await pool.query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [SETTINGS_KEY, JSON.stringify(nextSettings)]
  );
  return get();
};

module.exports = { defaultSettings, get, update };
