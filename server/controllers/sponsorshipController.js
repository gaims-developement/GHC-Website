const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const cloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET);

const number = (value) => Number(value || 0);
const bool = (value) => value === true || value === 'true' || value === '1' || value === 1;
const clean = (value) => (value === undefined || value === null || value === '' ? null : value);
const money = (value) => Number(value || 0);

const statusMap = {
  lead: 'lead',
  prospect: 'prospect',
  contacted: 'contacted',
  proposal: 'proposal_sent',
  proposal_sent: 'proposal_sent',
  negotiating: 'negotiating',
  negotiation: 'negotiating',
  confirmed: 'confirmed',
  payment_pending: 'payment_pending',
  completed: 'completed',
  cancelled: 'cancelled',
};

const uploadFile = async (file, folder) => {
  if (!file) return null;
  if (!cloudinaryConfigured()) return `/uploads/sponsors/${file.filename}`;
  const result = await uploadToCloudinary(file.path, folder, { resourceType: 'auto' });
  return result.secure_url;
};

const log = (req, action, module, recordId, metadata) =>
  ActivityLog.logActivity({ userId: req.user?.id, action, module, recordId: String(recordId || ''), metadata });

const sponsorSelect = `
  SELECT sponsors.*, sponsor_tiers.name AS tier_name,
    COALESCE(deliverable_counts.total_deliverables, 0) AS total_deliverables,
    COALESCE(deliverable_counts.completed_deliverables, 0) AS completed_deliverables,
    GROUP_CONCAT(DISTINCT exhibitor_stalls.stall_number ORDER BY exhibitor_stalls.stall_number SEPARATOR ', ') AS stalls
  FROM sponsors
  LEFT JOIN sponsor_tiers ON sponsor_tiers.id = sponsors.tier_id
  LEFT JOIN (
    SELECT sponsor_id, COUNT(*) AS total_deliverables, SUM(status = 'completed') AS completed_deliverables
    FROM sponsor_deliverables
    GROUP BY sponsor_id
  ) deliverable_counts ON deliverable_counts.sponsor_id = sponsors.id
  LEFT JOIN stall_allocations ON stall_allocations.sponsor_id = sponsors.id
  LEFT JOIN exhibitor_stalls ON exhibitor_stalls.id = stall_allocations.stall_id
`;

