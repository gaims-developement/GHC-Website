require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runReport() {
  try {
    const [rows] = await pool.query(
      "SELECT id, abstract_id, title, presenting_author, email, pdf_url, declaration_url, created_at FROM abstracts WHERE pdf_url LIKE '/uploads/research/%' OR declaration_url LIKE '/uploads/research/%' ORDER BY id ASC"
    );

    const report = rows.map((r) => {
      const pdfLocalPath = r.pdf_url && r.pdf_url.startsWith('/uploads/')
        ? path.join(__dirname, '..', r.pdf_url)
        : null;
      const pdfExists = pdfLocalPath ? fs.existsSync(pdfLocalPath) : false;
      const pdfSize = pdfExists ? fs.statSync(pdfLocalPath).size : null;

      const declLocalPath = r.declaration_url && r.declaration_url.startsWith('/uploads/')
        ? path.join(__dirname, '..', r.declaration_url)
        : null;
      const declExists = declLocalPath ? fs.existsSync(declLocalPath) : false;
      const declSize = declExists ? fs.statSync(declLocalPath).size : null;

      return {
        id: r.id,
        abstractId: r.abstract_id || `GHC-ABS-${String(r.id).padStart(5, '0')}`,
        title: r.title,
        applicant: r.presenting_author || r.email || 'N/A',
        email: r.email,
        pdf_url: r.pdf_url,
        pdfFileExists: pdfExists,
        pdfFileSize: pdfSize ? `${(pdfSize / 1024).toFixed(2)} KB (${pdfSize} bytes)` : 'NOT_FOUND_ON_HOST',
        declaration_url: r.declaration_url,
        declarationFileExists: declExists,
        declarationFileSize: declSize ? `${(declSize / 1024).toFixed(2)} KB (${declSize} bytes)` : (declLocalPath ? 'NOT_FOUND_ON_HOST' : 'CLOUDINARY'),
        created_at: r.created_at,
      };
    });

    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('Error querying local abstracts:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runReport();
