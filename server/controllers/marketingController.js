const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const tables = {
  announcements: {
    table: 'announcements',
    permission: 'manage_announcements',
    title: 'title',
    search: ['title', 'content'],
    fields: ['title', 'slug', 'content', 'featured_image', 'status', 'publish_date', 'is_pinned', 'is_featured', 'seo_title', 'seo_description', 'seo_keywords', 'og_image', 'canonical_url', 'schema_markup'],
  },
  news: {
    table: 'news_articles',
    permission: 'manage_news',
    title: 'title',
    search: ['title', 'excerpt', 'content', 'category'],
    fields: ['title', 'slug', 'excerpt', 'content', 'cover_image', 'category', 'status', 'publish_date', 'is_featured', 'seo_title', 'seo_description', 'seo_keywords', 'og_image', 'canonical_url', 'schema_markup'],
  },
  banners: {
    table: 'hero_banners',
    permission: 'manage_homepage',
    title: 'title',
    search: ['title', 'subtitle'],
    fields: ['title', 'subtitle', 'button_text', 'button_link', 'background_image', 'display_order', 'is_active', 'start_date', 'end_date'],
  },
  homepage: {
    table: 'homepage_sections',
    permission: 'manage_homepage',
    title: 'section_name',
    search: ['section_name', 'title', 'subtitle', 'content'],
    fields: ['section_name', 'title', 'subtitle', 'content', 'config', 'is_visible', 'display_order', 'seo_title', 'seo_description', 'seo_keywords', 'og_image', 'canonical_url', 'schema_markup'],
  },
  albums: {
    table: 'gallery_albums',
    permission: 'manage_gallery',
    title: 'title',
    search: ['title', 'description'],
    fields: ['title', 'description', 'cover_image', 'event_date', 'is_featured', 'display_order'],
  },
  gallery: {
    table: 'gallery_media',
    permission: 'manage_gallery',
    title: 'caption',
    search: ['caption', 'media_url'],
    fields: ['album_id', 'media_type', 'media_url', 'caption', 'display_order'],
  },
  campaigns: {
    table: 'social_campaigns',
    permission: 'manage_campaigns',
    title: 'campaign_name',
    search: ['campaign_name', 'description'],
    fields: ['campaign_name', 'description', 'start_date', 'end_date', 'status'],
  },
  posts: {
    table: 'social_posts',
    permission: 'manage_campaigns',
    title: 'caption',
    search: ['caption', 'platform'],
    fields: ['campaign_id', 'platform', 'caption', 'media_url', 'scheduled_date', 'status'],
  },
  partners: {
    table: 'media_partners',
    permission: 'manage_media_partners',
    title: 'organization_name',
    search: ['organization_name', 'tier', 'description'],
    fields: ['organization_name', 'logo_url', 'website', 'tier', 'description', 'display_order', 'is_active'],
  },
  notifications: {
    table: 'website_notifications',
    permission: 'manage_notifications',
    title: 'title',
    search: ['title', 'message'],
    fields: ['title', 'message', 'notification_type', 'start_date', 'end_date', 'is_active'],
  },
  seo: {
    table: 'seo_pages',
    permission: 'manage_seo',
    title: 'page_key',
    search: ['page_key', 'seo_title', 'seo_description'],
    fields: ['page_key', 'seo_title', 'seo_description', 'seo_keywords', 'og_image', 'canonical_url', 'schema_markup'],
  },
  emailTemplates: {
    table: 'email_marketing_templates',
    permission: 'manage_campaigns',
    title: 'name',
    search: ['name', 'subject', 'category'],
    fields: ['name', 'subject', 'body', 'category', 'status'],
  },
};

const allowedStatuses = new Set(['draft', 'review', 'approved', 'published', 'archived', 'active', 'completed', 'scheduled']);
const boolFields = new Set(['is_pinned', 'is_featured', 'is_active', 'is_visible']);
const jsonFields = new Set(['schema_markup', 'config']);

const slugify = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;

const canPublish = (req) => req.user?.role === 'SUPER_ADMIN' || (req.user?.permissions || []).includes('publish_content');
const hasPermission = (req, permission) => req.user?.role === 'SUPER_ADMIN' || (req.user?.permissions || []).includes(permission);
const log = (req, action, module, recordId, metadata) =>
  ActivityLog.logActivity({ userId: req.user?.id, action, module, recordId: String(recordId || ''), metadata });