const normalizeSponsor = (row) => row && ({
  id: row.id,
  companyName: row.company_name,
  tierId: row.tier_id,
  tierName: row.tier_name,
  contactPerson: row.contact_person,
  designation: row.designation,
  email: row.email,
  phone: row.phone,
  website: row.website,
  linkedin: row.linkedin,
  country: row.country,
  city: row.city,
  companyDescription: row.company_description,
  logoUrl: row.logo_url,
  bannerUrl: row.banner_url,
  status: row.status,
  contractValue: number(row.contract_value),
  amountReceived: number(row.amount_received),
  paymentStatus: row.payment_status,
  notes: row.notes,
  isActive: Boolean(row.is_active),
  totalDeliverables: number(row.total_deliverables),
  completedDeliverables: number(row.completed_deliverables),
  deliverableCompletion: row.total_deliverables ? Math.round((number(row.completed_deliverables) / number(row.total_deliverables)) * 100) : 0,
  stalls: row.stalls ? row.stalls.split(', ') : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listSponsors = asyncHandler(async (req, res) => {
  const clauses = ['sponsors.is_active = TRUE'];
  const params = [];
  if (req.query.includeInactive === '1') clauses.length = 0;
  if (req.query.status && req.query.status !== 'all') {
    clauses.push('sponsors.status = ?');
    params.push(statusMap[req.query.status] || req.query.status);
  }
  if (req.query.tierId) {
    clauses.push('sponsors.tier_id = ?');
    params.push(req.query.tierId);
  }
  if (req.query.search) {
    clauses.push('(sponsors.company_name LIKE ? OR sponsors.contact_person LIKE ? OR sponsors.email LIKE ?)');
    const term = `%${req.query.search}%`;
    params.push(term, term, term);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `${sponsorSelect} ${where} GROUP BY sponsors.id ORDER BY sponsors.updated_at DESC`,
    params
  );
  res.json({ sponsors: rows.map(normalizeSponsor) });
});

const getSponsor = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${sponsorSelect} WHERE sponsors.id = ? GROUP BY sponsors.id LIMIT 1`, [req.params.id]);
  const sponsor = normalizeSponsor(rows[0]);
  if (!sponsor) return res.status(404).json({ message: 'Sponsor not found' });

  const [[contacts], [deliverables], [contracts], [invoices], [stalls], [communications]] = await Promise.all([
    pool.query('SELECT * FROM sponsor_contacts WHERE sponsor_id = ? ORDER BY id DESC', [req.params.id]),
    pool.query(`
      SELECT sponsor_deliverables.id, sponsor_deliverables.status, sponsor_deliverables.completed_at,
             deliverables.id AS deliverable_id, deliverables.name, deliverables.category, deliverables.description
      FROM sponsor_deliverables
      INNER JOIN deliverables ON deliverables.id = sponsor_deliverables.deliverable_id
      WHERE sponsor_deliverables.sponsor_id = ?
      ORDER BY deliverables.category ASC, deliverables.name ASC
    `, [req.params.id]),
    pool.query('SELECT * FROM contracts WHERE sponsor_id = ? ORDER BY created_at DESC', [req.params.id]),
    pool.query('SELECT * FROM invoices WHERE sponsor_id = ? ORDER BY issue_date DESC, id DESC', [req.params.id]),
    pool.query(`
      SELECT stall_allocations.id, stall_allocations.allocated_at, exhibitor_stalls.*
      FROM stall_allocations
      INNER JOIN exhibitor_stalls ON exhibitor_stalls.id = stall_allocations.stall_id
      WHERE stall_allocations.sponsor_id = ?
    `, [req.params.id]),
    pool.query('SELECT * FROM sponsor_communications WHERE sponsor_id = ? ORDER BY created_at DESC', [req.params.id]),
  ]);

  res.json({ sponsor: { ...sponsor, contacts, deliverables, contracts, invoices, stalls, communications } });
});

const saveSponsor = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const files = req.files || {};
  const logoUrl = await uploadFile(files.logo?.[0], 'sponsors');
  const bannerUrl = await uploadFile(files.banner?.[0], 'sponsors');
  const payload = {
    companyName: req.body.companyName || req.body.company_name,
    tierId: clean(req.body.tierId || req.body.tier_id),
    contactPerson: clean(req.body.contactPerson || req.body.contact_person),
    designation: clean(req.body.designation),
    email: clean(req.body.email),
    phone: clean(req.body.phone),
    website: clean(req.body.website),
    linkedin: clean(req.body.linkedin),
    country: clean(req.body.country),
    city: clean(req.body.city),
    companyDescription: clean(req.body.companyDescription || req.body.company_description),
    logoUrl: logoUrl || clean(req.body.logoUrl || req.body.logo_url),
    bannerUrl: bannerUrl || clean(req.body.bannerUrl || req.body.banner_url),
    status: statusMap[req.body.status] || req.body.status || 'prospect',
    contractValue: money(req.body.contractValue || req.body.contract_value),
    amountReceived: money(req.body.amountReceived || req.body.amount_received),
    paymentStatus: req.body.paymentStatus || req.body.payment_status || 'pending',
    notes: clean(req.body.notes),
    isActive: req.body.isActive === undefined ? true : bool(req.body.isActive),
  };

  if (!payload.companyName?.trim()) return res.status(400).json({ message: 'Company name is required' });

  if (id) {
    await pool.query(
      `UPDATE sponsors SET company_name = ?, tier_id = ?, contact_person = ?, designation = ?, email = ?, phone = ?,
       website = ?, linkedin = ?, country = ?, city = ?, company_description = ?, logo_url = COALESCE(?, logo_url),
       banner_url = COALESCE(?, banner_url), status = ?, contract_value = ?, amount_received = ?, payment_status = ?,
       notes = ?, is_active = ? WHERE id = ?`,
      [payload.companyName.trim(), payload.tierId, payload.contactPerson, payload.designation, payload.email, payload.phone,
        payload.website, payload.linkedin, payload.country, payload.city, payload.companyDescription, payload.logoUrl,
        payload.bannerUrl, payload.status, payload.contractValue, payload.amountReceived, payload.paymentStatus,
        payload.notes, payload.isActive, id]
    );
    await log(req, 'updated_sponsor', 'sponsors', id, { status: payload.status, paymentStatus: payload.paymentStatus });
    return getSponsor(req, res);
  }

  const [result] = await pool.query(
    `INSERT INTO sponsors (company_name, tier_id, contact_person, designation, email, phone, website, linkedin,
     country, city, company_description, logo_url, banner_url, status, contract_value, amount_received, payment_status, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [payload.companyName.trim(), payload.tierId, payload.contactPerson, payload.designation, payload.email, payload.phone,
      payload.website, payload.linkedin, payload.country, payload.city, payload.companyDescription, payload.logoUrl,
      payload.bannerUrl, payload.status, payload.contractValue, payload.amountReceived, payload.paymentStatus, payload.notes, payload.isActive]
  );
  req.params.id = result.insertId;
  await log(req, 'created_sponsor', 'sponsors', result.insertId, { status: payload.status });
  return getSponsor(req, res);
});

