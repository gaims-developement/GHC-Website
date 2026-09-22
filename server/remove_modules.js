require('dotenv').config();
const { pool } = require('./config/db');

const toRemove = [
  "tracks", "manage events", "event registration", "event payments", "event feedback", "event certificates", "venues", "presentations", "posters", "awards", "scientific reports", "certificates", "certificate template", "generate certificate", "bulk certificate", "digital signatures", "accredaitaion", "certificate reports", "operations", "accommodation", "transport", "vendors", "inventory", "interviews", "recruitments", "shift", "volunteer attendance", "volunteer departnemnt", "volunteer report", "volunteer tasks", "security", "emergency", "logistic reports", "system users", "roles and permission", "active session", "feature flag", "exhibitors", "stalls", "contracts", "invoices", "deliverables", "media", "marketing", "announcements", "news", "homepage cms", "hero banner", "gallery", "campaign", "media partner", "notifications", "media library", "mobile app", "cms control", "app notification", "mobile analytics", "mobile settings", "platform core", "universal files", "tasks", "approvals", "global search", "core settings", "team", "team monitoring"
];

async function run() {
  try {
    for (const name of toRemove) {
      await pool.query('DELETE FROM modules WHERE LOWER(label) = ?', [name.toLowerCase()]);
    }
    console.log('Successfully deleted all requested modules from DB.');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