const normalizeBody = (config, body) => {
  const data = {};
  config.fields.forEach((field) => {
    if (body[field] === undefined) return;
    if (boolFields.has(field)) data[field] = body[field] === true || body[field] === 'true' || body[field] === '1' || body[field] === 1;
    else if (jsonFields.has(field)) data[field] = typeof body[field] === 'string' ? body[field] : JSON.stringify(body[field] || {});
    else data[field] = body[field] === '' ? null : body[field];
  });
  if (config.fields.includes('slug') && !data.slug) data.slug = slugify(data.title || body.title);
  return data;
};

const uploadAsset = async (file) => {
  if (!file) return null;
  if (!(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET)) {
    return `/uploads/marketing/${file.filename}`;
  }
  const result = await uploadToCloudinary(file.path, 'gallery', { resourceType: 'auto' });
  return result.secure_url;
};

const dashboard = asyncHandler(async (_req, res) => {
  const [[campaigns], [articles], [pending], [scheduled], [partners], [announcements], [uploads]] = await Promise.all([
    pool.query("SELECT COUNT(*) AS total FROM social_campaigns WHERE status = 'active'"),
    pool.query("SELECT COUNT(*) AS total FROM news_articles WHERE status = 'published'"),
    pool.query("SELECT COUNT(*) AS total FROM announcements WHERE status IN ('draft', 'review', 'approved') UNION ALL SELECT COUNT(*) FROM news_articles WHERE status IN ('draft', 'review', 'approved')"),
    pool.query("SELECT COUNT(*) AS total FROM social_posts WHERE status = 'scheduled'"),
    pool.query('SELECT COUNT(*) AS total FROM media_partners WHERE is_active = TRUE'),
    pool.query("SELECT id, title, status, publish_date FROM announcements ORDER BY publish_date DESC, updated_at DESC LIMIT 6"),
    pool.query('SELECT id, original_name, url, resource_type, created_at FROM media_assets ORDER BY created_at DESC LIMIT 6'),
  ]);

  res.json({
    metrics: {
      activeCampaigns: Number(campaigns[0]?.total || 0),
      publishedArticles: Number(articles[0]?.total || 0),
      pendingContent: pending.reduce((sum, row) => sum + Number(row.total || 0), 0),
      scheduledPosts: Number(scheduled[0]?.total || 0),
      mediaPartners: Number(partners[0]?.total || 0),
      websiteTraffic: { visitors: 0, pageViews: 0, growth: 0 },
    },
    latestAnnouncements: announcements,
    recentUploads: uploads,
  });
});

const listContent = asyncHandler(async (req, res) => {
  const config = tables[req.params.type];
  if (!config) return res.status(404).json({ message: 'Unknown marketing content type' });
  if (!hasPermission(req, config.permission)) return res.status(403).json({ message: 'Insufficient permissions' });

  const params = [];
  let where = '';
  if (req.query.search) {
    where = `WHERE ${config.search.map((field) => `${field} LIKE ?`).join(' OR ')}`;
    config.search.forEach(() => params.push(`%${req.query.search}%`));
  }

  const [items] = await pool.query(`SELECT * FROM ${config.table} ${where} ORDER BY ${config.table === 'hero_banners' || config.table === 'homepage_sections' || config.table === 'media_partners' ? 'display_order ASC,' : ''} id DESC`, params);
  res.json({ items });
});