const deleteSponsor = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM sponsors WHERE id = ?', [req.params.id]);
  await log(req, 'deleted_sponsor', 'sponsors', req.params.id);
  res.json({ success: true });
});

const archiveSponsor = asyncHandler(async (req, res) => {
  await pool.query('UPDATE sponsors SET is_active = FALSE WHERE id = ?', [req.params.id]);
  await log(req, 'archived_sponsor', 'sponsors', req.params.id);
  res.json({ success: true });
});

const dashboard = asyncHandler(async (_req, res) => {
  const [[totals], [activity]] = await Promise.all([
    pool.query(`
      SELECT COUNT(*) AS totalSponsors,
        SUM(status IN ('confirmed', 'payment_pending', 'completed')) AS confirmedSponsors,
        SUM(status IN ('prospect', 'lead', 'contacted', 'proposal_sent', 'negotiating')) AS pendingSponsors,
        SUM(contract_value) AS revenue,
        SUM(GREATEST(contract_value - amount_received, 0)) AS outstanding,
        SUM(status IN ('confirmed', 'payment_pending', 'completed') AND EXISTS (
          SELECT 1 FROM stall_allocations WHERE stall_allocations.sponsor_id = sponsors.id
        )) AS exhibitorsConfirmed,
        (SELECT COUNT(*) FROM contracts WHERE signed = FALSE) AS contractsPending,
        (SELECT COUNT(*) FROM sponsor_deliverables WHERE status != 'completed') AS deliverablesPending
      FROM sponsors
      WHERE is_active = TRUE
    `),
    pool.query(`
      SELECT activity_logs.*, users.name AS user_name
      FROM activity_logs
      LEFT JOIN users ON users.id = activity_logs.user_id
      WHERE activity_logs.module IN ('sponsors', 'sponsor_tiers', 'deliverables', 'contracts', 'invoices', 'stalls')
      ORDER BY activity_logs.timestamp DESC
      LIMIT 12
    `),
  ]);
  res.json({ metrics: totals[0], recentActivity: activity });
});

const listTiers = asyncHandler(async (_req, res) => {
  const [tiers] = await pool.query('SELECT * FROM sponsor_tiers ORDER BY priority_order ASC, name ASC');
  res.json({ tiers });
});

const saveTier = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ message: 'Tier name is required' });
  const values = [req.body.name.trim(), clean(req.body.description), number(req.body.priorityOrder || req.body.priority_order), req.body.websiteVisibility === undefined ? true : bool(req.body.websiteVisibility), req.body.isActive === undefined ? true : bool(req.body.isActive)];
  if (req.params.id) {
    await pool.query('UPDATE sponsor_tiers SET name = ?, description = ?, priority_order = ?, website_visibility = ?, is_active = ? WHERE id = ?', [...values, req.params.id]);
    await log(req, 'updated_sponsor_tier', 'sponsor_tiers', req.params.id);
  } else {
    const [result] = await pool.query('INSERT INTO sponsor_tiers (name, description, priority_order, website_visibility, is_active) VALUES (?, ?, ?, ?, ?)', values);
    await log(req, 'created_sponsor_tier', 'sponsor_tiers', result.insertId);
  }
  const [tiers] = await pool.query('SELECT * FROM sponsor_tiers ORDER BY priority_order ASC, name ASC');
  res.json({ tiers });
});

const deleteTier = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM sponsor_tiers WHERE id = ?', [req.params.id]);
  await log(req, 'deleted_sponsor_tier', 'sponsor_tiers', req.params.id);
  res.json({ success: true });
});

const listDeliverables = asyncHandler(async (_req, res) => {
  const [deliverables] = await pool.query('SELECT * FROM deliverables ORDER BY category ASC, name ASC');
  res.json({ deliverables });
});

const saveDeliverable = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ message: 'Deliverable name is required' });
  const values = [req.body.name.trim(), clean(req.body.description), req.body.category || 'website', req.body.isActive === undefined ? true : bool(req.body.isActive)];
  if (req.params.id) {
    await pool.query('UPDATE deliverables SET name = ?, description = ?, category = ?, is_active = ? WHERE id = ?', [...values, req.params.id]);
    await log(req, 'updated_deliverable', 'deliverables', req.params.id);
  } else {
    const [result] = await pool.query('INSERT INTO deliverables (name, description, category, is_active) VALUES (?, ?, ?, ?)', values);
    await log(req, 'created_deliverable', 'deliverables', result.insertId);
  }
  const [deliverables] = await pool.query('SELECT * FROM deliverables ORDER BY category ASC, name ASC');
  res.json({ deliverables });
});

const assignDeliverable = asyncHandler(async (req, res) => {
  await pool.query(
    `INSERT INTO sponsor_deliverables (sponsor_id, deliverable_id, status)
     VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), completed_at = IF(VALUES(status) = 'completed', CURRENT_TIMESTAMP, completed_at)`,
    [req.params.id, req.body.deliverableId, req.body.status || 'pending']
  );
  await log(req, 'assigned_deliverable', 'deliverables', req.body.deliverableId, { sponsorId: req.params.id });
  res.json({ success: true });
});

const updateSponsorDeliverable = asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE sponsor_deliverables SET status = ?, completed_at = IF(? = "completed", CURRENT_TIMESTAMP, NULL) WHERE id = ?',
    [req.body.status || 'pending', req.body.status || 'pending', req.params.deliverableId]
  );
  await log(req, 'updated_sponsor_deliverable', 'deliverables', req.params.deliverableId);
  res.json({ success: true });
});

const listStalls = asyncHandler(async (_req, res) => {
  const [stalls] = await pool.query(`
    SELECT exhibitor_stalls.*, sponsors.id AS sponsor_id, sponsors.company_name
    FROM exhibitor_stalls
    LEFT JOIN stall_allocations ON stall_allocations.stall_id = exhibitor_stalls.id
    LEFT JOIN sponsors ON sponsors.id = stall_allocations.sponsor_id
    ORDER BY exhibitor_stalls.stall_number ASC
  `);
  res.json({ stalls });
});

