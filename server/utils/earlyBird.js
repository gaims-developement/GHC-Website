const { pool } = require('../config/db');

// Used until a Super Admin sets a deadline in the CMS (Early Bird tab).
const DEFAULT_EARLY_BIRD_DEADLINE = '2026-10-20T23:59:59+05:30';

const readCmsControls = async () => {
  const [[row]] = await pool.query('SELECT setting_value FROM app_settings WHERE setting_key = ? LIMIT 1', ['cms_controls']);
  if (!row?.setting_value) return {};
  if (typeof row.setting_value === 'object') return row.setting_value;
  try {
    return JSON.parse(row.setting_value) || {};
  } catch {
    return {};
  }
};

const toEarlyBird = (controls) => {
  const deadline = controls.earlyBirdDeadline && !Number.isNaN(Date.parse(controls.earlyBirdDeadline))
    ? controls.earlyBirdDeadline
    : DEFAULT_EARLY_BIRD_DEADLINE;
  return { deadline, manualOff: Boolean(controls.earlyBirdManualOff) };
};

const getEarlyBird = async () => toEarlyBird(await readCmsControls());

// Early bird settings live inside the shared cms_controls record, so merge rather than overwrite it.
const saveEarlyBird = async ({ deadline, manualOff }) => {
  const controls = await readCmsControls();
  if (deadline !== undefined) controls.earlyBirdDeadline = deadline;
  if (manualOff !== undefined) controls.earlyBirdManualOff = Boolean(manualOff);
  await pool.query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES ('cms_controls', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [JSON.stringify(controls)]
  );
  return toEarlyBird(controls);
};

module.exports = { DEFAULT_EARLY_BIRD_DEADLINE, getEarlyBird, saveEarlyBird, toEarlyBird };
