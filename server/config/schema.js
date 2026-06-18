const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const roles = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN', 'TEAM_ADMIN', 'FORM_MANAGER', 'EDITOR', 'VIEWER', 'MEDIA', 'RESEARCH', 'VOLUNTEER', 'CHECKIN', 'OPERATIONS'];

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
  ['teams.manage', 'Manage CMS teams'],
  ['activity.view', 'View activity logs'],
  ['impersonation.manage', 'Impersonate team admins'],
  ['cms.manage', 'Manage global CMS controls'],
  ['manage_system', 'Manage system monitoring and administration'],
  ['manage_users', 'Manage system users'],
  ['manage_roles', 'Manage system roles'],
  ['manage_permissions', 'Manage system permissions'],
  ['manage_backups', 'Manage backups'],
  ['manage_settings', 'Manage system settings'],
  ['view_audit_logs', 'View audit logs'],
  ['view_system_reports', 'View system reports'],
  ['manage_forms', 'Manage dynamic forms'],
  ['create_forms', 'Create dynamic forms'],
  ['edit_forms', 'Edit dynamic forms'],
  ['publish_forms', 'Publish dynamic forms'],
  ['review_submissions', 'Review form submissions'],
  ['export_submissions', 'Export form submissions'],
  ['manage_form_templates', 'Manage form templates'],
  ['manage_mobile_app', 'Manage mobile app backend'],
  ['manage_mobile_users', 'Manage mobile app users'],
  ['view_mobile_analytics', 'View mobile app analytics'],
  ['manage_core_architecture', 'Manage platform architecture'],
  ['manage_files', 'Manage universal files'],
  ['manage_tasks', 'Manage universal tasks'],
  ['manage_approvals', 'Manage approval workflows'],
  ['view_global_reports', 'View global reports'],
  ['manage_registrations', 'Manage registrations module'],
  ['manage_speakers', 'Manage speakers module'],
  ['edit_speakers', 'Edit speakers'],
  ['delete_speakers', 'Delete speakers'],
  ['manage_sessions', 'Manage speaker sessions'],
  ['manage_tracks', 'Manage agenda tracks'],
  ['manage_halls', 'Manage halls'],
  ['manage_venues', 'Manage logistics venues'],
  ['manage_accommodation', 'Manage accommodation logistics'],
  ['manage_transport', 'Manage transport logistics'],
  ['manage_vendors', 'Manage vendors'],
  ['manage_inventory', 'Manage inventory'],
  ['manage_volunteers', 'Manage volunteer deployment'],
  ['manage_recruitment', 'Manage volunteer recruitment'],
  ['manage_interviews', 'Manage volunteer interviews'],
  ['manage_shifts', 'Manage volunteer shifts'],
  ['manage_attendance', 'Manage volunteer attendance'],
  ['manage_tasks', 'Manage task boards'],
  ['view_volunteer_reports', 'View volunteer reports'],
  ['manage_security', 'Manage security operations'],
  ['manage_emergency_contacts', 'Manage emergency contacts'],
  ['manage_cme', 'Manage CME credits'],
  ['upload_resources', 'Upload speaker and session resources'],
  ['publish_schedule', 'Publish agenda schedule'],
  ['manage_workshops', 'Manage workshops module'],
  ['manage_events', 'Manage events module'],
  ['manage_competitions', 'Manage competitions and submissions'],
  ['manage_event_registrations', 'Manage event registrations'],
  ['manage_event_payments', 'Manage event payments'],
  ['manage_feedback', 'Manage event feedback'],
  ['manage_resources', 'Manage event resources'],
  ['publish_events', 'Publish events'],
  ['manage_sponsors', 'Manage sponsors module'],
  ['manage_sponsor_tiers', 'Manage sponsor tiers'],
  ['manage_exhibitors', 'Manage exhibitors'],
  ['manage_stalls', 'Manage exhibitor stalls'],
  ['manage_contracts', 'Manage sponsorship contracts'],
  ['manage_invoices', 'Manage sponsor invoices'],
  ['manage_deliverables', 'Manage sponsor deliverables'],
  ['view_sponsorship_reports', 'View sponsorship reports'],
  ['manage_abstracts', 'Manage scientific abstracts module'],
  ['manage_reviewers', 'Manage scientific reviewers'],
  ['assign_reviewers', 'Assign reviewers to abstracts'],
  ['review_abstracts', 'Review assigned abstracts'],
  ['manage_awards', 'Manage scientific awards'],
  ['manage_judges', 'Manage scientific judges'],
  ['manage_certificates', 'Manage scientific certificates'],
  ['manage_templates', 'Manage certificate templates'],
  ['generate_certificates', 'Generate certificates'],
  ['revoke_certificates', 'Revoke certificates'],
  ['manage_signatures', 'Manage digital signatures'],
  ['manage_accreditation', 'Manage accreditation records'],
  ['verify_certificates', 'Verify certificates'],
  ['view_certificate_reports', 'View certificate reports'],
  ['publish_scientific_program', 'Publish scientific program'],
  ['manage_announcements', 'Manage announcements and CMS notices'],
  ['manage_news', 'Manage news articles'],
  ['manage_homepage', 'Manage homepage content'],
  ['manage_gallery', 'Manage gallery albums and media'],
  ['manage_campaigns', 'Manage social campaigns'],
  ['manage_media_partners', 'Manage media partners'],
  ['manage_notifications', 'Manage website notifications'],
  ['manage_seo', 'Manage SEO metadata'],
  ['publish_content', 'Publish approved content'],
  ['manage_team_members', 'Manage team members'],
  ['edit_registrations', 'Edit registrations'],
  ['view_registrations', 'View registrations'],
  ['manage_payments', 'Manage registration payments'],
  ['manage_checkins', 'Manage registration check-ins'],
  ['manage_badges', 'Manage registration badges'],
  ['manage_coupons', 'Manage registration coupons'],
  ['export_registration_data', 'Export registration data'],
];