const saveStall = asyncHandler(async (req, res) => {
  if (!req.body.stallNumber && !req.body.stall_number) return res.status(400).json({ message: 'Stall number is required' });
  const values = [req.body.stallNumber || req.body.stall_number, clean(req.body.location), clean(req.body.size), req.body.status || 'available'];
  if (req.params.id) {
    await pool.query('UPDATE exhibitor_stalls SET stall_number = ?, location = ?, size = ?, status = ? WHERE id = ?', [...values, req.params.id]);
    await log(req, 'updated_stall', 'stalls', req.params.id);
  } else {
    const [result] = await pool.query('INSERT INTO exhibitor_stalls (stall_number, location, size, status) VALUES (?, ?, ?, ?)', values);
    await log(req, 'created_stall', 'stalls', result.insertId);
  }
  const [stalls] = await pool.query('SELECT * FROM exhibitor_stalls ORDER BY stall_number ASC');
  res.json({ stalls });
});

const allocateStall = asyncHandler(async (req, res) => {
  await pool.query(
    `INSERT INTO stall_allocations (stall_id, sponsor_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE sponsor_id = VALUES(sponsor_id), allocated_at = CURRENT_TIMESTAMP`,
    [req.params.id, req.body.sponsorId]
  );
  await pool.query('UPDATE exhibitor_stalls SET status = ? WHERE id = ?', [req.body.status || 'reserved', req.params.id]);
  await log(req, 'allocated_stall', 'stalls', req.params.id, { sponsorId: req.body.sponsorId });
  res.json({ success: true });
});

const listExhibitors = asyncHandler(async (_req, res) => {
  const [exhibitors] = await pool.query(`
    SELECT sponsors.id, sponsors.company_name, sponsors.status, sponsor_tiers.name AS tier_name,
           GROUP_CONCAT(exhibitor_stalls.stall_number ORDER BY exhibitor_stalls.stall_number SEPARATOR ', ') AS stalls
    FROM sponsors
    INNER JOIN stall_allocations ON stall_allocations.sponsor_id = sponsors.id
    INNER JOIN exhibitor_stalls ON exhibitor_stalls.id = stall_allocations.stall_id
    LEFT JOIN sponsor_tiers ON sponsor_tiers.id = sponsors.tier_id
    GROUP BY sponsors.id
    ORDER BY sponsors.company_name ASC
  `);
  res.json({ exhibitors });
});

const listContracts = asyncHandler(async (_req, res) => {
  const [contracts] = await pool.query('SELECT contracts.*, sponsors.company_name FROM contracts INNER JOIN sponsors ON sponsors.id = contracts.sponsor_id ORDER BY contracts.created_at DESC');
  res.json({ contracts });
});

const saveContract = asyncHandler(async (req, res) => {
  const fileUrl = await uploadFile(req.file, 'sponsors/contracts');
  const values = [req.body.sponsorId, req.body.contractName || req.body.contract_name, fileUrl || clean(req.body.fileUrl), bool(req.body.signed), clean(req.body.signedDate)];
  if (!values[0] || !values[1]) return res.status(400).json({ message: 'Sponsor and contract name are required' });
  if (req.params.id) {
    await pool.query('UPDATE contracts SET sponsor_id = ?, contract_name = ?, file_url = COALESCE(?, file_url), signed = ?, signed_date = ? WHERE id = ?', [...values, req.params.id]);
    await log(req, 'updated_contract', 'contracts', req.params.id);
  } else {
    const [result] = await pool.query('INSERT INTO contracts (sponsor_id, contract_name, file_url, signed, signed_date) VALUES (?, ?, ?, ?, ?)', values);
    await log(req, 'uploaded_contract', 'contracts', result.insertId);
  }
  const [contracts] = await pool.query('SELECT contracts.*, sponsors.company_name FROM contracts INNER JOIN sponsors ON sponsors.id = contracts.sponsor_id ORDER BY contracts.created_at DESC');
  res.json({ contracts });
});

const listInvoices = asyncHandler(async (_req, res) => {
  const [invoices] = await pool.query('SELECT invoices.*, sponsors.company_name FROM invoices INNER JOIN sponsors ON sponsors.id = invoices.sponsor_id ORDER BY invoices.issue_date DESC, invoices.id DESC');
  res.json({ invoices });
});

