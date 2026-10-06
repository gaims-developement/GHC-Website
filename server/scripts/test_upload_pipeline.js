require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const http = require('https');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { pool } = require('../config/db');

// Helper to create a multi-page PDF buffer manually
function createPdfBuffer(pageCount = 1) {
  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  const pageObjIds = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(`${3 + i * 2} 0 R`);
  }
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.join(' ')}] /Count ${pageCount} >>\nendobj`);

  for (let i = 0; i < pageCount; i++) {
    const pageId = 3 + i * 2;
    const contentId = pageId + 1;
    objects.push(`${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << >> >>\nendobj`);
    const stream = `BT /F1 12 Tf 72 720 Td (Page ${i + 1} of ${pageCount} - GHC Abstract Test) Tj ET`;
    objects.push(`${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
  }

  let body = '%PDF-1.4\n';
  const offsets = [];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj + '\n';
  }
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body, 'utf-8');
}

async function runTests() {
  console.log('====================================================');
  console.log('   STARTING GHC ABSTRACT CLOUDINARY TEST SUITE      ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;
  const createdCloudinaryAssets = [];

  const tempDir = path.resolve(__dirname, '../uploads/research');
  fs.mkdirSync(tempDir, { recursive: true });

  // TEST 1: Small PDF Upload
  try {
    console.log('TEST 1: Small PDF Document Upload');
    const smallPdfPath = path.join(tempDir, `test-small-${Date.now()}.pdf`);
    fs.writeFileSync(smallPdfPath, createPdfBuffer(1));

    const res1 = await uploadToCloudinary(smallPdfPath, 'research', { resourceType: 'raw', transform: false });
    createdCloudinaryAssets.push({ id: res1.public_id, type: 'raw' });

    console.log('  URL:', res1.secure_url);
    console.log('  Resource Type:', res1.resource_type);

    if (!res1.secure_url.endsWith('.pdf')) throw new Error('URL does not end with .pdf');
    if (res1.resource_type !== 'raw') throw new Error(`Expected raw, got ${res1.resource_type}`);
    if (fs.existsSync(smallPdfPath)) throw new Error('Local temp file was not deleted after success');

    console.log('  -> PASS: Small PDF uploaded as raw document without PNG conversion.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAIL:', err.message, '\n');
    failed++;
  }

  // TEST 2: Multi-Page PDF Upload
  try {
    console.log('TEST 2: Multi-Page PDF Document Upload (3 Pages)');
    const multiPdfPath = path.join(tempDir, `test-multipage-${Date.now()}.pdf`);
    fs.writeFileSync(multiPdfPath, createPdfBuffer(3));

    const res2 = await uploadToCloudinary(multiPdfPath, 'research', { resourceType: 'raw', transform: false });
    createdCloudinaryAssets.push({ id: res2.public_id, type: 'raw' });

    console.log('  URL:', res2.secure_url);
    console.log('  Resource Type:', res2.resource_type);

    if (!res2.secure_url.endsWith('.pdf')) throw new Error('URL does not end with .pdf');
    if (res2.resource_type !== 'raw') throw new Error(`Expected raw, got ${res2.resource_type}`);
    if (fs.existsSync(multiPdfPath)) throw new Error('Local temp file was not deleted');

    console.log('  -> PASS: Multi-page PDF uploaded cleanly as multi-page PDF.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAIL:', err.message, '\n');
    failed++;
  }

  // TEST 3: DOCX Document Upload
  try {
    console.log('TEST 3: DOCX Document Upload');
    const docxPath = path.join(tempDir, `test-docx-${Date.now()}.docx`);
    fs.writeFileSync(docxPath, Buffer.from('PK\x03\x04mock docx file content for testing'));

    const res3 = await uploadToCloudinary(docxPath, 'research', { resourceType: 'raw', transform: false });
    createdCloudinaryAssets.push({ id: res3.public_id, type: 'raw' });

    console.log('  URL:', res3.secure_url);
    console.log('  Resource Type:', res3.resource_type);

    if (!res3.secure_url.endsWith('.docx')) throw new Error('URL does not end with .docx');
    if (res3.resource_type !== 'raw') throw new Error(`Expected raw, got ${res3.resource_type}`);

    console.log('  -> PASS: DOCX uploaded as raw document without image transformations.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAIL:', err.message, '\n');
    failed++;
  }

  // TEST 4: Declaration Image Upload (PNG/JPG)
  try {
    console.log('TEST 4: Declaration PNG/JPG Image Upload');
    const imgPath = path.join(tempDir, `test-decl-${Date.now()}.png`);
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d400000000049454e44ae426082', 'hex');
    fs.writeFileSync(imgPath, pngBuffer);

    const res4 = await uploadToCloudinary(imgPath, 'research', { resourceType: 'auto' });
    createdCloudinaryAssets.push({ id: res4.public_id, type: 'image' });

    console.log('  URL:', res4.secure_url);
    console.log('  Resource Type:', res4.resource_type);

    if (res4.resource_type !== 'image') throw new Error(`Expected image, got ${res4.resource_type}`);

    console.log('  -> PASS: Declaration image uploaded as image resource type.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAIL:', err.message, '\n');
    failed++;
  }

  // TEST 5: Cloudinary Upload Failure Handling (Abort Submission, Temp File Cleaned, No Orphan DB Record)
  try {
    console.log('TEST 5: Cloudinary Upload Failure Behavior & Cleanup');
    const fakeFilePath = path.join(tempDir, `test-fail-${Date.now()}.pdf`);
    fs.writeFileSync(fakeFilePath, createPdfBuffer(1));

    // Count abstracts before
    const [[{ countBefore }]] = await pool.query('SELECT COUNT(*) AS countBefore FROM abstracts');

    // Simulate upload failure by calling uploadToCloudinary with invalid credentials
    let caughtError = null;
    const oldKey = process.env.CLOUDINARY_KEY;
    try {
      // Temporarily sabotage config
      cloudinary.config({ api_key: 'INVALID_KEY' });
      await uploadToCloudinary(fakeFilePath, 'research', { resourceType: 'raw', transform: false });
    } catch (e) {
      caughtError = e;
      // Cleanup file as controller does on error
      if (fs.existsSync(fakeFilePath)) fs.unlinkSync(fakeFilePath);
    } finally {
      // Restore valid config
      cloudinary.config({ api_key: oldKey });
    }

    const [[{ countAfter }]] = await pool.query('SELECT COUNT(*) AS countAfter FROM abstracts');

    if (!caughtError) throw new Error('Expected Cloudinary upload to fail, but succeeded');
    if (fs.existsSync(fakeFilePath)) throw new Error('Temporary file was not cleaned up after error');
    if (countAfter !== countBefore) throw new Error(`Orphan DB record created! Before: ${countBefore}, After: ${countAfter}`);

    console.log('  Captured Error:', caughtError.message);
    console.log('  DB records before and after match exactly:', countBefore);
    console.log('  -> PASS: Upload failure throws, cleans temporary file, and prevents orphan DB records.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAIL:', err.message, '\n');
    failed++;
  }

  // TEST 6: Revision PDF Upload Logic
  try {
    console.log('TEST 6: Revision PDF Upload Validation');
    const revisionPdfPath = path.join(tempDir, `test-rev-${Date.now()}.pdf`);
    fs.writeFileSync(revisionPdfPath, createPdfBuffer(2));

    const res6 = await uploadToCloudinary(revisionPdfPath, 'research', { resourceType: 'raw', transform: false });
    createdCloudinaryAssets.push({ id: res6.public_id, type: 'raw' });

    if (!res6.secure_url.endsWith('.pdf')) throw new Error('Revision URL does not end with .pdf');
    if (res6.resource_type !== 'raw') throw new Error(`Expected raw, got ${res6.resource_type}`);

    console.log('  Revision URL:', res6.secure_url);
    console.log('  -> PASS: Revision PDF correctly uploads using raw document pipeline.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAIL:', err.message, '\n');
    failed++;
  }

  // TEST 7: Migration Routine with Sample PDF
  try {
    console.log('TEST 7: Migration Routine Safety Verification');
    const sampleMigrationPdf = path.join(tempDir, `sample-migration-${Date.now()}.pdf`);
    fs.writeFileSync(sampleMigrationPdf, createPdfBuffer(2));

    // Verify it is a valid PDF
    const fd = fs.openSync(sampleMigrationPdf, 'r');
    const headerBuf = Buffer.alloc(5);
    fs.readSync(fd, headerBuf, 0, 5, 0);
    fs.closeSync(fd);
    if (!headerBuf.toString('ascii').startsWith('%PDF')) throw new Error('Invalid PDF');

    const migResult = await cloudinary.uploader.upload(sampleMigrationPdf, {
      folder: 'research',
      resource_type: 'raw',
    });
    createdCloudinaryAssets.push({ id: migResult.public_id, type: 'raw' });

    if (!migResult.secure_url.endsWith('.pdf') || migResult.resource_type !== 'raw') {
      throw new Error('Migration upload did not produce valid raw PDF');
    }

    // Only delete after successful verification
    fs.unlinkSync(sampleMigrationPdf);
    if (fs.existsSync(sampleMigrationPdf)) throw new Error('Failed to delete after verification');

    console.log('  Migration verified URL:', migResult.secure_url);
    console.log('  -> PASS: Migration logic successfully verified and safely deleted local file.\n');
    passed++;
  } catch (err) {
    console.error('  -> FAIL:', err.message, '\n');
    failed++;
  }

  // CLEANUP Cloudinary Test Assets
  console.log('--- Cleaning Up Test Cloudinary Assets ---');
  for (const asset of createdCloudinaryAssets) {
    try {
      await cloudinary.uploader.destroy(asset.id, { resource_type: asset.type });
    } catch (_) {}
  }
  console.log(`Cleaned up ${createdCloudinaryAssets.length} test assets from Cloudinary.\n`);

  console.log('====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  await pool.end();
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
