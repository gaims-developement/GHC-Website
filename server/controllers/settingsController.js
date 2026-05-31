const Settings = require('../models/settingsModel');
const asyncHandler = require('../utils/asyncHandler');

const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const sanitize = (body) => ({
  conference: {
    name: body.conference?.name?.trim(),
    theme: body.conference?.theme?.trim(),
    venue: body.conference?.venue?.trim(),
    startDate: body.conference?.startDate || '',
    endDate: body.conference?.endDate || '',
  },
  registration: {
    registrationOpen: toBoolean(body.registration?.registrationOpen),
    abstractSubmissionOpen: toBoolean(body.registration?.abstractSubmissionOpen),
  },
  socialLinks: {
    instagram: body.socialLinks?.instagram?.trim(),
    linkedin: body.socialLinks?.linkedin?.trim(),
    twitter: body.socialLinks?.twitter?.trim(),
    website: body.socialLinks?.website?.trim(),
  },
  contact: {
    email: body.contact?.email?.trim(),
    phone: body.contact?.phone?.trim(),
  },
});

const validateUrl = (value) => !value || /^https?:\/\//i.test(value);

const validate = (settings) => {
  if (!settings.conference.name) return 'Conference name is required';
  if (!settings.conference.venue) return 'Venue is required';
  if (settings.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact.email)) return 'Contact email is invalid';

  const urls = settings.socialLinks;
  if (!validateUrl(urls.instagram)) return 'Instagram URL must start with http:// or https://';
  if (!validateUrl(urls.linkedin)) return 'LinkedIn URL must start with http:// or https://';
  if (!validateUrl(urls.twitter)) return 'X/Twitter URL must start with http:// or https://';
  if (!validateUrl(urls.website)) return 'Website URL must start with http:// or https://';

  if (settings.conference.startDate && settings.conference.endDate && settings.conference.endDate < settings.conference.startDate) {
    return 'End date cannot be before start date';
  }

  return null;
};

const getSettings = asyncHandler(async (_req, res) => {
  const result = await Settings.get();
  return res.json(result);
});

const updateSettings = asyncHandler(async (req, res) => {
  const payload = sanitize(req.body || {});
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const result = await Settings.update(payload);
  return res.json(result);
});

module.exports = { getSettings, updateSettings };