const saveInvoice = asyncHandler(async (req, res) => {
  const fileUrl = await uploadFile(req.file, 'sponsors/invoices');
  const values = [req.body.sponsorId, req.body.invoiceNumber || req.body.invoice_number, money(req.body.amount), money(req.body.tax), req.body.status || 'pending', clean(req.body.issueDate), clean(req.body.dueDate), fileUrl || clean(req.body.invoicePdf)];
  if (!values[0] || !values[1]) return res.status(400).json({ message: 'Sponsor and invoice number are required' });
  if (req.params.id) {
    await pool.query('UPDATE invoices SET sponsor_id = ?, invoice_number = ?, amount = ?, tax = ?, status = ?, issue_date = ?, due_date = ?, invoice_pdf = COALESCE(?, invoice_pdf) WHERE id = ?', [...values, req.params.id]);
    await log(req, 'updated_invoice', 'invoices', req.params.id, { status: values[4] });
  } else {
    const [result] = await pool.query('INSERT INTO invoices (sponsor_id, invoice_number, amount, tax, status, issue_date, due_date, invoice_pdf) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', values);
    await log(req, 'created_invoice', 'invoices', result.insertId, { status: values[4] });
  }
  const [invoices] = await pool.query('SELECT invoices.*, sponsors.company_name FROM invoices INNER JOIN sponsors ON sponsors.id = invoices.sponsor_id ORDER BY invoices.issue_date DESC, invoices.id DESC');
  res.json({ invoices });
});

const listCommunications = asyncHandler(async (req, res) => {
  const [communications] = await pool.query('SELECT * FROM sponsor_communications WHERE sponsor_id = ? ORDER BY created_at DESC', [req.params.id]);
  res.json({ communications });
});

const saveCommunication = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'INSERT INTO sponsor_communications (sponsor_id, type, subject, notes, created_by) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, req.body.type || 'note', clean(req.body.subject), clean(req.body.notes), req.user?.id || null]
  );
  await log(req, 'logged_sponsor_communication', 'sponsors', req.params.id, { communicationId: result.insertId, type: req.body.type || 'note' });
  res.json({ success: true });
});

const reports = asyncHandler(async (_req, res) => {
  const [[byStatus], [revenueByTier], [trends], [deliverables], [occupancy]] = await Promise.all([
    pool.query('SELECT status, COUNT(*) AS total FROM sponsors GROUP BY status ORDER BY total DESC'),
    pool.query(`
      SELECT COALESCE(sponsor_tiers.name, 'Unassigned') AS tier, SUM(contract_value) AS contractValue, SUM(amount_received) AS received
      FROM sponsors
      LEFT JOIN sponsor_tiers ON sponsor_tiers.id = sponsors.tier_id
      GROUP BY tier
      ORDER BY contractValue DESC
    `),
    pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS sponsors, SUM(contract_value) AS revenue
      FROM sponsors
      GROUP BY month
      ORDER BY month ASC
    `),
    pool.query('SELECT status, COUNT(*) AS total FROM sponsor_deliverables GROUP BY status'),
    pool.query('SELECT status, COUNT(*) AS total FROM exhibitor_stalls GROUP BY status'),
  ]);
  res.json({ byStatus, revenueByTier, trends, deliverables, occupancy });
});

module.exports = {
  allocateStall,
  archiveSponsor,
  assignDeliverable,
  dashboard,
  deleteSponsor,
  deleteTier,
  getSponsor,
  listCommunications,
  listContracts,
  listDeliverables,
  listExhibitors,
  listInvoices,
  listSponsors,
  listStalls,
  listTiers,
  reports,
  saveCommunication,
  saveContract,
  saveDeliverable,
  saveInvoice,
  saveSponsor,
  saveStall,
  saveTier,
  updateSponsorDeliverable,
};
