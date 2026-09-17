const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateVisaLetter = async (application, settings, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(settings.event_name, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(settings.event_dates, { align: 'center' });
      doc.text(settings.venue, { align: 'center' });
      doc.moveDown(2);
      
      // Metadata
      doc.fontSize(11);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.text(`Invitation Letter No: ${application.application_id}`, { align: 'right' });
      doc.moveDown(2);
      
      doc.font('Helvetica-Bold').text('TO WHOM IT MAY CONCERN', { align: 'center' });
      doc.moveDown(1);
      
      // Body
      doc.font('Helvetica').text(`This is to certify that ${application.full_name}, holder of ${application.nationality} passport, Passport No. ${application.passport_number}, has been invited to attend the ${settings.event_name}, scheduled to be held from ${settings.event_dates} in ${settings.venue}.`);
      doc.moveDown();
      doc.text(`The ${settings.event_name} is being organized by ${settings.organizer_name} in collaboration with ${settings.collaboration_org}.`);
      doc.moveDown();
      doc.text(`The participant has registered / been invited to participate in the conference as a ${application.participant_category === 'Other' ? application.participant_category_other : application.participant_category}.`);
      doc.moveDown(2);
      
      // Details Table
      doc.font('Helvetica-Bold').text('Participant Details:');
      doc.moveDown(0.5);
      doc.font('Helvetica');
      doc.text(`Full Name: ${application.full_name}`);
      doc.text(`Date of Birth: ${application.date_of_birth}`);
      doc.text(`Nationality: ${application.nationality}`);
      doc.text(`Passport Number: ${application.passport_number}`);
      doc.text(`Organisation / Institution: ${application.organisation}`);
      if (application.designation) doc.text(`Designation: ${application.designation}`);
      doc.text(`GHC Registration ID: ${application.ghc_registration_id}`);
      doc.moveDown(2);
      
      doc.font('Helvetica-Bold').text('Conference Details:');
      doc.moveDown(0.5);
      doc.font('Helvetica');
      doc.text(`Event: ${settings.event_name}`);
      doc.text(`Dates: ${settings.event_dates}`);
      doc.text(`Venue: ${settings.venue}`);
      doc.text(`Participant Category: ${application.participant_category === 'Other' ? application.participant_category_other : application.participant_category}`);
      doc.moveDown(2);
      
      doc.text('This letter is being issued at the request of the participant to support their application for an Indian visa for attending the Global Health Conclave.');
      doc.moveDown();
      doc.text('The participant will be responsible for their travel, accommodation, visa fees, insurance and other personal expenses, unless otherwise specifically communicated by the organizers.');
      doc.moveDown();
      doc.text('For any verification or further information regarding this invitation, please contact:');
      doc.text(`General Queries: ${settings.general_email}`);
      doc.text(`Conference / Collaboration Queries: ${settings.conference_email}`);
      doc.moveDown(3);
      
      // Signature
      doc.font('Helvetica-Bold').text(settings.signatory_name);
      doc.font('Helvetica').text(settings.signatory_designation);
      doc.text(settings.event_name);
      doc.text(settings.organizer_name);
      
      doc.end();
      
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateVisaLetter };
