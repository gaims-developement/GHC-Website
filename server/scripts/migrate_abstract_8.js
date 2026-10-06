require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('../config/db');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

async function migrateAbstract8(customFilePath = null) {
  let conn = null;
  try {
    console.log('--- Migration: Abstract #8 PDF to Cloudinary ---');

    // 1. Fetch Abstract #8 from Database
    const [rows] = await pool.query(
      'SELECT id, abstract_id, title, presenting_author, email, pdf_url, declaration_url FROM abstracts WHERE id = 8 LIMIT 1'
    );

    if (rows.length === 0) {
      console.error('Abstract #8 not found in database.');
      return { success: false, reason: 'ABSTRACT_NOT_FOUND' };
    }

    const abstract = rows[0];
    console.log(`Found abstract #${abstract.id} (${abstract.abstract_id}): "${abstract.title}"`);
    console.log(`Current pdf_url: ${abstract.pdf_url}`);
    console.log(`Current declaration_url: ${abstract.declaration_url}`);

    if (abstract.pdf_url && abstract.pdf_url.startsWith('https://res.cloudinary.com/')) {
      console.log('Abstract #8 is already pointing to Cloudinary. No migration needed.');
      return { success: true, alreadyMigrated: true, url: abstract.pdf_url };
    }

    // 2. Resolve and verify local file existence
    const defaultLocalPath = path.resolve(__dirname, '..', abstract.pdf_url.replace(/^\/+/, ''));
    const resolvedPath = customFilePath ? path.resolve(customFilePath) : defaultLocalPath;

    console.log(`Checking local file at: ${resolvedPath}`);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`File not found at: ${resolvedPath}`);
      return {
        success: false,
        reason: 'FILE_NOT_FOUND_ON_HOST',
        resolvedPath,
        note: 'The file was not found on this machine. If abstract #8 was submitted on a remote server (e.g. production/staging), run this script on that server host or place the PDF file at the resolved path.'
      };
    }

    const stats = fs.statSync(resolvedPath);
    console.log(`File exists! Size: ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)`);

    // Verify file header is PDF
    const fd = fs.openSync(resolvedPath, 'r');
    const headerBuf = Buffer.alloc(5);
    fs.readSync(fd, headerBuf, 0, 5, 0);
    fs.closeSync(fd);
    if (!headerBuf.toString('ascii').startsWith('%PDF')) {
      console.error('File does not have a valid %PDF header.');
      return { success: false, reason: 'INVALID_PDF_HEADER' };
    }

    // 3. Upload original PDF to Cloudinary using raw/document settings
    console.log('Uploading PDF to Cloudinary with resource_type: "raw"...');
    const uploadResult = await cloudinary.uploader.upload(resolvedPath, {
      folder: 'research',
      resource_type: 'raw',
    });

    console.log('Upload completed:', {
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type,
      secure_url: uploadResult.secure_url,
      bytes: uploadResult.bytes,
    });

    // 4. Verify Cloudinary upload succeeded and resource is raw PDF
    if (!uploadResult.secure_url || !uploadResult.secure_url.startsWith('https://res.cloudinary.com/')) {
      throw new Error(`Invalid Cloudinary secure_url returned: ${uploadResult.secure_url}`);
    }
    if (uploadResult.resource_type !== 'raw') {
      throw new Error(`Expected resource_type 'raw', got: ${uploadResult.resource_type}`);
    }
    if (!uploadResult.secure_url.toLowerCase().endsWith('.pdf')) {
      throw new Error(`Expected URL to end with .pdf, got: ${uploadResult.secure_url}`);
    }

    // 5. Update only that abstract's pdf_url using a transaction
    console.log('Beginning database transaction to update pdf_url...');
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [updateResult] = await conn.query(
      'UPDATE abstracts SET pdf_url = ? WHERE id = ? AND pdf_url = ?',
      [uploadResult.secure_url, abstract.id, abstract.pdf_url]
    );

    if (updateResult.affectedRows !== 1) {
      await conn.rollback();
      throw new Error(`Expected 1 affected row, got ${updateResult.affectedRows}. Transaction rolled back.`);
    }

    await conn.commit();
    console.log('Database transaction committed successfully.');

    // 6. Verify database record
    const [[updatedRow]] = await pool.query(
      'SELECT id, abstract_id, pdf_url, declaration_url FROM abstracts WHERE id = 8'
    );
    console.log('Updated DB record:', updatedRow);
    if (updatedRow.declaration_url !== abstract.declaration_url) {
      throw new Error('Declaration URL was unexpectedly modified!');
    }

    // 7. Delete local file ONLY after successful Cloudinary verification and DB commit
    console.log(`Safely unlinking local file: ${resolvedPath}`);
    fs.unlinkSync(resolvedPath);
    console.log('Local file unlinked successfully.');

    return {
      success: true,
      abstractId: abstract.id,
      oldPdfUrl: abstract.pdf_url,
      newPdfUrl: uploadResult.secure_url,
      declarationUrl: updatedRow.declaration_url,
    };
  } catch (error) {
    if (conn) {
      await conn.rollback().catch(() => {});
    }
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  } finally {
    if (conn) conn.release();
  }
}

if (require.main === module) {
  const customPath = process.argv[2] || null;
  migrateAbstract8(customPath)
    .then((result) => {
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { migrateAbstract8 };