const saveContent = asyncHandler(async (req, res) => {
  const config = tables[req.params.type];
  if (!config) return res.status(404).json({ message: 'Unknown marketing content type' });
  if (!hasPermission(req, config.permission)) return res.status(403).json({ message: 'Insufficient permissions' });

  const data = normalizeBody(config, req.body || {});
  const fileUrl = await uploadAsset(req.file);
  if (fileUrl) {
    if (config.fields.includes('featured_image')) data.featured_image = fileUrl;
    else if (config.fields.includes('cover_image')) data.cover_image = fileUrl;
    else if (config.fields.includes('background_image')) data.background_image = fileUrl;
    else if (config.fields.includes('cover_image')) data.cover_image = fileUrl;
    else if (config.fields.includes('media_url')) data.media_url = fileUrl;
    else if (config.fields.includes('logo_url')) data.logo_url = fileUrl;
    else if (config.fields.includes('og_image')) data.og_image = fileUrl;
  }

  if (data.status === 'published' && !canPublish(req)) data.status = 'review';
  if (data.status && !allowedStatuses.has(data.status)) return res.status(400).json({ message: 'Invalid status' });
  if (!req.params.id && config.fields.includes('author_id')) data.author_id = req.user?.id || null;

  const fields = Object.keys(data);
  if (!fields.length) return res.status(400).json({ message: 'No fields to save' });

  if (req.params.id) {
    const [[existing]] = await pool.query(`SELECT status FROM ${config.table} WHERE id = ? LIMIT 1`, [req.params.id]);
    await pool.query(`UPDATE ${config.table} SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`, [...fields.map((field) => data[field]), req.params.id]);
    if (data.status && existing?.status !== data.status) {
      await pool.query('INSERT INTO content_approval_history (content_type, content_id, from_status, to_status, user_id) VALUES (?, ?, ?, ?, ?)', [req.params.type, req.params.id, existing?.status, data.status, req.user?.id || null]);
    }
    await log(req, data.status === 'published' ? 'published_content' : 'updated_content', req.params.type, req.params.id, { status: data.status });
  } else {
    const [result] = await pool.query(`INSERT INTO ${config.table} (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, fields.map((field) => data[field]));
    if (data.status) {
      await pool.query('INSERT INTO content_approval_history (content_type, content_id, from_status, to_status, user_id) VALUES (?, ?, ?, ?, ?)', [req.params.type, result.insertId, null, data.status, req.user?.id || null]);
    }
    await log(req, 'created_content', req.params.type, result.insertId, { status: data.status });
  }

  const [items] = await pool.query(`SELECT * FROM ${config.table} ORDER BY id DESC`);
  res.json({ items });
});

const deleteContent = asyncHandler(async (req, res) => {
  const config = tables[req.params.type];
  if (!config) return res.status(404).json({ message: 'Unknown marketing content type' });
  if (!hasPermission(req, config.permission)) return res.status(403).json({ message: 'Insufficient permissions' });
  await pool.query(`DELETE FROM ${config.table} WHERE id = ?`, [req.params.id]);
  await log(req, 'deleted_content', req.params.type, req.params.id);
  res.json({ success: true });
});

const approvalHistory = asyncHandler(async (req, res) => {
  const [history] = await pool.query(
    `SELECT content_approval_history.*, users.name AS user_name
     FROM content_approval_history
     LEFT JOIN users ON users.id = content_approval_history.user_id
     WHERE content_type = ? AND content_id = ?
     ORDER BY created_at DESC`,
    [req.params.type, req.params.id]
  );
  res.json({ history });
});

const analytics = asyncHandler(async (_req, res) => {
  const [[announcements], [campaigns], [articles], [gallery], [homepageClicks]] = await Promise.all([
    pool.query("SELECT DATE_FORMAT(publish_date, '%Y-%m') AS month, COUNT(*) AS total FROM announcements WHERE status = 'published' GROUP BY month ORDER BY month"),
    pool.query('SELECT status, COUNT(*) AS total FROM social_campaigns GROUP BY status'),
    pool.query('SELECT category, COUNT(*) AS total FROM news_articles GROUP BY category ORDER BY total DESC'),
    pool.query('SELECT gallery_albums.title, COUNT(gallery_media.id) AS mediaCount FROM gallery_albums LEFT JOIN gallery_media ON gallery_media.album_id = gallery_albums.id GROUP BY gallery_albums.id ORDER BY mediaCount DESC'),
    pool.query("SELECT event_type, COUNT(*) AS total FROM analytics_events WHERE event_type LIKE 'homepage_%' GROUP BY event_type"),
  ]);
  res.json({ announcements, campaigns, articles, gallery, homepageClicks });
});

const publicSync = asyncHandler(async (_req, res) => {
  const [[homepage], [banners], [announcements], [news], [albums], [partners], [notifications], [seo]] = await Promise.all([
    pool.query('SELECT * FROM homepage_sections WHERE is_visible = TRUE ORDER BY display_order ASC'),
    pool.query('SELECT * FROM hero_banners WHERE is_active = TRUE ORDER BY display_order ASC'),
    pool.query("SELECT * FROM announcements WHERE status = 'published' AND (publish_date IS NULL OR publish_date <= NOW()) ORDER BY is_pinned DESC, publish_date DESC"),
    pool.query("SELECT * FROM news_articles WHERE status = 'published' AND (publish_date IS NULL OR publish_date <= NOW()) ORDER BY publish_date DESC"),
    pool.query('SELECT * FROM gallery_albums ORDER BY is_featured DESC, display_order ASC'),
    pool.query('SELECT * FROM media_partners WHERE is_active = TRUE ORDER BY display_order ASC'),
    pool.query('SELECT * FROM website_notifications WHERE is_active = TRUE AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()) ORDER BY id DESC'),
    pool.query('SELECT * FROM seo_pages'),
  ]);
  res.json({ homepage, banners, announcements, news, albums, mediaPartners: partners, notifications, seo });
});

module.exports = {
  analytics,
  approvalHistory,
  dashboard,
  deleteContent,
  listContent,
  publicSync,
  saveContent,
};
