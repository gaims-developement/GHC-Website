const Workshop = require('../models/workshopModel');
const templates = require('../services/emailTemplates');
const { sendMail } = require('../services/mailService');
const asyncHandler = require('../utils/asyncHandler');

const validStatuses = ['draft', 'published', 'closed'];

const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const toDateValue = (value) => {
  if (!value) return null;
  return String(value).replace('T', ' ').slice(0, 19);
};

const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const parseFaq = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

const sanitizePayload = (body, file) => ({
  title: body.title?.trim(),
  slug: (body.slug?.trim() || slugify(body.title)),
  faculty: body.faculty?.trim(),
  description: body.description?.trim(),
  workshopType: body.workshopType || body.workshop_type,
  requirements: body.requirements?.trim(),
  learningOutcomes: body.learningOutcomes || body.learning_outcomes,
  whoShouldAttend: body.whoShouldAttend || body.who_should_attend,
  faq: parseFaq(body.faq),
  prerequisites: body.prerequisites?.trim(),
  capacity: body.capacity ?? 0,
  registeredCount: body.registeredCount ?? body.registered_count ?? 0,
  duration: body.duration?.trim(),
  venue: body.venue?.trim(),
  date: toDateValue(body.date),
  price: body.price ?? 0,
  imageUrl: file ? `/uploads/workshops/${file.filename}` : body.imageUrl || body.image_url,
  featured: toBoolean(body.featured),
  status: body.status || 'draft',
  displayOrder: body.displayOrder ?? body.display_order ?? 0,
});

const validate = (payload) => {
  if (!payload.title) return 'Title is required';
  if (!validStatuses.includes(payload.status)) return 'Invalid status';
  if (Number(payload.capacity) < 0) return 'Capacity cannot be negative';
  if (Number(payload.registeredCount) < 0) return 'Registered count cannot be negative';
  if (Number(payload.registeredCount) > Number(payload.capacity || 0)) return 'Registered count cannot exceed capacity';
  return null;
};

const listWorkshops = asyncHandler(async (req, res) => {
  const includeDrafts = req.query.admin === '1' && ['SUPER_ADMIN', 'ADMIN', 'MEDIA', 'RESEARCH'].includes(req.user?.role);
  const workshops = await Workshop.list({ includeDrafts });
  res.json({ workshops });
});

const getWorkshop = asyncHandler(async (req, res) => {
  const workshop = await Workshop.findBySlug(req.params.slug || req.params.id);
  if (!workshop) return res.status(404).json({ message: 'Workshop not found' });
  return res.json({ workshop });
});

const createWorkshop = asyncHandler(async (req, res) => {
  const payload = sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const workshop = await Workshop.create(payload);
  return res.status(201).json({ workshop });
});

const updateWorkshop = asyncHandler(async (req, res) => {
  const existing = await Workshop.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Workshop not found' });

  const payload = sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const workshop = await Workshop.update(req.params.id, payload);
  return res.json({ workshop });
});

const deleteWorkshop = asyncHandler(async (req, res) => {
  const deleted = await Workshop.remove(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Workshop not found' });
  return res.json({ success: true });
});

const publishWorkshop = asyncHandler(async (req, res) => {
  const workshop = await Workshop.publish(req.params.id);
  if (!workshop) return res.status(404).json({ message: 'Workshop not found' });
  return res.json({ workshop });
});

const closeWorkshop = asyncHandler(async (req, res) => {
  const workshop = await Workshop.close(req.params.id);
  if (!workshop) return res.status(404).json({ message: 'Workshop not found' });
  return res.json({ workshop });
});

const reorderWorkshops = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.items)) {
    return res.status(400).json({ message: 'items array is required' });
  }

  await Workshop.reorder(req.body.items);
  return res.json({ success: true });
});

const workshopStats = asyncHandler(async (_req, res) => {
  const stats = await Workshop.stats();
  return res.json({ stats });
});

const confirmWorkshopRegistration = asyncHandler(async (req, res) => {
  const workshop = await Workshop.findById(req.params.id);
  if (!workshop) return res.status(404).json({ message: 'Workshop not found' });

  const registrationId = await Workshop.createRegistration({
    workshopId: req.params.id,
    registrationId: req.body.registration_id || req.body.registrationId || null,
    paymentId: req.body.payment_id || req.body.paymentId || null,
    status: 'confirmed',
  });
  const updatedWorkshop = await Workshop.incrementRegistered(req.params.id);

  if (req.body.email) {
    sendMail({
      to: req.body.email,
      subject: 'Workshop Registration Confirmed – GHC 2026',
      html: templates.workshopRegistrationConfirmation({
        name: req.body.name,
        workshop: workshop.title,
        faculty: workshop.faculty,
        date: workshop.date,
        venue: workshop.venue,
        registrationId,
      }),
    }).catch(() => {});
  }

  return res.status(201).json({ registrationId, workshop: updatedWorkshop });
});

module.exports = {
  closeWorkshop,
  confirmWorkshopRegistration,
  createWorkshop,
  deleteWorkshop,
  getWorkshop,
  listWorkshops,
  publishWorkshop,
  reorderWorkshops,
  updateWorkshop,
  workshopStats,
};
