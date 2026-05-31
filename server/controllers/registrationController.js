const Registration = require('../models/registrationModel');
const { sendMail } = require('../services/mailService');
const asyncHandler = require('../utils/asyncHandler');

const validRegistrationStatuses = ['pending', 'approved', 'rejected'];

const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const generateQrSvg = (registrationId) => {
  const cells = Array.from({ length: 121 }, (_, index) => {
    const x = index % 11;
    const y = Math.floor(index / 11);
    const char = registrationId.charCodeAt(index % registrationId.length);
    const filled = (char + x * 7 + y * 13 + index) % 3 !== 0;
    return filled ? `<rect x="${x * 8}" y="${y * 8}" width="7" height="7" rx="1"/>` : '';
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#fff"/><g fill="#081B33" transform="translate(16 16)">${cells}</g><text x="60" y="112" text-anchor="middle" font-size="8" font-family="Arial" fill="#081B33">${registrationId}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

const validateRegistration = (payload) => {
  if (!payload.fullName?.trim()) return 'Full name is required';
  if (!payload.email?.trim()) return 'Email is required';
  if (!payload.ticketTypeId) return 'Ticket type is required';
  return null;
};

const validateTicket = (payload) => {
  if (!payload.name?.trim()) return 'Ticket name is required';
  if (Number(payload.price || 0) < 0) return 'Ticket price cannot be negative';
  if (Number(payload.capacity || 0) < 0) return 'Ticket capacity cannot be negative';
  if (payload.remaining !== undefined && Number(payload.remaining || 0) < 0) return 'Remaining capacity cannot be negative';
  if (payload.remaining !== undefined && Number(payload.remaining || 0) > Number(payload.capacity || 0)) {
    return 'Remaining capacity cannot exceed total capacity';
  }
  return null;
};

const listRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.listRegistrations({
    limit: req.query.limit || 50,
    offset: req.query.offset || 0,
  });
  const stats = await Registration.stats();
  res.json({ registrations, stats });
});

const getRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findRegistrationById(req.params.id);
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  return res.json({ registration });
});

const createRegistration = asyncHandler(async (req, res) => {
  const payload = {
    fullName: req.body.fullName || req.body.full_name,
    email: req.body.email,
    phone: req.body.phone,
    institution: req.body.institution,
    country: req.body.country,
    city: req.body.city,
    designation: req.body.designation,
    ticketTypeId: req.body.ticketTypeId || req.body.ticket_type_id,
  };

  const error = validateRegistration(payload);
  if (error) return res.status(400).json({ message: error });

  const registration = await Registration.createRegistration(payload, generateQrSvg);
  if (process.env.SMTP_HOST) {
    sendMail({
      to: registration.email,
      subject: 'GHC 2026 registration received',
      text: `Your registration ${registration.registrationId} has been received. Please complete payment to confirm your pass.`,
      html: `<p>Dear ${registration.fullName},</p><p>Your GHC 2026 registration has been received.</p><p><strong>Registration ID:</strong> ${registration.registrationId}</p><p>Please complete payment to confirm your pass.</p>`,
    }).catch(() => {});
  }
  return res.status(201).json({ registration });
});

const updateRegistrationStatus = asyncHandler(async (req, res) => {
  if (!validRegistrationStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: 'Invalid registration status' });
  }

  const registration = await Registration.setStatus(req.params.id, req.body.status);
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  return res.json({ registration });
});

const checkInRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.checkIn(req.params.id, req.body.attendance === undefined ? true : toBoolean(req.body.attendance));
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  return res.json({ registration });
});

const listTickets = asyncHandler(async (_req, res) => {
  const tickets = await Registration.listTickets();
  res.json({ tickets });
});

const listAdminTickets = asyncHandler(async (_req, res) => {
  const tickets = await Registration.listTickets({ includeInactive: true });
  res.json({ tickets });
});

const createTicket = asyncHandler(async (req, res) => {
  const validationError = validateTicket(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  const ticket = await Registration.createTicket(req.body);
  return res.status(201).json({ ticket });
});

const updateTicket = asyncHandler(async (req, res) => {
  const existing = await Registration.findTicketById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Ticket not found' });

  const payload = { ...existing, ...req.body };
  const validationError = validateTicket(payload);
  if (validationError) return res.status(400).json({ message: validationError });

  const ticket = await Registration.updateTicket(req.params.id, payload);
  return res.json({ ticket });
});

const deleteTicket = asyncHandler(async (req, res) => {
  const deleted = await Registration.deleteTicket(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Ticket not found' });
  return res.json({ message: 'Ticket deleted' });
});

const exportRegistrationsCsv = asyncHandler(async (_req, res) => {
  const registrations = await Registration.listRegistrations({ limit: 10000, offset: 0 });
  const header = ['registration_id', 'full_name', 'email', 'phone', 'institution', 'ticket', 'status', 'payment_status', 'attendance'];
  const rows = registrations.map((item) => [
    item.registrationId,
    item.fullName,
    item.email,
    item.phone,
    item.institution,
    item.ticketName,
    item.registrationStatus,
    item.paymentStatus,
    item.attendance ? 'yes' : 'no',
  ]);

  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ghc-registrations.csv"');
  res.send(csv);
});

const exportRegistrationsExcel = asyncHandler(async (_req, res) => {
  const registrations = await Registration.listRegistrations({ limit: 10000, offset: 0 });
  const rows = registrations.map((item) => `
    <tr>
      <td>${item.registrationId || ''}</td>
      <td>${item.fullName || ''}</td>
      <td>${item.email || ''}</td>
      <td>${item.phone || ''}</td>
      <td>${item.institution || ''}</td>
      <td>${item.ticketName || ''}</td>
      <td>${item.registrationStatus || ''}</td>
      <td>${item.paymentStatus || ''}</td>
      <td>${item.attendance ? 'yes' : 'no'}</td>
    </tr>
  `).join('');

  const workbook = `
    <html>
      <body>
        <table>
          <thead><tr><th>Registration ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Institution</th><th>Ticket</th><th>Status</th><th>Payment</th><th>Attendance</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.setHeader('Content-Disposition', 'attachment; filename="ghc-registrations.xls"');
  res.send(workbook);
});

module.exports = {
  checkInRegistration,
  createRegistration,
  createTicket,
  exportRegistrationsExcel,
  exportRegistrationsCsv,
  getRegistration,
  deleteTicket,
  listAdminTickets,
  listRegistrations,
  listTickets,
  updateTicket,
  updateRegistrationStatus,
};