const modules = [
  ['dashboard', 'Dashboard', 'dashboard.view', 'dashboard', 'LayoutDashboard', 10, true],
  ['speakers', 'Speakers', 'manage_speakers', 'speakers', 'Mic2', 20, true],
  ['sessions', 'Sessions', 'manage_sessions', 'sessions', 'CalendarDays', 21, true],
  ['schedule', 'Schedule', 'publish_schedule', 'schedule', 'CalendarClock', 22, true],
  ['tracks', 'Tracks', 'manage_tracks', 'tracks', 'Waypoints', 23, true],
  ['halls', 'Halls', 'manage_halls', 'halls', 'MapPinned', 24, true],
  ['cme', 'CME', 'manage_cme', 'cme', 'GraduationCap', 25, true],
  ['resources', 'Resources', 'upload_resources', 'resources', 'FolderUp', 26, true],
  ['workshops', 'Workshops', 'manage_workshops', 'workshops', 'Wrench', 30, true],
  ['events', 'Events', 'manage_events', 'events', 'CalendarDays', 31, true],
  ['event-registrations', 'Event Registrations', 'manage_event_registrations', 'event-registrations', 'ClipboardCheck', 32, true],
  ['event-payments', 'Event Payments', 'manage_event_payments', 'event-payments', 'CreditCard', 33, true],
  ['event-feedback', 'Event Feedback', 'manage_feedback', 'event-feedback', 'MessageSquareText', 34, true],
  ['event-certificates', 'Event Certificates', 'manage_certificates', 'event-certificates', 'FileCheck2', 35, true],
  ['event-resources', 'Event Resources', 'manage_resources', 'event-resources', 'FolderUp', 36, true],
  ['venues', 'Venues', 'manage_venues', 'venues', 'MapPinned', 37, true],
  ['event-reports', 'Event Reports', 'manage_events', 'event-reports', 'ChartColumn', 38, true],
  ['research', 'Research', 'manage_abstracts', 'research', 'FlaskConical', 40, true],
  ['scientific', 'Scientific', 'manage_abstracts', 'scientific', 'Microscope', 41, true],
  ['abstracts', 'Abstracts', 'manage_abstracts', 'abstracts', 'FileText', 42, true],
  ['reviewers', 'Reviewers', 'manage_reviewers', 'reviewers', 'UserCheck', 43, true],
  ['reviews', 'Reviews', 'review_abstracts', 'reviews', 'ClipboardList', 44, true],
  ['presentation-sessions', 'Presentations', 'publish_scientific_program', 'presentation-sessions', 'Presentation', 45, true],
  ['posters', 'Posters', 'manage_abstracts', 'posters', 'PanelsTopLeft', 46, true],
  ['judges', 'Judges', 'manage_judges', 'judges', 'Scale', 47, true],
  ['awards', 'Awards', 'manage_awards', 'awards', 'Trophy', 48, true],
  ['scientific-reports', 'Scientific Reports', 'publish_scientific_program', 'scientific/reports', 'ChartColumn', 49, true],
  ['registrations', 'Registrations', 'view_registrations', 'registrations', 'QrCode', 50, true],
  ['badges', 'Badges', 'manage_badges', 'badges', 'BadgeCheck', 55, true],
  ['coupons', 'Coupons', 'manage_coupons', 'coupons', 'BadgePercent', 56, true],
  ['reports', 'Reports', 'export_registration_data', 'reports', 'FileSpreadsheet', 57, true],
  ['tickets', 'Tickets', 'manage_registrations', 'tickets', 'Ticket', 60, true],
  ['payments', 'Payments', 'manage_payments', 'payments', 'CreditCard', 70, true],
  ['analytics', 'Analytics', 'analytics.view', 'analytics', 'BarChart3', 80, true],
  ['checkin', 'Check-in', 'manage_checkins', 'checkin', 'ClipboardCheck', 90, true],
  ['certificates', 'Certificates', 'certificates.manage', 'certificates', 'FileCheck2', 100, true],
  ['certificate-templates', 'Certificate Templates', 'manage_templates', 'certificates/templates', 'FileText', 101, true],
  ['certificate-generate', 'Generate Certificates', 'generate_certificates', 'certificates/generate', 'BadgeCheck', 102, true],
  ['certificate-bulk', 'Bulk Certificates', 'generate_certificates', 'certificates/bulk', 'FileSpreadsheet', 103, true],
  ['certificate-signatures', 'Digital Signatures', 'manage_signatures', 'certificates/signatures', 'PenLine', 104, true],
  ['certificate-accreditation', 'Accreditation', 'manage_accreditation', 'certificates/accreditation', 'GraduationCap', 105, true],
  ['certificate-reports', 'Certificate Reports', 'view_certificate_reports', 'certificates/reports', 'ChartColumn', 106, true],
  ['operations', 'Operations', 'operations.view', 'operations', 'RadioTower', 110, true],
  ['logistics', 'Logistics', 'manage_venues', 'logistics', 'BriefcaseBusiness', 111, true],
  ['accommodation', 'Accommodation', 'manage_accommodation', 'accommodation', 'Hotel', 112, true],
  ['transport', 'Transport', 'manage_transport', 'transport', 'Bus', 113, true],
  ['vendors', 'Vendors', 'manage_vendors', 'vendors', 'Handshake', 114, true],
  ['inventory', 'Inventory', 'manage_inventory', 'inventory', 'PackageCheck', 115, true],
  ['volunteers', 'Volunteers', 'manage_volunteers', 'volunteers', 'Users', 116, true],
  ['recruitment', 'Recruitment', 'manage_recruitment', 'recruitment', 'UserPlus', 116, true],
  ['interviews', 'Interviews', 'manage_interviews', 'interviews', 'ClipboardList', 116, true],
  ['departments', 'Volunteer Departments', 'manage_volunteers', 'departments', 'Network', 116, true],
  ['shifts', 'Shifts', 'manage_shifts', 'shifts', 'CalendarClock', 116, true],
  ['attendance', 'Volunteer Attendance', 'manage_attendance', 'attendance', 'ClipboardCheck', 116, true],
  ['tasks', 'Volunteer Tasks', 'manage_tasks', 'tasks', 'ListChecks', 116, true],
  ['volunteer-reports', 'Volunteer Reports', 'view_volunteer_reports', 'volunteer-reports', 'ChartColumn', 116, true],
  ['security', 'Security', 'manage_security', 'security', 'ShieldCheck', 117, true],
  ['emergency', 'Emergency', 'manage_emergency_contacts', 'emergency', 'Siren', 118, true],
  ['logistics-reports', 'Logistics Reports', 'manage_venues', 'logistics/reports', 'ChartColumn', 119, true],
  ['system', 'System Admin', 'manage_system', 'system', 'HeartPulse', 120, true],
  ['system-audit-logs', 'Audit Logs', 'view_audit_logs', 'system/audit-logs', 'ClipboardList', 121, true],
  ['system-users', 'System Users', 'manage_users', 'system/users', 'Users', 122, true],
  ['system-roles', 'Roles & Permissions', 'manage_roles', 'system/roles', 'ShieldCheck', 123, true],
  ['system-sessions', 'Active Sessions', 'manage_system', 'system/sessions', 'MonitorCheck', 124, true],
  ['system-api-monitoring', 'API Monitoring', 'view_system_reports', 'system/api-monitoring', 'RadioTower', 125, true],
  ['system-database', 'Database', 'view_system_reports', 'system/database', 'Database', 126, true],
  ['system-cloudinary', 'Cloudinary', 'view_system_reports', 'system/cloudinary', 'Cloud', 127, true],
  ['system-email', 'Email Delivery', 'view_system_reports', 'system/email', 'Mail', 128, true],
  ['system-backups', 'Backups', 'manage_backups', 'system/backups', 'Archive', 129, true],
  ['system-security', 'Security Center', 'manage_security', 'system/security', 'ShieldAlert', 130, true],
  ['system-feature-flags', 'Feature Flags', 'manage_system', 'system/feature-flags', 'ToggleLeft', 131, true],
  ['system-settings', 'System Settings', 'manage_settings', 'system/settings', 'Settings', 132, true],
  ['launch', 'Launch', 'operations.view', 'launch', 'Rocket', 133, true],
  ['partners', 'Public Partners', 'manage_sponsors', 'partners', 'Handshake', 140, true],
  ['sponsors', 'Sponsors', 'manage_sponsors', 'sponsors', 'Handshake', 141, true],
  ['sponsor-tiers', 'Sponsor Tiers', 'manage_sponsor_tiers', 'sponsor-tiers', 'Layers3', 142, true],
  ['exhibitors', 'Exhibitors', 'manage_exhibitors', 'exhibitors', 'Store', 143, true],
  ['stalls', 'Stalls', 'manage_stalls', 'stalls', 'MapPinned', 144, true],
  ['contracts', 'Contracts', 'manage_contracts', 'contracts', 'FileSignature', 145, true],
  ['invoices', 'Invoices', 'manage_invoices', 'invoices', 'ReceiptText', 146, true],
  ['deliverables', 'Deliverables', 'manage_deliverables', 'deliverables', 'ListChecks', 147, true],
  ['sponsorship-reports', 'Sponsorship Reports', 'view_sponsorship_reports', 'sponsorship/reports', 'ChartColumn', 148, true],
  ['media', 'Media', 'media.manage', 'media', 'Image', 150, true],
  ['marketing', 'Marketing', 'manage_announcements', 'marketing', 'Megaphone', 151, true],
  ['announcements', 'Announcements', 'manage_announcements', 'announcements', 'Bell', 152, true],
  ['news', 'News', 'manage_news', 'news', 'Newspaper', 153, true],
  ['homepage', 'Homepage CMS', 'manage_homepage', 'homepage', 'Home', 154, true],
  ['banners', 'Hero Banners', 'manage_homepage', 'banners', 'Images', 155, true],
  ['gallery', 'Gallery', 'manage_gallery', 'gallery', 'Image', 156, true],
  ['campaigns', 'Campaigns', 'manage_campaigns', 'campaigns', 'Share2', 157, true],
  ['media-partners', 'Media Partners', 'manage_media_partners', 'media-partners', 'Handshake', 158, true],
  ['notifications', 'Notifications', 'manage_notifications', 'notifications', 'BellRing', 159, true],
  ['media-library', 'Media Library', 'media.manage', 'media-library', 'FolderUp', 160, true],
  ['seo', 'SEO', 'manage_seo', 'seo', 'SearchCheck', 161, true],
  ['trailer', 'Trailer', 'cms.manage', 'trailer', 'Film', 160, true],
  ['forms', 'Forms', 'manage_forms', 'forms', 'FileText', 165, true],
  ['forms-create', 'Create Form', 'create_forms', 'forms/create', 'FileCheck2', 166, true],
  ['forms-templates', 'Form Templates', 'manage_form_templates', 'forms/templates', 'Layers3', 167, true],
  ['forms-analytics', 'Form Analytics', 'manage_forms', 'forms/analytics', 'ChartColumn', 168, true],
  ['mobile', 'Mobile App', 'manage_mobile_app', 'mobile', 'Smartphone', 169, true],
  ['mobile-users', 'Mobile Users', 'manage_mobile_users', 'mobile/users', 'Users', 170, true],
  ['mobile-notifications', 'App Notifications', 'manage_notifications', 'mobile/notifications', 'BellRing', 171, true],
  ['mobile-analytics', 'Mobile Analytics', 'view_mobile_analytics', 'mobile/analytics', 'ChartColumn', 172, true],
  ['mobile-settings', 'Mobile Settings', 'manage_mobile_app', 'mobile/settings', 'Settings', 173, true],
  ['core', 'Platform Core', 'manage_core_architecture', 'core', 'Network', 174, true],
  ['core-files', 'Universal Files', 'manage_files', 'core/files', 'FolderUp', 175, true],
  ['core-tasks', 'Tasks', 'manage_tasks', 'core/tasks', 'ListChecks', 176, true],
  ['core-approvals', 'Approvals', 'manage_approvals', 'core/approvals', 'ClipboardCheck', 177, true],
  ['core-search', 'Global Search', 'manage_core_architecture', 'core/search', 'SearchCheck', 178, true],
  ['core-settings', 'Core Settings', 'manage_core_architecture', 'core/settings', 'Settings', 179, true],
  ['cms-controls', 'CMS Controls', 'cms.manage', 'cms-controls', 'SlidersHorizontal', 170, true],
  ['teams', 'Teams', 'teams.manage', 'teams', 'Network', 180, true],
  ['team-monitoring', 'Team Monitoring', 'teams.manage', 'team-monitoring', 'MonitorCheck', 190, true],
  ['users', 'Users', 'users.manage', 'users', 'Users', 200, true],
  ['settings', 'Settings', 'settings.manage', 'settings', 'Settings', 210, true],
];

const rolePermissionMap = {
  SUPER_ADMIN: permissions.map(([key]) => key),
  SYSTEM_ADMIN: ['dashboard.view', 'manage_system', 'manage_users', 'manage_roles', 'manage_permissions', 'manage_backups', 'manage_security', 'manage_settings', 'view_audit_logs', 'view_system_reports', 'users.manage', 'settings.manage', 'activity.view', 'impersonation.manage', 'manage_core_architecture', 'manage_files', 'manage_tasks', 'manage_approvals', 'view_global_reports'],
  ADMIN: ['dashboard.view', 'users.manage', 'speakers.manage', 'workshops.manage', 'research.manage', 'partners.manage', 'media.manage', 'settings.manage', 'analytics.view', 'checkin.scan', 'attendance.manage', 'certificates.manage', 'operations.view', 'cms.manage', 'manage_registrations', 'edit_registrations', 'view_registrations', 'manage_payments', 'manage_checkins', 'manage_badges', 'manage_coupons', 'export_registration_data', 'manage_speakers', 'edit_speakers', 'delete_speakers', 'manage_sessions', 'manage_tracks', 'manage_halls', 'manage_venues', 'manage_accommodation', 'manage_transport', 'manage_vendors', 'manage_inventory', 'manage_volunteers', 'manage_recruitment', 'manage_interviews', 'manage_shifts', 'manage_attendance', 'manage_tasks', 'view_volunteer_reports', 'manage_security', 'manage_emergency_contacts', 'manage_cme', 'upload_resources', 'publish_schedule', 'manage_workshops', 'manage_events', 'manage_competitions', 'manage_event_registrations', 'manage_event_payments', 'manage_feedback', 'manage_resources', 'publish_events', 'manage_sponsors', 'manage_sponsor_tiers', 'manage_exhibitors', 'manage_stalls', 'manage_contracts', 'manage_invoices', 'manage_deliverables', 'view_sponsorship_reports', 'manage_announcements', 'manage_news', 'manage_homepage', 'manage_gallery', 'manage_campaigns', 'manage_media_partners', 'manage_notifications', 'manage_seo', 'publish_content', 'manage_abstracts', 'manage_reviewers', 'assign_reviewers', 'review_abstracts', 'manage_awards', 'manage_judges', 'manage_certificates', 'manage_templates', 'generate_certificates', 'revoke_certificates', 'manage_signatures', 'manage_accreditation', 'verify_certificates', 'view_certificate_reports', 'publish_scientific_program', 'manage_mobile_app', 'manage_mobile_users', 'view_mobile_analytics'],
  TEAM_ADMIN: ['dashboard.view', 'view_registrations', 'manage_forms', 'create_forms', 'edit_forms', 'review_submissions'],
  FORM_MANAGER: ['dashboard.view', 'manage_forms', 'create_forms', 'edit_forms', 'publish_forms', 'review_submissions', 'export_submissions', 'manage_form_templates'],
  EDITOR: ['dashboard.view', 'view_registrations'],
  VIEWER: ['dashboard.view', 'view_registrations'],
  MEDIA: ['dashboard.view', 'media.manage', 'upload_resources'],
  RESEARCH: ['dashboard.view', 'research.manage', 'manage_abstracts', 'manage_reviewers', 'assign_reviewers', 'review_abstracts', 'manage_awards', 'manage_judges', 'publish_scientific_program'],
  VOLUNTEER: ['dashboard.view', 'checkin.scan', 'attendance.manage', 'operations.view', 'manage_registrations', 'view_registrations', 'manage_checkins'],
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

const tableExists = async (tableName) => {
  const [rows] = await pool.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName]
  );

  return rows.length > 0;
};

