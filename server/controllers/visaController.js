const fs = require('fs');
const path = require('path');
const os = require('os');
const VisaModel = require('../models/visaModel');
const { uploadVisaDocument, uploadGeneratedLetter } = require('../services/googleDriveService');
const { generateVisaLetter } = require('../services/pdfService');
const { sendMail } = require('../services/mailService');
const asyncHandler = require('../utils/asyncHandler');
const { logDecision } = require('../services/coreServices');

const submitApplication = asyncHandler(async (req, res) => {
  const { body, files } = req;
  
  if (!files || !files.passport_document || files.passport_document.length === 0) {
    return res.status(400).json({ success: false, message: 'Passport document is required' });
  }

  const file = files.passport_document[0];

  // Upload to Drive
  const driveResult = await uploadVisaDocument({ file, applicantName: body.full_name });
  const passportUrl = driveResult ? driveResult.url : file.path; // Fallback to local if drive is unconfigured

  const application = await VisaModel.createApplication({
    ...body,
    passport_document: passportUrl,
  });

  // Try to send email
  try {
    await sendMail({
      to: application.email,
      subject: 'Visa Invitation Letter Application Received - GHC 2026',
      html: `
        <p>Dear ${application.full_name},</p>
        <p>We have received your application for a Visa Invitation Letter for the Global Health Conclave (GHC) 2026.</p>
        <p><strong>Application ID:</strong> ${application.application_id}</p>
        <p>Our team will review your application and generate the letter shortly. You will receive another email once your letter is ready to download.</p>
        <p>Regards,<br/>GHC Team</p>
      `
    });
  } catch (err) {
    console.error('Failed to send visa submission email:', err);
  }

  res.status(201).json({ success: true, data: application });
});

const getApplications = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    nationality: req.query.nationality,
    search: req.query.search
  };
  const applications = await VisaModel.getAllApplications(filters);
  const stats = await VisaModel.getStats();
  res.json({ success: true, data: applications, stats });
});

const getApplicationDetails = asyncHandler(async (req, res) => {
  const application = await VisaModel.getApplicationById(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }
  res.json({ success: true, data: application });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, admin_notes } = req.body;
  const application = await VisaModel.updateStatus(req.params.id, status, admin_notes);
  await logDecision(req, 'updated_visa_status', req.params.id, { status, admin_notes });
  res.json({ success: true, data: application });
});

const generateLetter = asyncHandler(async (req, res) => {
  const application = await VisaModel.getApplicationById(req.params.id);
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
  
  if (application.status !== 'Approved' && application.status !== 'Letter Generated') {
    return res.status(400).json({ success: false, message: 'Application must be approved first' });
  }

  const settings = await VisaModel.getSettings();
  const tmpPath = path.join(os.tmpdir(), `${application.application_id}.pdf`);
  
  await generateVisaLetter(application, settings, tmpPath);
  const driveResult = await uploadGeneratedLetter({ filePath: tmpPath, applicationId: application.application_id });
  
  const letterUrl = driveResult ? driveResult.download || driveResult.url : null;
  const updated = await VisaModel.setLetterGenerated(req.params.id, letterUrl);
  
  await logDecision(req, 'generated_visa_letter', req.params.id);
  
  try {
    await sendMail({
      to: application.email,
      subject: 'Your GHC Visa Invitation Letter is Ready',
      html: `
        <p>Dear ${application.full_name},</p>
        <p>Your Visa Invitation Letter for the Global Health Conclave (GHC) 2026 is now ready.</p>
        <p>You can download it using the link below:</p>
        <p><a href="${letterUrl}">Download Invitation Letter</a></p>
        <p>We look forward to seeing you in New Delhi.</p>
        <p>Regards,<br/>GHC Team</p>
      `
    });
  } catch (err) {
    console.error('Failed to send letter generation email:', err);
  }
  
  res.json({ success: true, data: updated });
});

const getSettings = asyncHandler(async (req, res) => {
  const settings = await VisaModel.getSettings();
  res.json({ success: true, data: settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await VisaModel.updateSettings(req.body);
  await logDecision(req, 'updated_visa_settings');
  res.json({ success: true, data: settings });
});

module.exports = {
  submitApplication,
  getApplications,
  getApplicationDetails,
  updateStatus,
  generateLetter,
  getSettings,
  updateSettings
};
