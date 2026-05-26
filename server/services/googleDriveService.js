const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const normalizePrivateKey = (key) => key?.replace(/\\n/g, '\n');

const getCredentials = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH) {
    const filePath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    };
  }

  return null;
};

const getDriveClient = () => {
  const credentials = getCredentials();
  if (!credentials) return null;

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: normalizePrivateKey(credentials.private_key),
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
};

const findFolder = async (drive, name, parentId) => {
  const escapedName = name.replace(/'/g, "\\'");
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const { data } = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${escapedName}' and trashed=false${parentClause}`,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 1,
  });

  return data.files?.[0] || null;
};

const ensureFolder = async (drive, name, parentId) => {
  const existing = await findFolder(drive, name, parentId);
  if (existing) return existing.id;

  const { data } = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: 'id',
  });

  return data.id;
};

const uploadResearchPdf = async ({ file, category, title }) => {
  const drive = getDriveClient();
  if (!drive || !file) return null;

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
    || (await ensureFolder(drive, 'GHC2026'));
  const categoryFolder = category === 'oral' ? 'Oral' : 'Poster';
  const categoryFolderId = await ensureFolder(drive, categoryFolder, rootFolderId);
  const safeTitle = (title || 'research-submission').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').slice(0, 90);
  const extension = path.extname(file.originalname || '.pdf') || '.pdf';

  const { data } = await drive.files.create({
    requestBody: {
      name: `${safeTitle}-${Date.now()}${extension}`,
      parents: [categoryFolderId],
    },
    media: {
      mimeType: file.mimetype || 'application/pdf',
      body: fs.createReadStream(file.path),
    },
    fields: 'id, webViewLink, webContentLink',
  });

  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
    webContentLink: data.webContentLink,
    folder: `GHC2026/${categoryFolder}`,
  };
};

module.exports = { uploadResearchPdf };
