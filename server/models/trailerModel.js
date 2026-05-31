const { pool } = require('../config/db');

const TRAILER_KEY = 'homepage_trailer';

const defaultTrailer = {
  id: TRAILER_KEY,
  title: 'Watch the Vision',
  description: 'Discover the vision behind Global Health Conclave and our mission to advance healthcare beyond boundaries.',
  videoUrl: '',
  cloudinaryPublicId: '',
  thumbnailUrl: '',
  updatedAt: null,
};

const normalize = (value = {}, updatedAt = null) => ({
  ...defaultTrailer,
  ...value,
  id: TRAILER_KEY,
  videoUrl: value.videoUrl || value.video_url || '',
  cloudinaryPublicId: value.cloudinaryPublicId || value.cloudinary_public_id || '',
  thumbnailUrl: value.thumbnailUrl || value.thumbnail_url || '',
  updatedAt: updatedAt || value.updatedAt || value.updated_at || null,
});

const parseValue = (value) => {
  if (!value) return defaultTrailer;
  if (typeof value === 'object') return normalize(value);

  try {
    return normalize(JSON.parse(value));
  } catch {
    return defaultTrailer;
  }
};

const get = async () => {
  const [rows] = await pool.query('SELECT setting_value, updated_at FROM app_settings WHERE setting_key = ? LIMIT 1', [TRAILER_KEY]);
  return {
    trailer: normalize(parseValue(rows[0]?.setting_value), rows[0]?.updated_at || null),
  };
};

const save = async (data) => {
  const nextTrailer = normalize(data);
  await pool.query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [TRAILER_KEY, JSON.stringify(nextTrailer)]
  );
  return get();
};

const update = async (data) => {
  const current = await get();
  return save({ ...current.trailer, ...data });
};

module.exports = { defaultTrailer, get, save, update };
