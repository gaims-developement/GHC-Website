require('dotenv').config();

const bcrypt = require('bcryptjs');
const { closePool, pool } = require('../config/db');

const dataTables = [
  'audit_logs',
  'notifications',
  'certificates',
  'attendance_logs',
  'analytics_events',
  'workshop_registrations',
  'payments',
  'registrations',
  'abstracts',
  'coupons',
  'ticket_types',
  'workshops',
  'speakers',
  'users',
];

const systemTables = ['roles', 'permissions', 'role_permissions'];

const requireAdminCredentials = () => {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set');
  }

  return { adminEmail, adminPassword };
};

const tableExists = async (tableName) => {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  return Number(row.count) > 0;
};

const clearTable = async (tableName) => {
  if (!(await tableExists(tableName))) {
    console.log(`Skipping missing table: ${tableName}`);
    return;
  }

  const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``);
  await pool.query(`DELETE FROM \`${tableName}\``);
  console.log(`Cleared ${count} row(s) from ${tableName}`);
};

const seedAdminUser = async ({ adminEmail, adminPassword }) => {
  const [[role]] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', ['SUPER_ADMIN']);

  if (!role) {
    throw new Error('SUPER_ADMIN role is missing. Run the normal schema initializer before resetting data.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role_id)
     VALUES (?, ?, ?, ?)`,
    ['GHC Super Admin', adminEmail, passwordHash, role.id]
  );

  console.log(`Seeded admin user: ${adminEmail}`);
};

const resetDatabase = async () => {
  const adminCredentials = requireAdminCredentials();

  console.log('Starting database reset');
  console.log(`Preserving system/config tables: ${systemTables.join(', ')}`);

  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const tableName of dataTables) {
      await clearTable(tableName);
    }
  } finally {
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  await seedAdminUser(adminCredentials);
  console.log('Database reset complete');
};

resetDatabase()
  .catch((error) => {
    console.error(`Database reset failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