const indexExists = async (tableName, indexName) => {
  const [rows] = await pool.query(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [tableName, indexName]
  );

  return rows.length > 0;
};

const SQL_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const assertSqlIdentifier = (value, label) => {
  const identifier = String(value || '').trim();
  if (!SQL_IDENTIFIER_PATTERN.test(identifier)) {
    console.warn('Schema setup received invalid SQL identifier', { label, value });
    throw new Error(`Invalid SQL identifier for ${label}: ${identifier || '(empty)'}`);
  }
  return identifier;
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
  const safeTableName = assertSqlIdentifier(tableName, 'tableName');
  const safeColumnName = assertSqlIdentifier(columnName, 'columnName');
  if (!(await columnExists(safeTableName, safeColumnName))) {
    await pool.query(`ALTER TABLE ${safeTableName} ADD COLUMN ${safeColumnName} ${definition}`);
  }
};

const addIndexIfMissing = async (tableName, indexName, definition) => {
  const safeTableName = assertSqlIdentifier(tableName, 'tableName');
  const safeIndexName = assertSqlIdentifier(indexName, 'indexName');
  if (!(await indexExists(safeTableName, safeIndexName))) {
    await pool.query(`ALTER TABLE ${safeTableName} ADD ${definition}`);
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
      phone VARCHAR(40) NULL,
      profile_image TEXT NULL,
      is_active BOOLEAN DEFAULT TRUE,
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS modules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      slug VARCHAR(140) NOT NULL UNIQUE,
      description TEXT NULL,
      module_key VARCHAR(100) NOT NULL UNIQUE,
      label VARCHAR(120) NOT NULL,
      permission_key VARCHAR(100) NULL,
      route_key VARCHAR(100) NOT NULL,
      icon VARCHAR(80) NULL,
      display_order INT DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_modules_permission_key FOREIGN KEY (permission_key) REFERENCES permissions(\`key\`) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(140) NOT NULL UNIQUE,
      slug VARCHAR(160) NOT NULL UNIQUE,
      description TEXT NULL,
      icon VARCHAR(80) NULL,
      color VARCHAR(20) NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_modules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_id INT NOT NULL,
      module_id INT NOT NULL,
      UNIQUE KEY uq_team_modules_team_module (team_id, module_id),
      CONSTRAINT fk_team_modules_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      CONSTRAINT fk_team_modules_module_id FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_id INT NOT NULL,
      user_id INT NOT NULL,
      role_id INT NULL,
      team_role ENUM('TEAM_ADMIN', 'TEAM_MEMBER') DEFAULT 'TEAM_MEMBER',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_team_members_team_user (team_id, user_id),
      CONSTRAINT fk_team_members_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      CONSTRAINT fk_team_members_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_team_members_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      action VARCHAR(120) NOT NULL,
      module VARCHAR(120) NULL,
      record_id VARCHAR(120) NULL,
      metadata JSON NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activity_user_time (user_id, timestamp),
      INDEX idx_activity_module_time (module, timestamp),
      CONSTRAINT fk_activity_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await addColumnIfMissing('users', 'role_id', 'INT NULL');
  await addColumnIfMissing('users', 'phone', 'VARCHAR(40) NULL');
  await addColumnIfMissing('users', 'profile_image', 'TEXT NULL');
  await addColumnIfMissing('users', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfMissing('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  await addColumnIfMissing('teams', 'slug', 'VARCHAR(160) NULL');
  await addColumnIfMissing('teams', 'icon', 'VARCHAR(80) NULL');
  await addColumnIfMissing('teams', 'color', 'VARCHAR(20) NULL');
  await addColumnIfMissing('teams', 'is_active', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfMissing('modules', 'name', 'VARCHAR(120) NULL');
  await addColumnIfMissing('modules', 'slug', 'VARCHAR(140) NULL');
  await addColumnIfMissing('modules', 'description', 'TEXT NULL');
  await addColumnIfMissing('team_members', 'role_id', 'INT NULL');
  await addColumnIfMissing('team_modules', 'id', 'INT AUTO_INCREMENT UNIQUE FIRST');
  await addIndexIfMissing('teams', 'uq_teams_slug', 'UNIQUE KEY uq_teams_slug (slug)');
  await addIndexIfMissing('modules', 'uq_modules_slug', 'UNIQUE KEY uq_modules_slug (slug)');
  await addIndexIfMissing('team_modules', 'uq_team_modules_team_module', 'UNIQUE KEY uq_team_modules_team_module (team_id, module_id)');
};

const createSpeakerTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS speakers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      designation VARCHAR(255),
      institution VARCHAR(255),
      organization VARCHAR(255),
      specialization VARCHAR(255),
      country VARCHAR(100),
      city VARCHAR(100),
      bio TEXT,
      topic VARCHAR(255),
      achievements TEXT,
      travel_status VARCHAR(100),
      accommodation_status VARCHAR(100),
      special_requirements TEXT,
      email VARCHAR(255),
      phone VARCHAR(50),
      photo_url TEXT,
      profile_image TEXT,
      linkedin_url TEXT,
      twitter_url TEXT,
      website_url TEXT,
      instagram_url TEXT,
      featured BOOLEAN DEFAULT FALSE,
      keynote BOOLEAN DEFAULT FALSE,
      display_order INT DEFAULT 0,
      status ENUM('draft', 'confirmed', 'cancelled', 'published') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('speakers', 'full_name', 'VARCHAR(255)');
  await addColumnIfMissing('speakers', 'organization', 'VARCHAR(255)');
  await addColumnIfMissing('speakers', 'specialization', 'VARCHAR(255)');
  await addColumnIfMissing('speakers', 'country', 'VARCHAR(100)');
  await addColumnIfMissing('speakers', 'city', 'VARCHAR(100)');
  await addColumnIfMissing('speakers', 'achievements', 'TEXT');
  await addColumnIfMissing('speakers', 'travel_status', 'VARCHAR(100)');
  await addColumnIfMissing('speakers', 'accommodation_status', 'VARCHAR(100)');
  await addColumnIfMissing('speakers', 'special_requirements', 'TEXT');
  await addColumnIfMissing('speakers', 'email', 'VARCHAR(255)');
  await addColumnIfMissing('speakers', 'phone', 'VARCHAR(50)');
  await addColumnIfMissing('speakers', 'profile_image', 'TEXT');
  await addColumnIfMissing('speakers', 'twitter_url', 'TEXT');
  await addColumnIfMissing('speakers', 'website_url', 'TEXT');
  await pool.query("ALTER TABLE speakers MODIFY status ENUM('draft', 'confirmed', 'cancelled', 'published') DEFAULT 'draft'");
  await pool.query('UPDATE speakers SET full_name = COALESCE(full_name, name), organization = COALESCE(organization, institution), profile_image = COALESCE(profile_image, photo_url)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color VARCHAR(20)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS halls (
      id INT PRIMARY KEY AUTO_INCREMENT,
      venue_id INT NULL,
      name VARCHAR(255) NOT NULL,
      capacity INT DEFAULT 0,
      location VARCHAR(255),
      floor VARCHAR(80),
      hall_type ENUM('auditorium', 'workshop_room', 'meeting_room', 'expo_hall') DEFAULT 'meeting_room',
      status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available'
    )
  `);
  await addColumnIfMissing('halls', 'venue_id', 'INT NULL');
  await addColumnIfMissing('halls', 'floor', 'VARCHAR(80)');
  await addColumnIfMissing('halls', 'hall_type', "ENUM('auditorium', 'workshop_room', 'meeting_room', 'expo_hall') DEFAULT 'meeting_room'");
  await addColumnIfMissing('halls', 'status', "ENUM('available', 'occupied', 'maintenance') DEFAULT 'available'");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      speaker_id INT NULL,
      session_type VARCHAR(100),
      hall_id INT NULL,
      track_id INT NULL,
      start_time DATETIME NULL,
      end_time DATETIME NULL,
      cme_credit_points DECIMAL(6,2) DEFAULT 0,
      status ENUM('draft', 'published', 'cancelled') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_sessions_speaker_id FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE SET NULL,
      CONSTRAINT fk_sessions_hall_id FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE SET NULL,
      CONSTRAINT fk_sessions_track_id FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS session_resources (
      id INT PRIMARY KEY AUTO_INCREMENT,
      session_id INT NOT NULL,
      resource_name VARCHAR(255),
      resource_type ENUM('pdf', 'ppt', 'video', 'external_link'),
      file_url TEXT,
      CONSTRAINT fk_session_resources_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS speaker_documents (
      id INT PRIMARY KEY AUTO_INCREMENT,
      speaker_id INT NOT NULL,
      document_type ENUM('agreement', 'photo_release', 'travel_form', 'cme_document'),
      file_url TEXT,
      CONSTRAINT fk_speaker_documents_speaker_id FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cme_records (
      id INT PRIMARY KEY AUTO_INCREMENT,
      session_id INT NOT NULL,
      credit_hours DECIMAL(6,2) DEFAULT 0,
      credit_points DECIMAL(6,2) DEFAULT 0,
      approved BOOLEAN DEFAULT FALSE,
      approved_by INT NULL,
      CONSTRAINT fk_cme_records_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      CONSTRAINT fk_cme_records_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
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
  await pool.query("ALTER TABLE workshop_registrations MODIFY status ENUM('pending','confirmed','registered','waitlisted','cancelled') DEFAULT 'pending'");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_types (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      slug VARCHAR(140) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS venues (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      address TEXT,
      city VARCHAR(120),
      state VARCHAR(120),
      country VARCHAR(120),
      google_maps_link TEXT,
      gps_coordinates VARCHAR(120),
      venue_map_url TEXT,
      contact_person VARCHAR(255),
      contact_number VARCHAR(80),
      capacity INT DEFAULT 0,
      notes TEXT,
      description TEXT,
      status ENUM('active', 'inactive') DEFAULT 'active',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await addColumnIfMissing('venues', 'address', 'TEXT');
  await addColumnIfMissing('venues', 'city', 'VARCHAR(120)');
  await addColumnIfMissing('venues', 'state', 'VARCHAR(120)');
  await addColumnIfMissing('venues', 'country', 'VARCHAR(120)');
  await addColumnIfMissing('venues', 'google_maps_link', 'TEXT');
  await addColumnIfMissing('venues', 'gps_coordinates', 'VARCHAR(120)');
  await addColumnIfMissing('venues', 'venue_map_url', 'TEXT');
  await addColumnIfMissing('venues', 'contact_person', 'VARCHAR(255)');
  await addColumnIfMissing('venues', 'contact_number', 'VARCHAR(80)');
  await addColumnIfMissing('venues', 'description', 'TEXT');
  await addColumnIfMissing('venues', 'status', "ENUM('active', 'inactive') DEFAULT 'active'");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description LONGTEXT,
      event_type_id INT NULL,
      event_type VARCHAR(120),
      banner_image TEXT,
      status ENUM('draft', 'published', 'cancelled', 'completed', 'archived') DEFAULT 'draft',
      start_datetime DATETIME NULL,
      end_datetime DATETIME NULL,
      venue_id INT NULL,
      capacity INT DEFAULT 0,
      registration_limit INT DEFAULT 0,
      waitlist_enabled BOOLEAN DEFAULT FALSE,
      registration_required BOOLEAN DEFAULT TRUE,
      registration_open BOOLEAN DEFAULT TRUE,
      manual_approval BOOLEAN DEFAULT FALSE,
      certificate_enabled BOOLEAN DEFAULT FALSE,
      fee DECIMAL(10,2) DEFAULT 0,
      prerequisites TEXT,
      learning_outcomes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_events_event_type FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE SET NULL,
      CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL
    )
  `);
  await addColumnIfMissing('events', 'event_type_id', 'INT NULL');
  await addColumnIfMissing('events', 'registration_limit', 'INT DEFAULT 0');
  await addColumnIfMissing('events', 'registration_open', 'BOOLEAN DEFAULT TRUE');
  await addColumnIfMissing('events', 'manual_approval', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfMissing('events', 'fee', 'DECIMAL(10,2) DEFAULT 0');
  await addColumnIfMissing('events', 'prerequisites', 'TEXT');
  await addColumnIfMissing('events', 'learning_outcomes', 'TEXT');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_facilitators (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      speaker_id INT NOT NULL,
      role VARCHAR(120) DEFAULT 'facilitator',
      CONSTRAINT fk_event_facilitators_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_event_facilitators_speaker FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      registration_id INT NULL,
      attendance_status ENUM('registered', 'waitlisted', 'approved', 'checked_in', 'absent') DEFAULT 'registered',
      certificate_generated BOOLEAN DEFAULT FALSE,
      approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
      qr_code TEXT,
      checked_in_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_event_registration (event_id, registration_id),
      CONSTRAINT fk_er_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      registration_id INT NULL,
      amount DECIMAL(10,2) DEFAULT 0,
      payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
      transaction_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_ep_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_resources (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      resource_name VARCHAR(255) NOT NULL,
      resource_type ENUM('pdf', 'ppt', 'video', 'link', 'worksheet') DEFAULT 'pdf',
      resource_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_event_resources_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_feedback (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      registration_id INT NULL,
      rating INT DEFAULT 0,
      nps_score INT DEFAULT 0,
      feedback TEXT,
      suggestions TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_event_feedback_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_certificates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      registration_id INT NULL,
      certificate_type VARCHAR(120) DEFAULT 'participation',
      certificate_url TEXT,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_ec_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_submissions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      registration_id INT NULL,
      title VARCHAR(255),
      file_url TEXT,
      status ENUM('submitted', 'under_review', 'shortlisted', 'winner', 'rejected') DEFAULT 'submitted',
      score DECIMAL(8,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_es_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);
};

const createPartnerTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partners (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      logo TEXT,
      website TEXT,
      tier VARCHAR(100),
      display_order INT DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sponsor_tiers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      priority_order INT DEFAULT 0,
      website_visibility BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_sponsor_tiers_name (name)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id INT PRIMARY KEY AUTO_INCREMENT,
      company_name VARCHAR(255) NOT NULL,
      tier_id INT NULL,
      contact_person VARCHAR(255),
      designation VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(60),
      website TEXT,
      linkedin TEXT,
      country VARCHAR(120),
      city VARCHAR(120),
      company_description TEXT,
      logo_url TEXT,
      banner_url TEXT,
      status ENUM('prospect', 'lead', 'contacted', 'proposal_sent', 'negotiating', 'confirmed', 'payment_pending', 'completed', 'cancelled') DEFAULT 'prospect',
      contract_value DECIMAL(12,2) DEFAULT 0,
      amount_received DECIMAL(12,2) DEFAULT 0,
      payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_sponsors_tier_id FOREIGN KEY (tier_id) REFERENCES sponsor_tiers(id) ON DELETE SET NULL
    )
  `);

  await pool.query("ALTER TABLE sponsors MODIFY status ENUM('prospect', 'lead', 'contacted', 'proposal_sent', 'negotiating', 'confirmed', 'payment_pending', 'completed', 'cancelled') DEFAULT 'prospect'");
  await addColumnIfMissing('sponsors', 'is_active', 'BOOLEAN DEFAULT TRUE');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sponsor_contacts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sponsor_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      designation VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(60),
      CONSTRAINT fk_sponsor_contacts_sponsor_id FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS deliverables (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category ENUM('website', 'stage', 'social_media', 'email', 'exhibition', 'branding') DEFAULT 'website',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sponsor_deliverables (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sponsor_id INT NOT NULL,
      deliverable_id INT NOT NULL,
      status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
      completed_at TIMESTAMP NULL,
      UNIQUE KEY uq_sponsor_deliverable (sponsor_id, deliverable_id),
      CONSTRAINT fk_sd_sponsor_id FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE,
      CONSTRAINT fk_sd_deliverable_id FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sponsor_id INT NOT NULL,
      contract_name VARCHAR(255) NOT NULL,
      file_url TEXT,
      signed BOOLEAN DEFAULT FALSE,
      signed_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_contracts_sponsor_id FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sponsor_id INT NOT NULL,
      invoice_number VARCHAR(120) NOT NULL,
      amount DECIMAL(12,2) DEFAULT 0,
      tax DECIMAL(12,2) DEFAULT 0,
      status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
      issue_date DATE NULL,
      due_date DATE NULL,
      invoice_pdf TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_invoices_invoice_number (invoice_number),
      CONSTRAINT fk_invoices_sponsor_id FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exhibitor_stalls (
      id INT PRIMARY KEY AUTO_INCREMENT,
      stall_number VARCHAR(80) NOT NULL,
      location VARCHAR(255),
      size VARCHAR(100),
      status ENUM('available', 'reserved', 'occupied') DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_exhibitor_stalls_number (stall_number)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stall_allocations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      stall_id INT NOT NULL,
      sponsor_id INT NOT NULL,
      allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_stall_allocations_stall (stall_id),
      CONSTRAINT fk_sa_stall_id FOREIGN KEY (stall_id) REFERENCES exhibitor_stalls(id) ON DELETE CASCADE,
      CONSTRAINT fk_sa_sponsor_id FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sponsor_communications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sponsor_id INT NOT NULL,
      type ENUM('call', 'email', 'meeting', 'proposal', 'follow_up', 'note') DEFAULT 'note',
      subject VARCHAR(255),
      notes TEXT,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_sc_sponsor_id FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE,
      CONSTRAINT fk_sc_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
};

const createMediaTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      filename VARCHAR(255),
      original_name VARCHAR(255),
      url TEXT NOT NULL,
      public_id VARCHAR(255),
      resource_type VARCHAR(50),
      file_type VARCHAR(100),
      size_bytes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const createSettingsTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const createMarketingTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      content LONGTEXT,
      featured_image TEXT,
      status ENUM('draft', 'review', 'approved', 'published', 'archived') DEFAULT 'draft',
      publish_date DATETIME NULL,
      author_id INT NULL,
      is_pinned BOOLEAN DEFAULT FALSE,
      is_featured BOOLEAN DEFAULT FALSE,
      seo_title VARCHAR(255),
      seo_description TEXT,
      seo_keywords TEXT,
      og_image TEXT,
      canonical_url TEXT,
      schema_markup JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await addColumnIfMissing('announcements', 'is_pinned', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfMissing('announcements', 'is_featured', 'BOOLEAN DEFAULT FALSE');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS news_articles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      excerpt TEXT,
      content LONGTEXT,
      cover_image TEXT,
      category VARCHAR(120),
      status ENUM('draft', 'review', 'approved', 'published', 'archived') DEFAULT 'draft',
      publish_date DATETIME NULL,
      author_id INT NULL,
      is_featured BOOLEAN DEFAULT FALSE,
      seo_title VARCHAR(255),
      seo_description TEXT,
      seo_keywords TEXT,
      og_image TEXT,
      canonical_url TEXT,
      schema_markup JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_news_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hero_banners (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      subtitle TEXT,
      button_text VARCHAR(120),
      button_link TEXT,
      background_image TEXT,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      start_date DATETIME NULL,
      end_date DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS homepage_sections (
      id INT PRIMARY KEY AUTO_INCREMENT,
      section_name VARCHAR(120) NOT NULL UNIQUE,
      title VARCHAR(255),
      subtitle TEXT,
      content LONGTEXT,
      config JSON,
      is_visible BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 0,
      seo_title VARCHAR(255),
      seo_description TEXT,
      seo_keywords TEXT,
      og_image TEXT,
      canonical_url TEXT,
      schema_markup JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery_albums (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cover_image TEXT,
      event_date DATE NULL,
      is_featured BOOLEAN DEFAULT FALSE,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery_media (
      id INT PRIMARY KEY AUTO_INCREMENT,
      album_id INT NOT NULL,
      media_type ENUM('image', 'video') DEFAULT 'image',
      media_url TEXT NOT NULL,
      caption TEXT,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_gallery_media_album FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS social_campaigns (
      id INT PRIMARY KEY AUTO_INCREMENT,
      campaign_name VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE NULL,
      end_date DATE NULL,
      status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS social_posts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      campaign_id INT NOT NULL,
      platform ENUM('instagram', 'facebook', 'linkedin', 'twitter', 'youtube') DEFAULT 'instagram',
      caption TEXT,
      media_url TEXT,
      scheduled_date DATETIME NULL,
      status ENUM('draft', 'scheduled', 'published') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_social_posts_campaign FOREIGN KEY (campaign_id) REFERENCES social_campaigns(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_partners (
      id INT PRIMARY KEY AUTO_INCREMENT,
      organization_name VARCHAR(255) NOT NULL,
      logo_url TEXT,
      website TEXT,
      tier VARCHAR(120),
      description TEXT,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS website_notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      notification_type ENUM('info', 'warning', 'success') DEFAULT 'info',
      start_date DATETIME NULL,
      end_date DATETIME NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS seo_pages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      page_key VARCHAR(160) NOT NULL UNIQUE,
      seo_title VARCHAR(255),
      seo_description TEXT,
      seo_keywords TEXT,
      og_image TEXT,
      canonical_url TEXT,
      schema_markup JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_approval_history (
      id INT PRIMARY KEY AUTO_INCREMENT,
      content_type VARCHAR(80) NOT NULL,
      content_id INT NOT NULL,
      from_status VARCHAR(40),
      to_status VARCHAR(40),
      user_id INT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_approval_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_marketing_templates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      subject VARCHAR(255),
      body LONGTEXT,
      category VARCHAR(120),
      status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_subscriber_lists (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const createLogisticsTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accommodations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      hotel_type ENUM('hotel', 'hostel', 'guest_house') DEFAULT 'hotel',
      address TEXT,
      contact_person VARCHAR(255),
      contact_number VARCHAR(80),
      room_capacity INT DEFAULT 0,
      available_rooms INT DEFAULT 0,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accommodation_bookings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      registration_id INT NULL,
      accommodation_id INT NOT NULL,
      room_number VARCHAR(80),
      check_in DATETIME NULL,
      check_out DATETIME NULL,
      booking_type VARCHAR(120),
      status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_ab_accommodation FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transport_routes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      pickup_location VARCHAR(255),
      drop_location VARCHAR(255),
      vehicle_type VARCHAR(120),
      capacity INT DEFAULT 0,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transport_bookings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      registration_id INT NULL,
      route_id INT NOT NULL,
      pickup_time DATETIME NULL,
      status ENUM('confirmed', 'completed', 'cancelled') DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tb_route FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INT PRIMARY KEY AUTO_INCREMENT,
      company_name VARCHAR(255) NOT NULL,
      category_id INT NULL,
      category VARCHAR(120),
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(80),
      contract_value DECIMAL(12,2) DEFAULT 0,
      contract_url TEXT,
      payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
      deliverable_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
      status VARCHAR(80),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_vendors_category FOREIGN KEY (category_id) REFERENCES vendor_categories(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INT PRIMARY KEY AUTO_INCREMENT,
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(120),
      quantity INT DEFAULT 0,
      available_quantity INT DEFAULT 0,
      \`condition\` ENUM('good', 'damaged', 'maintenance') DEFAULT 'good',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_allocations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      inventory_id INT NOT NULL,
      hall_id INT NULL,
      allocated_quantity INT DEFAULT 0,
      allocation_status ENUM('checked_out', 'checked_in', 'maintenance') DEFAULT 'checked_out',
      allocated_by INT NULL,
      allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      returned_at DATETIME NULL,
      CONSTRAINT fk_ia_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
      CONSTRAINT fk_ia_hall FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE SET NULL,
      CONSTRAINT fk_ia_user FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteer_assignments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NULL,
      volunteer_name VARCHAR(255),
      role_area VARCHAR(160),
      location VARCHAR(255),
      shift_start DATETIME NULL,
      shift_end DATETIME NULL,
      attendance_status ENUM('assigned', 'checked_in', 'completed', 'absent') DEFAULT 'assigned',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_va_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS security_incidents (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      access_zone VARCHAR(160),
      incident_type VARCHAR(160),
      severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
      status ENUM('open', 'investigating', 'resolved') DEFAULT 'open',
      description TEXT,
      reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      designation VARCHAR(255),
      department VARCHAR(160),
      phone VARCHAR(80),
      email VARCHAR(255),
      priority_level INT DEFAULT 1,
      contact_type VARCHAR(120),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS logistics_tasks (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to INT NULL,
      module VARCHAR(120),
      priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
      status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
      due_date DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_lt_user FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
};

const createVolunteerTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(80),
      gender VARCHAR(80),
      date_of_birth DATE NULL,
      institution VARCHAR(255),
      course VARCHAR(160),
      year_of_study VARCHAR(80),
      city VARCHAR(120),
      profile_photo TEXT,
      resume_url TEXT,
      id_card_url TEXT,
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(80),
      skills TEXT,
      availability TEXT,
      application_status ENUM('applied', 'shortlisted', 'interviewed', 'selected', 'rejected', 'inactive') DEFAULT 'applied',
      joined_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteer_departments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteer_assignments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      volunteer_id INT NULL,
      department_id INT NULL,
      assigned_by INT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      role VARCHAR(160),
      user_id INT NULL,
      volunteer_name VARCHAR(255),
      role_area VARCHAR(160),
      location VARCHAR(255),
      shift_start DATETIME NULL,
      shift_end DATETIME NULL,
      attendance_status ENUM('assigned', 'checked_in', 'completed', 'absent') DEFAULT 'assigned',
      notes TEXT,
      CONSTRAINT fk_volunteer_assignments_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
      CONSTRAINT fk_volunteer_assignments_department FOREIGN KEY (department_id) REFERENCES volunteer_departments(id) ON DELETE SET NULL,
      CONSTRAINT fk_volunteer_assignments_user FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await addColumnIfMissing('volunteer_assignments', 'volunteer_id', 'INT NULL');
  await addColumnIfMissing('volunteer_assignments', 'department_id', 'INT NULL');
  await addColumnIfMissing('volunteer_assignments', 'assigned_by', 'INT NULL');
  await addColumnIfMissing('volunteer_assignments', 'assigned_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing('volunteer_assignments', 'role', 'VARCHAR(160)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      department_id INT NULL,
      date DATE NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      location VARCHAR(255),
      capacity INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_shifts_department FOREIGN KEY (department_id) REFERENCES volunteer_departments(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shift_assignments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      shift_id INT NOT NULL,
      volunteer_id INT NOT NULL,
      attendance_status ENUM('assigned', 'present', 'absent', 'late') DEFAULT 'assigned',
      UNIQUE KEY uq_shift_volunteer (shift_id, volunteer_id),
      CONSTRAINT fk_shift_assignments_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
      CONSTRAINT fk_shift_assignments_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteer_attendance (
      id INT PRIMARY KEY AUTO_INCREMENT,
      volunteer_id INT NOT NULL,
      check_in_time DATETIME NULL,
      check_out_time DATETIME NULL,
      location VARCHAR(255),
      recorded_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_va_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
      CONSTRAINT fk_va_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS performance_reviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      volunteer_id INT NOT NULL,
      reviewed_by INT NULL,
      communication_score DECIMAL(5,2) DEFAULT 0,
      leadership_score DECIMAL(5,2) DEFAULT 0,
      discipline_score DECIMAL(5,2) DEFAULT 0,
      teamwork_score DECIMAL(5,2) DEFAULT 0,
      initiative_score DECIMAL(5,2) DEFAULT 0,
      comments TEXT,
      overall_score DECIMAL(6,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pr_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
      CONSTRAINT fk_pr_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteer_certificates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      volunteer_id INT NOT NULL,
      certificate_type VARCHAR(120),
      certificate_url TEXT,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_vc_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteer_announcements (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      department_id INT NULL,
      published_at DATETIME NULL,
      created_by INT NULL,
      CONSTRAINT fk_vann_department FOREIGN KEY (department_id) REFERENCES volunteer_departments(id) ON DELETE SET NULL,
      CONSTRAINT fk_vann_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteer_interviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      volunteer_id INT NOT NULL,
      interviewer_id INT NULL,
      scheduled_at DATETIME NULL,
      feedback TEXT,
      score DECIMAL(6,2) DEFAULT 0,
      status ENUM('scheduled', 'completed', 'approved', 'rejected') DEFAULT 'scheduled',
      CONSTRAINT fk_vi_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
      CONSTRAINT fk_vi_interviewer FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS volunteer_tasks (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      volunteer_id INT NULL,
      department_id INT NULL,
      priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
      status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
      due_date DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_vt_volunteer FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL,
      CONSTRAINT fk_vt_department FOREIGN KEY (department_id) REFERENCES volunteer_departments(id) ON DELETE SET NULL
    )
  `);
};

const createResearchTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS abstract_categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      submission_type ENUM('poster', 'oral', 'research_paper', 'case_report') DEFAULT 'poster',
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS abstracts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      abstract_id VARCHAR(100) NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      authors TEXT,
      corresponding_author VARCHAR(255),
      presenting_author VARCHAR(255),
      institution VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      country VARCHAR(100),
      category_id INT NULL,
      category ENUM('poster', 'oral', 'research_paper', 'case_report'),
      track VARCHAR(255),
      keywords TEXT,
      abstract_text LONGTEXT,
      file_url TEXT,
      pdf_url TEXT,
      submission_status ENUM('draft', 'submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'withdrawn') DEFAULT 'draft',
      status ENUM('draft', 'submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'withdrawn') DEFAULT 'draft',
      final_score DECIMAL(8,2),
      submitted_at TIMESTAMP NULL,
      review_score DECIMAL(5,2),
      review_notes TEXT,
      reviewer_id INT,
      award_nomination BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('abstracts', 'abstract_id', 'VARCHAR(100) NULL UNIQUE');
  await addColumnIfMissing('abstracts', 'corresponding_author', 'VARCHAR(255)');
  await addColumnIfMissing('abstracts', 'country', 'VARCHAR(100)');
  await addColumnIfMissing('abstracts', 'category_id', 'INT NULL');
  await addColumnIfMissing('abstracts', 'file_url', 'TEXT');
  await addColumnIfMissing('abstracts', 'submission_status', "ENUM('draft', 'submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'withdrawn') DEFAULT 'draft'");
  await addColumnIfMissing('abstracts', 'final_score', 'DECIMAL(8,2)');
  await addColumnIfMissing('abstracts', 'submitted_at', 'TIMESTAMP NULL');
  await pool.query("ALTER TABLE abstracts MODIFY status ENUM('draft', 'submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'withdrawn') DEFAULT 'draft'");
  await pool.query('UPDATE abstracts SET abstract_id = CONCAT("GHC-ABS-", LPAD(id, 5, "0")) WHERE abstract_id IS NULL OR abstract_id = ""');
  await pool.query('UPDATE abstracts SET corresponding_author = COALESCE(corresponding_author, presenting_author), file_url = COALESCE(file_url, pdf_url), submission_status = COALESCE(submission_status, status)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviewers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      specialization VARCHAR(255),
      designation VARCHAR(255),
      institution VARCHAR(255),
      country VARCHAR(100),
      UNIQUE KEY uq_reviewers_user_id (user_id),
      CONSTRAINT fk_reviewers_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS abstract_review_assignments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      abstract_id INT NOT NULL,
      reviewer_id INT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_abstract_reviewer (abstract_id, reviewer_id),
      CONSTRAINT fk_ara_abstract_id FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE,
      CONSTRAINT fk_ara_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES reviewers(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS abstract_reviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      abstract_id INT NOT NULL,
      reviewer_id INT NOT NULL,
      scientific_merit DECIMAL(6,2) DEFAULT 0,
      originality DECIMAL(6,2) DEFAULT 0,
      methodology DECIMAL(6,2) DEFAULT 0,
      presentation_quality DECIMAL(6,2) DEFAULT 0,
      relevance DECIMAL(6,2) DEFAULT 0,
      comments TEXT,
      recommendation ENUM('accept', 'reject', 'revise'),
      total_score DECIMAL(8,2) DEFAULT 0,
      reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_abstract_reviews_reviewer (abstract_id, reviewer_id),
      CONSTRAINT fk_abstract_reviews_abstract_id FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE,
      CONSTRAINT fk_abstract_reviews_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES reviewers(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS judges (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      specialization VARCHAR(255),
      designation VARCHAR(255),
      UNIQUE KEY uq_judges_user_id (user_id),
      CONSTRAINT fk_judges_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS presentation_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      session_type ENUM('poster', 'oral') DEFAULT 'poster',
      hall_id INT NULL,
      date DATE NULL,
      start_time TIME NULL,
      end_time TIME NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS presentation_assignments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      abstract_id INT NOT NULL,
      session_id INT NOT NULL,
      presentation_order INT DEFAULT 0,
      poster_number VARCHAR(100) NULL,
      poster_url TEXT NULL,
      UNIQUE KEY uq_presentation_abstract (abstract_id),
      CONSTRAINT fk_presentation_assignments_abstract_id FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE,
      CONSTRAINT fk_presentation_assignments_session_id FOREIGN KEY (session_id) REFERENCES presentation_sessions(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS awards (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(255),
      prize VARCHAR(255)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS award_results (
      id INT PRIMARY KEY AUTO_INCREMENT,
      award_id INT NOT NULL,
      abstract_id INT NOT NULL,
      \`rank\` INT,
      score DECIMAL(8,2),
      CONSTRAINT fk_award_results_award_id FOREIGN KEY (award_id) REFERENCES awards(id) ON DELETE CASCADE,
      CONSTRAINT fk_award_results_abstract_id FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scoring_criteria (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      weight DECIMAL(6,2) DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scientific_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const createRegistrationTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registration_categories (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      capacity INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      category_id INT NULL,
      gender VARCHAR(40) NULL,
      state VARCHAR(120) NULL,
      amount_paid DECIMAL(10,2) DEFAULT 0,
      transaction_id VARCHAR(255) NULL,
      badge_generated BOOLEAN DEFAULT FALSE,
      attendance_status ENUM('registered', 'checked_in') DEFAULT 'registered',
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
      registration_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      qr_code TEXT,
      attendance BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(100) NOT NULL UNIQUE,
      discount_type ENUM('percentage', 'fixed') NOT NULL,
      value DECIMAL(10,2) DEFAULT 0,
      usage_limit INT DEFAULT 0,
      used_count INT DEFAULT 0,
      expiry_date DATE NULL,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      slug VARCHAR(140) NOT NULL UNIQUE,
      is_active BOOLEAN DEFAULT TRUE,
      config JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      template_key VARCHAR(120) NOT NULL UNIQUE,
      subject VARCHAR(255) NOT NULL,
      body LONGTEXT,
      is_active BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('registrations', 'category_id', 'INT NULL');
  await addColumnIfMissing('registrations', 'gender', 'VARCHAR(40) NULL');
  await addColumnIfMissing('registrations', 'state', 'VARCHAR(120) NULL');
  await addColumnIfMissing('registrations', 'amount_paid', 'DECIMAL(10,2) DEFAULT 0');
  await addColumnIfMissing('registrations', 'transaction_id', 'VARCHAR(255) NULL');
  await addColumnIfMissing('registrations', 'badge_generated', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfMissing('registrations', 'attendance_status', "ENUM('registered', 'checked_in') DEFAULT 'registered'");
  await addColumnIfMissing('registrations', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
};

const createPaymentTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      registration_id INT,
      ticket_type_id INT,
      payment_provider VARCHAR(100),
      gateway VARCHAR(100) NULL,
      provider_order_id VARCHAR(255),
      provider_payment_id VARCHAR(255),
      transaction_reference VARCHAR(255) NULL,
      amount DECIMAL(10,2),
      currency VARCHAR(10),
      status ENUM('created', 'pending', 'paid', 'failed', 'refunded') DEFAULT 'created',
      receipt_url TEXT,
      invoice_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('payments', 'gateway', 'VARCHAR(100) NULL');
  await addColumnIfMissing('payments', 'transaction_reference', 'VARCHAR(255) NULL');

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
      check_in_time DATETIME NULL,
      checkout_time DATETIME,
      workshop_id INT,
      verified_by INT,
      checked_by INT NULL,
      location VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('attendance_logs', 'check_in_time', 'DATETIME NULL');
  await addColumnIfMissing('attendance_logs', 'checked_by', 'INT NULL');
  await addColumnIfMissing('attendance_logs', 'location', 'VARCHAR(255) NULL');

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
  await addColumnIfMissing('certificates', 'certificate_id', 'VARCHAR(120) NULL UNIQUE');
  await addColumnIfMissing('certificates', 'template_id', 'INT NULL');
  await addColumnIfMissing('certificates', 'recipient_name', 'VARCHAR(255)');
  await addColumnIfMissing('certificates', 'recipient_email', 'VARCHAR(255)');
  await addColumnIfMissing('certificates', 'recipient_type', 'VARCHAR(120)');
  await addColumnIfMissing('certificates', 'reference_module', 'VARCHAR(120)');
  await addColumnIfMissing('certificates', 'reference_record_id', 'VARCHAR(120)');
  await addColumnIfMissing('certificates', 'issue_date', 'DATE NULL');
  await addColumnIfMissing('certificates', 'verification_code', 'VARCHAR(160) NULL UNIQUE');
  await addColumnIfMissing('certificates', 'certificate_url', 'TEXT');
  await addColumnIfMissing('certificates', 'status', "ENUM('generated', 'sent', 'revoked') DEFAULT 'generated'");
  await addColumnIfMissing('certificates', 'email_status', "ENUM('pending', 'sent', 'failed') DEFAULT 'pending'");
  await pool.query('UPDATE certificates SET certificate_id = CONCAT("GHC-CERT-", LPAD(id, 6, "0")) WHERE certificate_id IS NULL OR certificate_id = ""');
  await pool.query('UPDATE certificates SET verification_code = CONCAT("VERIFY-", id, "-", UNIX_TIMESTAMP(created_at)) WHERE verification_code IS NULL OR verification_code = ""');
  await pool.query('UPDATE certificates SET certificate_url = COALESCE(certificate_url, pdf_url), status = IF(issued = TRUE, "generated", status)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(120),
      background_image TEXT,
      orientation ENUM('portrait', 'landscape') DEFAULT 'landscape',
      template_data JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_fields (
      id INT PRIMARY KEY AUTO_INCREMENT,
      template_id INT NOT NULL,
      field_name VARCHAR(160) NOT NULL,
      field_type VARCHAR(80),
      x_position DECIMAL(8,2) DEFAULT 0,
      y_position DECIMAL(8,2) DEFAULT 0,
      font_size INT DEFAULT 18,
      font_family VARCHAR(120),
      alignment ENUM('left', 'center', 'right') DEFAULT 'center',
      CONSTRAINT fk_cf_template FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS digital_signatures (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      designation VARCHAR(255),
      signature_image TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_template_signatures (
      id INT PRIMARY KEY AUTO_INCREMENT,
      template_id INT NOT NULL,
      signature_id INT NOT NULL,
      x_position DECIMAL(8,2) DEFAULT 0,
      y_position DECIMAL(8,2) DEFAULT 0,
      display_order INT DEFAULT 0,
      CONSTRAINT fk_cts_template FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON DELETE CASCADE,
      CONSTRAINT fk_cts_signature FOREIGN KEY (signature_id) REFERENCES digital_signatures(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_verifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      certificate_id INT NOT NULL,
      verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(80),
      CONSTRAINT fk_cv_certificate FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accreditation_records (
      id INT PRIMARY KEY AUTO_INCREMENT,
      participant_id VARCHAR(120),
      participant_name VARCHAR(255),
      participant_email VARCHAR(255),
      credit_type ENUM('cme', 'workshop', 'training') DEFAULT 'cme',
      credit_hours DECIMAL(8,2) DEFAULT 0,
      approved_by INT NULL,
      approved_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_accreditation_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      certificate_id INT NULL,
      action VARCHAR(120) NOT NULL,
      user_id INT NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_cal_certificate FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE SET NULL,
      CONSTRAINT fk_cal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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

  await addColumnIfMissing('audit_logs', 'module', 'VARCHAR(120) NULL AFTER action');
  await addColumnIfMissing('audit_logs', 'record_type', 'VARCHAR(120) NULL AFTER module');
  await addColumnIfMissing('audit_logs', 'record_id', 'VARCHAR(120) NULL AFTER record_type');
  await addColumnIfMissing('audit_logs', 'old_values', 'JSON NULL AFTER record_id');
  await addColumnIfMissing('audit_logs', 'new_values', 'JSON NULL AFTER old_values');
  await addColumnIfMissing('audit_logs', 'ip_address', 'VARCHAR(80) NULL AFTER new_values');
  await addColumnIfMissing('audit_logs', 'user_agent', 'TEXT NULL AFTER ip_address');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NULL,
      email VARCHAR(160),
      ip_address VARCHAR(80),
      device VARCHAR(120),
      browser VARCHAR(160),
      location VARCHAR(160),
      status ENUM('success','failed') NOT NULL DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_login_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      session_token VARCHAR(255) NOT NULL,
      ip_address VARCHAR(80),
      device VARCHAR(120),
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_active_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      type ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      recipient VARCHAR(255),
      subject VARCHAR(255),
      status ENUM('sent','failed','queued') NOT NULL DEFAULT 'queued',
      sent_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS backup_records (
      id INT PRIMARY KEY AUTO_INCREMENT,
      backup_name VARCHAR(255) NOT NULL,
      file_location VARCHAR(500),
      size BIGINT DEFAULT 0,
      status VARCHAR(80) DEFAULT 'created',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      id INT PRIMARY KEY AUTO_INCREMENT,
      feature_name VARCHAR(160) NOT NULL UNIQUE,
      description TEXT,
      is_enabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS maintenance_mode (
      id INT PRIMARY KEY AUTO_INCREMENT,
      enabled BOOLEAN DEFAULT FALSE,
      message TEXT,
      enabled_by INT NULL,
      enabled_at DATETIME NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_maintenance_enabled_by FOREIGN KEY (enabled_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_request_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NULL,
      method VARCHAR(12),
      path VARCHAR(500),
      status_code INT,
      duration_ms INT,
      ip_address VARCHAR(80),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_api_request_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await addColumnIfMissing('users', 'is_locked', 'BOOLEAN DEFAULT FALSE AFTER is_active');
  await addColumnIfMissing('users', 'force_password_reset', 'BOOLEAN DEFAULT FALSE AFTER is_locked');
};

const createFormTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS forms (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      category ENUM('application','survey','feedback','registration','nomination') DEFAULT 'application',
      status ENUM('draft','published','closed') DEFAULT 'draft',
      team_id INT NULL,
      allow_multiple_submissions BOOLEAN DEFAULT FALSE,
      submission_limit INT NULL,
      start_date DATETIME NULL,
      end_date DATETIME NULL,
      auto_close BOOLEAN DEFAULT FALSE,
      success_message TEXT,
      redirect_url TEXT,
      email_notifications BOOLEAN DEFAULT FALSE,
      notification_emails TEXT,
      allow_editing BOOLEAN DEFAULT FALSE,
      anonymous_responses BOOLEAN DEFAULT FALSE,
      recaptcha_enabled BOOLEAN DEFAULT FALSE,
      max_file_size_mb INT DEFAULT 10,
      allowed_file_formats VARCHAR(255) DEFAULT 'jpg,jpeg,png,pdf,ppt,pptx,doc,docx,zip',
      embed_enabled BOOLEAN DEFAULT TRUE,
      view_count INT DEFAULT 0,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_forms_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
      CONSTRAINT fk_forms_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_fields (
      id INT PRIMARY KEY AUTO_INCREMENT,
      form_id INT NOT NULL,
      field_label VARCHAR(255) NOT NULL,
      field_name VARCHAR(160) NOT NULL,
      field_type ENUM('short_text','long_text','email','phone','number','date','dropdown','checkbox','radio','multi_select','file_upload','image_upload','url','rating','signature','section_break','heading','paragraph','terms') DEFAULT 'short_text',
      required BOOLEAN DEFAULT FALSE,
      placeholder VARCHAR(255),
      field_order INT DEFAULT 0,
      validation_rules JSON,
      conditional_logic JSON,
      help_text TEXT,
      CONSTRAINT fk_form_fields_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
      UNIQUE KEY uq_form_field_name (form_id, field_name)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS field_options (
      id INT PRIMARY KEY AUTO_INCREMENT,
      field_id INT NOT NULL,
      option_value VARCHAR(255) NOT NULL,
      display_text VARCHAR(255) NOT NULL,
      option_order INT DEFAULT 0,
      CONSTRAINT fk_field_options_field_id FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_statuses (
      id INT PRIMARY KEY AUTO_INCREMENT,
      form_id INT NULL,
      name VARCHAR(120) NOT NULL,
      slug VARCHAR(120) NOT NULL,
      color VARCHAR(40),
      is_terminal BOOLEAN DEFAULT FALSE,
      UNIQUE KEY uq_form_status (form_id, slug),
      CONSTRAINT fk_form_statuses_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      form_id INT NOT NULL,
      submission_id VARCHAR(120) NOT NULL UNIQUE,
      submitted_by INT NULL,
      submission_data JSON,
      status ENUM('draft','submitted','under_review','approved','rejected','archived') DEFAULT 'submitted',
      custom_status VARCHAR(120) NULL,
      reviewer_id INT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_form_submissions_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
      CONSTRAINT fk_form_submissions_user_id FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_form_submissions_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS submission_files (
      id INT PRIMARY KEY AUTO_INCREMENT,
      submission_id INT NOT NULL,
      field_id INT NULL,
      file_url TEXT NOT NULL,
      file_type VARCHAR(120),
      original_name VARCHAR(255),
      public_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_submission_files_submission_id FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
      CONSTRAINT fk_submission_files_field_id FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS submission_notes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      submission_id INT NOT NULL,
      added_by INT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_submission_notes_submission_id FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
      CONSTRAINT fk_submission_notes_added_by FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_templates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(120),
      template_schema JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_email_templates (
      id INT PRIMARY KEY AUTO_INCREMENT,
      form_id INT NOT NULL,
      trigger_event VARCHAR(120) NOT NULL,
      subject VARCHAR(255),
      body TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      CONSTRAINT fk_form_email_templates_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      form_id INT NULL,
      submission_id INT NULL,
      user_id INT NULL,
      action VARCHAR(160) NOT NULL,
      metadata JSON,
      ip_address VARCHAR(80),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_form_audit_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL,
      CONSTRAINT fk_form_audit_submission_id FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE SET NULL,
      CONSTRAINT fk_form_audit_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS form_views (
      id INT PRIMARY KEY AUTO_INCREMENT,
      form_id INT NOT NULL,
      ip_address VARCHAR(80),
      user_agent TEXT,
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_form_views_form_id FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    )
  `);
};

const createMobileTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      registration_id INT NULL UNIQUE,
      profile_photo TEXT,
      bio TEXT,
      specialization VARCHAR(255),
      institution VARCHAR(255),
      linkedin TEXT,
      interests JSON,
      visibility_settings JSON,
      last_active DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_mobile_users_registration_id FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('announcement','reminder','alert','workshop','speaker') DEFAULT 'announcement',
      target_audience ENUM('all','delegates','speakers','volunteers') DEFAULT 'all',
      deep_link TEXT,
      scheduled_at DATETIME NULL,
      sent_at DATETIME NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_app_notifications_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      session_id INT NOT NULL,
      reminder_enabled BOOLEAN DEFAULT TRUE,
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_saved_session (user_id, session_id),
      CONSTRAINT fk_saved_sessions_user_id FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
      CONSTRAINT fk_saved_sessions_session_id FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_speakers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      speaker_id INT NOT NULL,
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_saved_speaker (user_id, speaker_id),
      CONSTRAINT fk_saved_speakers_user_id FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE,
      CONSTRAINT fk_saved_speakers_speaker_id FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS device_tokens (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      platform ENUM('android','ios','web') DEFAULT 'web',
      device_token TEXT NOT NULL,
      token_hash VARCHAR(128) NOT NULL,
      last_seen DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_device_token_hash (token_hash),
      CONSTRAINT fk_device_tokens_user_id FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_activity_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NULL,
      activity_type ENUM('viewed_session','saved_session','bookmarked_speaker','checked_in','downloaded_resource','opened_notification','registered_workshop','viewed_speaker') NOT NULL,
      record_type VARCHAR(120) NULL,
      record_id VARCHAR(120) NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_app_activity_logs_user_id FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_notification_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      notification_id INT NULL,
      user_id INT NULL,
      device_token_id INT NULL,
      status ENUM('queued','sent','failed','opened') DEFAULT 'queued',
      error_message TEXT,
      sent_at DATETIME NULL,
      opened_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_push_logs_notification_id FOREIGN KEY (notification_id) REFERENCES app_notifications(id) ON DELETE SET NULL,
      CONSTRAINT fk_push_logs_user_id FOREIGN KEY (user_id) REFERENCES mobile_users(id) ON DELETE SET NULL,
      CONSTRAINT fk_push_logs_device_token_id FOREIGN KEY (device_token_id) REFERENCES device_tokens(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mobile_app_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(120) NOT NULL UNIQUE,
      setting_value JSON,
      updated_by INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_mobile_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
};

const createCoreArchitectureTables = async () => {
  await addColumnIfMissing('events', 'name', 'VARCHAR(255) NULL');
  await addColumnIfMissing('events', 'year', 'INT NULL');
  await addColumnIfMissing('events', 'start_date', 'DATE NULL');
  await addColumnIfMissing('events', 'end_date', 'DATE NULL');
  await addColumnIfMissing('events', 'venue', 'VARCHAR(255) NULL');
  await addColumnIfMissing('events', 'parent_event_id', 'INT NULL');
  await pool.query('UPDATE events SET name = COALESCE(name, title), start_date = COALESCE(start_date, DATE(start_datetime)), end_date = COALESCE(end_date, DATE(end_datetime))');

  const eventScopedTables = [
    'registrations',
    'payments',
    'speakers',
    'sessions',
    'workshops',
    'abstracts',
    'sponsors',
    'certificates',
    'forms',
    'volunteers',
    'announcements',
    'media_assets',
  ];
  for (const table of eventScopedTables) {
    if (await tableExists(table)) {
      await addColumnIfMissing(table, 'event_id', 'INT NULL');
    }
  }

  const p0EventScopedTables = [
    'registrations',
    'payments',
    'speakers',
    'sessions',
    'workshops',
    'certificates',
    'sponsors',
  ];
  const [[defaultEvent]] = await pool.query(`
    SELECT id
    FROM events
    ORDER BY
      CASE WHEN status = 'published' THEN 0 ELSE 1 END,
      COALESCE(start_datetime, start_date) DESC,
      created_at DESC
    LIMIT 1
  `);
  for (const table of p0EventScopedTables) {
    if (await tableExists(table)) {
      await addColumnIfMissing(table, 'event_id', 'INT NULL');
      await addIndexIfMissing(table, `idx_${table}_event_id`, `INDEX idx_${table}_event_id (event_id)`);
      if (defaultEvent?.id) {
        await pool.query(`UPDATE ${table} SET event_id = ? WHERE event_id IS NULL`, [defaultEvent.id]);
      }
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS files (
      id INT PRIMARY KEY AUTO_INCREMENT,
      module VARCHAR(120) NOT NULL,
      entity_type VARCHAR(120),
      entity_id VARCHAR(120),
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(120),
      cloudinary_public_id VARCHAR(255),
      file_url TEXT NOT NULL,
      uploaded_by INT NULL,
      event_id INT NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL UNIQUE,
      slug VARCHAR(140) NOT NULL UNIQUE,
      color VARCHAR(40),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS taggings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tag_id INT NOT NULL,
      module VARCHAR(120) NOT NULL,
      entity_type VARCHAR(120) NOT NULL,
      entity_id VARCHAR(120) NOT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_tagging (tag_id, module, entity_type, entity_id),
      CONSTRAINT fk_taggings_tag_id FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      CONSTRAINT fk_taggings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      module VARCHAR(120) NOT NULL,
      entity_type VARCHAR(120) NOT NULL,
      entity_id VARCHAR(120) NOT NULL,
      user_id INT NULL,
      comment TEXT NOT NULL,
      visibility ENUM('internal','public') DEFAULT 'internal',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to INT NULL,
      department VARCHAR(160),
      module VARCHAR(120),
      entity_type VARCHAR(120),
      entity_id VARCHAR(120),
      event_id INT NULL,
      status ENUM('pending','in_progress','completed','blocked','cancelled') DEFAULT 'pending',
      priority ENUM('low','medium','high','critical') DEFAULT 'medium',
      due_date DATETIME NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS approval_requests (
      id INT PRIMARY KEY AUTO_INCREMENT,
      module VARCHAR(120) NOT NULL,
      record_id VARCHAR(120) NOT NULL,
      requested_by INT NULL,
      assigned_to INT NULL,
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      before_state JSON,
      after_state JSON,
      decision_notes TEXT,
      decided_at DATETIME NULL,
      event_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_approvals_requested_by FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
      CONSTRAINT fk_approvals_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(160) NOT NULL UNIQUE,
      setting_value JSON,
      scope VARCHAR(120) DEFAULT 'global',
      event_id INT NULL,
      updated_by INT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_core_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_events (
      id INT PRIMARY KEY AUTO_INCREMENT,
      notification_id INT NULL,
      source_module VARCHAR(120),
      recipient_id INT NULL,
      title VARCHAR(255),
      message TEXT,
      channel ENUM('email','sms','push','in_app') DEFAULT 'in_app',
      status ENUM('queued','sent','failed') DEFAULT 'queued',
      error_message TEXT,
      sent_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_notification_events_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await addColumnIfMissing('notifications', 'recipient_id', 'INT NULL');
  await addColumnIfMissing('notifications', 'channel', "ENUM('email','sms','push','in_app') DEFAULT 'in_app'");
  await addColumnIfMissing('notifications', 'status', "ENUM('queued','sent','failed') DEFAULT 'queued'");
  await addColumnIfMissing('notifications', 'module', 'VARCHAR(120) NULL');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS core_search_sources (
      id INT PRIMARY KEY AUTO_INCREMENT,
      module VARCHAR(120) NOT NULL UNIQUE,
      table_name VARCHAR(120) NOT NULL,
      title_column VARCHAR(120) NOT NULL,
      subtitle_column VARCHAR(120),
      route_template VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS report_definitions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      module VARCHAR(120),
      query_config JSON,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_report_definitions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dashboard_widgets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      widget_key VARCHAR(160) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      module VARCHAR(120),
      widget_type ENUM('stat','chart','table','activity','leaderboard') DEFAULT 'stat',
      config JSON,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS languages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(20) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      is_default BOOLEAN DEFAULT FALSE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS translations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      language_code VARCHAR(20) NOT NULL,
      translation_key VARCHAR(255) NOT NULL,
      translation_value TEXT,
      module VARCHAR(120),
      UNIQUE KEY uq_translation (language_code, translation_key)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS themes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      slug VARCHAR(140) NOT NULL UNIQUE,
      event_id INT NULL,
      mode ENUM('light','dark') DEFAULT 'light',
      primary_color VARCHAR(40),
      secondary_color VARCHAR(40),
      accent_color VARCHAR(40),
      config JSON,
      is_active BOOLEAN DEFAULT TRUE,
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

const seedCoreArchitectureData = async () => {
  const sources = [
    ['users', 'users', 'name', 'email', '/admin/users'],
    ['speakers', 'speakers', 'full_name', 'institution', '/admin/speakers'],
    ['sponsors', 'sponsors', 'company_name', 'email', '/admin/sponsors'],
    ['abstracts', 'abstracts', 'title', 'presenting_author', '/admin/abstracts'],
    ['workshops', 'workshops', 'title', 'faculty', '/admin/workshops'],
    ['registrations', 'registrations', 'full_name', 'email', '/admin/registrations'],
    ['announcements', 'announcements', 'title', 'status', '/admin/announcements'],
    ['certificates', 'certificates', 'certificate_id', 'recipient_name', '/admin/certificates'],
  ];
  for (const source of sources) {
    if (await tableExists(source[1])) {
      await pool.query(
        `INSERT INTO core_search_sources (module, table_name, title_column, subtitle_column, route_template)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           table_name = VALUES(table_name),
           title_column = VALUES(title_column),
           subtitle_column = VALUES(subtitle_column),
           route_template = VALUES(route_template),
           is_active = TRUE`,
        source
      );
    }
  }

  await pool.query(`
    UPDATE core_search_sources
    SET is_active = FALSE
    WHERE TRIM(COALESCE(table_name, '')) = ''
       OR TRIM(COALESCE(title_column, '')) = ''
  `);

  const languages = [
    ['en', 'English', true, true],
    ['hi', 'Hindi', true, false],
    ['mr', 'Marathi', true, false],
  ];
  for (const language of languages) {
    await pool.query(
      `INSERT INTO languages (code, name, is_active, is_default)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active)`,
      language
    );
  }

  await pool.query(
    `INSERT IGNORE INTO dashboard_widgets (widget_key, title, module, widget_type, config, display_order)
     VALUES
       ('global_activity', 'Global Activity', 'core', 'activity', JSON_OBJECT('source', 'activity_logs'), 10),
       ('pending_approvals', 'Pending Approvals', 'core', 'stat', JSON_OBJECT('source', 'approval_requests'), 20),
       ('open_tasks', 'Open Tasks', 'core', 'stat', JSON_OBJECT('source', 'tasks'), 30)`
  );
};

const seedAuthData = async () => {
  for (const role of roles) {
    await pool.query('INSERT IGNORE INTO roles (name) VALUES (?)', [role]);
  }

  for (const [key, description] of permissions) {
    await pool.query('INSERT IGNORE INTO permissions (`key`, description) VALUES (?, ?)', [key, description]);
  }

  for (const module of modules) {
    const [moduleKey, label, permissionKey, routeKey, icon, displayOrder, active] = module;
    await pool.query(
      `INSERT INTO modules (name, slug, description, module_key, label, permission_key, route_key, icon, display_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         slug = VALUES(slug),
         label = VALUES(label),
         permission_key = VALUES(permission_key),
         route_key = VALUES(route_key),
         icon = VALUES(icon),
         display_order = VALUES(display_order),
         active = VALUES(active)`,
      [label, moduleKey, null, moduleKey, label, permissionKey, routeKey, icon, displayOrder, active]
    );
  }

  await pool.query('UPDATE teams SET slug = LOWER(REPLACE(name, " ", "-")) WHERE slug IS NULL OR slug = ""');
  await pool.query('UPDATE modules SET name = label WHERE name IS NULL OR name = ""');
  await pool.query('UPDATE modules SET slug = module_key WHERE slug IS NULL OR slug = ""');

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
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set');
  }

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
  if (rows[0].count === 0) {
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
  }

  const [categoryRows] = await pool.query('SELECT COUNT(*) AS count FROM registration_categories');
  if (categoryRows[0].count === 0) {
    await pool.query(
      `INSERT INTO registration_categories (name, description, price, currency, capacity, is_active)
       SELECT name, description, price, currency, capacity, active FROM ticket_types`
    );
  }

  const methods = [
    ['Razorpay', 'razorpay'],
    ['Stripe', 'stripe'],
    ['Manual Bank Transfer', 'manual-bank-transfer'],
    ['UPI', 'upi'],
  ];
  for (const method of methods) {
    await pool.query('INSERT IGNORE INTO payment_methods (name, slug, is_active) VALUES (?, ?, TRUE)', method);
  }
};

const initializeDatabase = async () => {
  try {
    await createAuthTables();
    await createSpeakerTables();
    await createWorkshopTables();
    await createPartnerTables();
    await createMediaTables();
    await createSettingsTables();
    await createMarketingTables();
    await createLogisticsTables();
    await createVolunteerTables();
    await createResearchTables();
    await createRegistrationTables();
    await createPaymentTables();
    await createOperationsTables();
    await createFormTables();
    await createMobileTables();
    await createCoreArchitectureTables();
    await seedAuthData();
    await seedCoreArchitectureData();
    await seedSpeakers();
    await seedWorkshops();
    await seedResearch();
    await seedTickets();
    await seedCoupons();
    console.log('Auth, speaker, workshop, partner, media, settings, research, registration and payment schema ready; default data seeded');
  } catch (error) {
    console.warn(`Auth schema setup skipped: ${error.message}`);
  }
};

module.exports = {
  initializeDatabase,
  createAuthTables,
  createSpeakerTables,
  createWorkshopTables,
  createPartnerTables,
  createMediaTables,
  createSettingsTables,
  createMarketingTables,
  createLogisticsTables,
  createVolunteerTables,
  createResearchTables,
  createRegistrationTables,
  createPaymentTables,
  createOperationsTables,
  createFormTables,
  createMobileTables,
  createCoreArchitectureTables,
  seedCoreArchitectureData,
  seedAuthData,
  seedCoupons,
  seedSpeakers,
  seedWorkshops,
  seedResearch,
  seedTickets,
};
