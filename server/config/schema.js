const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const roles = ['SUPER_ADMIN', 'ADMIN', 'MEDIA', 'RESEARCH', 'VOLUNTEER', 'CHECKIN', 'OPERATIONS'];

const permissions = [
  ['dashboard.view', 'View CMS dashboard'],
  ['users.manage', 'Manage admin users'],
  ['speakers.manage', 'Manage speakers'],
  ['workshops.manage', 'Manage workshops'],
  ['research.manage', 'Manage research submissions'],
  ['partners.manage', 'Manage partners and sponsors'],
  ['media.manage', 'Manage media assets'],
  ['settings.manage', 'Manage CMS settings'],
  ['analytics.view', 'View analytics dashboards'],
  ['checkin.scan', 'Scan QR codes and mark attendance'],
  ['attendance.manage', 'Manage attendance logs'],
  ['certificates.manage', 'Generate and issue certificates'],
  ['operations.view', 'View operations command center'],
];

const rolePermissionMap = {
  SUPER_ADMIN: permissions.map(([key]) => key),
  ADMIN: ['dashboard.view', 'speakers.manage', 'workshops.manage', 'research.manage', 'partners.manage', 'media.manage'],
  MEDIA: ['dashboard.view', 'media.manage'],
  RESEARCH: ['dashboard.view', 'research.manage'],
  VOLUNTEER: ['dashboard.view', 'checkin.scan', 'attendance.manage', 'operations.view'],
  CHECKIN: ['dashboard.view', 'checkin.scan', 'attendance.manage'],
  OPERATIONS: ['dashboard.view', 'analytics.view', 'checkin.scan', 'attendance.manage', 'operations.view', 'certificates.manage'],
};

const columnExists = async (tableName, columnName) => {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  return rows.length > 0;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  if (!(await columnExists(tableName, columnName))) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const createAuthTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`key\` VARCHAR(100) NOT NULL UNIQUE,
      description VARCHAR(255) NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing('users', 'role_id', 'INT NULL');
  await addColumnIfMissing('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
};

const createSpeakerTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS speakers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      designation VARCHAR(255),
      institution VARCHAR(255),
      bio TEXT,
      topic VARCHAR(255),
      photo_url TEXT,
      linkedin_url TEXT,
      instagram_url TEXT,
      featured BOOLEAN DEFAULT FALSE,
      keynote BOOLEAN DEFAULT FALSE,
      display_order INT DEFAULT 0,
      status ENUM('draft', 'published') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const createWorkshopTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workshops (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255),
      faculty VARCHAR(255),
      description TEXT,
      workshop_type VARCHAR(100),
      requirements TEXT,
      learning_outcomes TEXT,
      who_should_attend TEXT,
      faq JSON,
      prerequisites TEXT,
      capacity INT DEFAULT 0,
      registered_count INT DEFAULT 0,
      duration VARCHAR(100),
      venue VARCHAR(255),
      date DATETIME,
      price DECIMAL(10,2) DEFAULT 0,
      image_url TEXT,
      featured BOOLEAN DEFAULT FALSE,
      status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('workshops', 'slug', 'VARCHAR(255)');
  await addColumnIfMissing('workshops', 'requirements', 'TEXT');
  await addColumnIfMissing('workshops', 'learning_outcomes', 'TEXT');
  await addColumnIfMissing('workshops', 'who_should_attend', 'TEXT');
  await addColumnIfMissing('workshops', 'faq', 'JSON');
  await addColumnIfMissing('workshops', 'prerequisites', 'TEXT');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS workshop_registrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      workshop_id INT,
      registration_id INT,
      payment_id INT,
      status ENUM('pending', 'confirmed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const createResearchTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS abstracts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      authors TEXT,
      presenting_author VARCHAR(255),
      institution VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      category ENUM('poster', 'oral'),
      track VARCHAR(255),
      keywords TEXT,
      abstract_text LONGTEXT,
      pdf_url TEXT,
      status ENUM('draft', 'submitted', 'under_review', 'accepted', 'rejected') DEFAULT 'draft',
      review_score DECIMAL(5,2),
      review_notes TEXT,
      reviewer_id INT,
      award_nomination BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const createRegistrationTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ticket_types (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255),
      description TEXT,
      price DECIMAL(10,2),
      currency VARCHAR(10),
      capacity INT,
      remaining INT,
      featured BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      registration_id VARCHAR(100),
      full_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      institution VARCHAR(255),
      country VARCHAR(100),
      city VARCHAR(100),
      designation VARCHAR(100),
      ticket_type_id INT,
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
      registration_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      qr_code TEXT,
      attendance BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const createPaymentTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      registration_id INT,
      ticket_type_id INT,
      payment_provider VARCHAR(100),
      provider_order_id VARCHAR(255),
      provider_payment_id VARCHAR(255),
      amount DECIMAL(10,2),
      currency VARCHAR(10),
      status ENUM('created', 'pending', 'paid', 'failed', 'refunded') DEFAULT 'created',
      receipt_url TEXT,
      invoice_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(100),
      discount_type ENUM('flat', 'percent'),
      discount_value DECIMAL(10,2),
      max_uses INT,
      used_count INT DEFAULT 0,
      active BOOLEAN DEFAULT TRUE
    )
  `);
};

const createOperationsTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_type VARCHAR(100),
      user_id INT,
      registration_id INT,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      registration_id INT,
      checkin_time DATETIME,
      checkout_time DATETIME,
      workshop_id INT,
      verified_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      registration_id INT,
      certificate_type VARCHAR(100),
      pdf_url TEXT,
      issued BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255),
      message TEXT,
      user_id INT,
      read_status BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      action VARCHAR(255),
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const seedCoupons = async () => {
  const coupons = [
    ['GAIMS10', 'percent', 10, 500],
    ['EARLYBIRD', 'flat', 750, 250],
    ['STUDENT50', 'percent', 50, 200],
  ];

  for (const coupon of coupons) {
    const [[existing]] = await pool.query('SELECT id FROM coupons WHERE code = ? LIMIT 1', [coupon[0]]);
    if (!existing) {
      await pool.query(
        'INSERT INTO coupons (code, discount_type, discount_value, max_uses, active) VALUES (?, ?, ?, ?, TRUE)',
        coupon
      );
    }
  }
};

const seedAuthData = async () => {
  for (const role of roles) {
    await pool.query('INSERT IGNORE INTO roles (name) VALUES (?)', [role]);
  }

  for (const [key, description] of permissions) {
    await pool.query('INSERT IGNORE INTO permissions (`key`, description) VALUES (?, ?)', [key, description]);
  }

  const [roleRows] = await pool.query('SELECT id, name FROM roles');
  const [permissionRows] = await pool.query('SELECT id, `key` FROM permissions');

  const roleByName = Object.fromEntries(roleRows.map((role) => [role.name, role.id]));
  const permissionByKey = Object.fromEntries(permissionRows.map((permission) => [permission.key, permission.id]));

  for (const [roleName, permissionKeys] of Object.entries(rolePermissionMap)) {
    for (const permissionKey of permissionKeys) {
      await pool.query(
        'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        [roleByName[roleName], permissionByKey[permissionKey]]
      );
    }
  }

  const superAdminRoleId = roleByName.SUPER_ADMIN;
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@ghc.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role_id)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), updated_at = CURRENT_TIMESTAMP`,
    ['GHC Super Admin', adminEmail, passwordHash, superAdminRoleId]
  );
};

const seedSpeakers = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM speakers');
  if (rows[0].count > 0) return;

  const speakers = [
    ['Dr A Sharma', 'Director of Digital Health', 'AIIMS Delhi', 'Digital health leader focused on responsible clinical AI and connected care.', 'Digital Health', null, 'https://linkedin.com', null, true, true, 1, 'published'],
    ['Dr Meera Rao', 'Professor of Public Health', 'GAIMS', 'Population health researcher working across prevention and equitable access.', 'Public Health Systems', null, 'https://linkedin.com', null, false, false, 2, 'published'],
    ['Prof Kabir Shah', 'Chair, Clinical Intelligence', 'MedTech AI Lab', 'Clinical AI faculty working on safety, governance and workflow design.', 'AI in Healthcare', null, 'https://linkedin.com', null, true, false, 3, 'published'],
    ['Dr Leena Menon', 'Consultant, Emergency Medicine', 'Global Care Network', 'Emergency medicine specialist and simulation faculty.', 'Emergency Medicine Readiness', null, 'https://linkedin.com', null, false, false, 4, 'draft'],
  ];

  await pool.query(
    `INSERT INTO speakers
      (name, designation, institution, bio, topic, photo_url, linkedin_url, instagram_url, featured, keynote, display_order, status)
     VALUES ?`,
    [speakers]
  );
};

const seedWorkshops = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM workshops');
  if (rows[0].count > 0) return;

  const workshops = [
    ['Airway Management', 'Dept. of Anaesthesiology', 'Hands-on simulation for difficult airway planning, airway devices and emergency airway response.', 'Clinical Skills', 40, 31, '3 hrs', 'Simulation Lab A', '2026-09-18 09:00:00', 2500, null, true, 'published', 1],
    ['CPR & COLS', 'Emergency Response Faculty', 'High-fidelity resuscitation drills aligned to current cardiac life support workflows.', 'Emergency Care', 60, 46, '2.5 hrs', 'Skills Hall 1', '2026-09-18 13:00:00', 1800, null, true, 'published', 2],
    ['AI in Healthcare', 'Digital Health Lab', 'Applied clinical AI workshop covering use cases, governance, validation and workflow adoption.', 'Digital Health', 50, 39, '2 hrs', 'Innovation Studio', '2026-09-19 10:30:00', 2200, null, true, 'published', 3],
    ['Research Methodology', 'Clinical Research Cell', 'Protocol design, ethics, abstract development and publication pathway mentoring.', 'Research', 45, 38, '3 hrs', 'Research Hub', '2026-09-19 14:00:00', 1600, null, false, 'published', 4],
    ['Emergency Medicine', 'Global Care Network', 'Scenario-based triage, trauma response and emergency team coordination.', 'Emergency Care', 50, 50, '3 hrs', 'Simulation Lab B', '2026-09-20 09:30:00', 2400, null, false, 'closed', 5],
    ['Suturing Skills', 'Surgical Skills Faculty', 'Foundational and advanced suturing practice using supervised procedural stations.', 'Clinical Skills', 36, 18, '2 hrs', 'Procedure Lab', '2026-09-20 12:30:00', 1500, null, false, 'draft', 6],
  ];

  await pool.query(
    `INSERT INTO workshops
      (title, faculty, description, workshop_type, capacity, registered_count, duration, venue, date, price, image_url, featured, status, display_order)
     VALUES ?`,
    [workshops]
  );
};

const seedResearch = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM abstracts');
  if (rows[0].count > 0) return;

  const abstracts = [
    ['AI in Healthcare', 'Dr A Sharma; Prof Kabir Shah', 'Dr A Sharma', 'AIIMS Delhi', 'ai.health@example.com', '+91 90000 00001', 'oral', 'Digital Health & AI', 'AI, clinical safety, workflow', 'A study on responsible AI adoption in tertiary care workflows with emphasis on validation, governance and measurable clinical outcomes.', null, 'accepted', 91.5, 'Strong translational value and clear implementation pathway.', 1, true],
    ['Maternal Health', 'Dr Meera Rao; Dr Leena Menon', 'Dr Meera Rao', 'GAIMS', 'maternal@example.com', '+91 90000 00002', 'poster', "Women's Health", 'maternal health, equity, access', 'A community-linked maternal health intervention designed to improve continuity of care and high-risk pregnancy identification.', null, 'accepted', 87.0, 'Relevant public health model with strong poster potential.', 1, false],
    ['Digital Public Health', 'Public Health Action Group', 'Anaya Patel', 'Public Health Action', 'digitalph@example.com', '+91 90000 00003', 'oral', 'Public Health', 'surveillance, digital health, population health', 'Digital public health dashboards were evaluated for early risk detection and district-level program coordination.', null, 'under_review', 78.0, 'Needs deeper methods detail before final decision.', 1, false],
    ['Climate Health', 'Planetary Health Alliance', 'Dr Omar Khalid', 'Planetary Health Council', 'climate@example.com', '+91 90000 00004', 'poster', 'Climate Health', 'heat, hospitals, resilience', 'Assessment of hospital heat-readiness and climate-linked emergency preparedness across urban care settings.', null, 'submitted', null, null, null, false],
    ['HPV Awareness', 'Women Care Collaborative', 'Mira Sen', "Women's Care Collaborative", 'hpv@example.com', '+91 90000 00005', 'poster', "Women's Health", 'HPV, awareness, prevention', 'A student-led awareness model to improve HPV vaccine literacy among adolescents and parents.', null, 'rejected', 62.0, 'Important topic, but study design needs significant strengthening.', 1, false],
  ];

  await pool.query(
    `INSERT INTO abstracts
      (title, authors, presenting_author, institution, email, phone, category, track, keywords, abstract_text, pdf_url, status, review_score, review_notes, reviewer_id, award_nomination)
     VALUES ?`,
    [abstracts]
  );
};

const seedTickets = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM ticket_types');
  if (rows[0].count > 0) return;

  const tickets = [
    ['Student Delegate', 'Access for undergraduate and postgraduate students with conference sessions.', 2500, 'INR', 700, 700, true, true],
    ['Professional Delegate', 'Full delegate access for clinicians, faculty and healthcare professionals.', 6000, 'INR', 800, 800, true, true],
    ['Workshop Pass', 'Focused access to selected hands-on workshops and skills sessions.', 3500, 'INR', 300, 300, false, true],
    ['VIP Delegate', 'Premium delegate access with priority seating and hosted networking.', 15000, 'INR', 100, 100, true, true],
    ['Research Pass', 'Research hub access for abstract, poster and oral presentation delegates.', 3000, 'INR', 350, 350, false, true],
  ];

  await pool.query(
    `INSERT INTO ticket_types
      (name, description, price, currency, capacity, remaining, featured, active)
     VALUES ?`,
    [tickets]
  );
};

const initializeDatabase = async () => {
  try {
    await createAuthTables();
    await createSpeakerTables();
    await createWorkshopTables();
    await createResearchTables();
    await createRegistrationTables();
    await createPaymentTables();
    await createOperationsTables();
    await seedAuthData();
    await seedSpeakers();
    await seedWorkshops();
    await seedResearch();
    await seedTickets();
    await seedCoupons();
    console.log('Auth, speaker, workshop, research, registration and payment schema ready; default data seeded');
  } catch (error) {
    console.warn(`Auth schema setup skipped: ${error.message}`);
  }
};

module.exports = {
  initializeDatabase,
  createAuthTables,
  createSpeakerTables,
  createWorkshopTables,
  createResearchTables,
  createRegistrationTables,
  createPaymentTables,
  createOperationsTables,
  seedAuthData,
  seedCoupons,
  seedSpeakers,
  seedWorkshops,
  seedResearch,
  seedTickets,
};
