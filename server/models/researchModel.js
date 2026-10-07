const { pool } = require('../config/db');

const normalize = (item) => item && ({
  id: item.id,
  abstractId: item.abstract_id,
  title: item.title,
  authors: item.authors,
  correspondingAuthor: item.corresponding_author,
  presentingAuthor: item.presenting_author,
  institution: item.institution,
  email: item.email,
  phone: item.phone,
  country: item.country,
  categoryId: item.category_id,
  category: item.category,
  track: item.track,
  keywords: item.keywords,
  abstractText: item.abstract_text,
  pdfUrl: item.file_url || item.pdf_url,
  fileUrl: item.file_url || item.pdf_url,
  declarationUrl: item.declaration_url,
  cityState: item.city_state,
  specialty: item.specialty,
  yearOfStudy: item.year_of_study,
  status: item.submission_status || item.status,
  submissionStatus: item.submission_status || item.status,
  finalScore: item.final_score === null ? null : Number(item.final_score),
  reviewScore: item.review_score === null ? null : Number(item.review_score),
  reviewNotes: item.review_notes,
  reviewerId: item.reviewer_id,
  teamId: item.team_id,
  teamName: item.team_name,
  workflowStage: item.workflow_stage || 'submitted',
  leadReviewerId: item.lead_reviewer_id,
  leadReviewNotes: item.lead_review_notes,
  leadDecisionAt: item.lead_decision_at,
  reviewerRevisionNotes: item.reviewer_revision_notes,
  reviewerRecommendedAction: item.reviewer_recommended_action,
  reviewerSubmittedAt: item.reviewer_submitted_at,
  assignedReviewerId: item.assigned_reviewer_id,
  assignedReviewerName: item.assigned_reviewer_name,
  awardNomination: Boolean(item.award_nomination),
  aiPercentage: item.ai_percentage !== null ? Number(item.ai_percentage) : null,
  plagiarismPercentage: item.plagiarism_percentage !== null ? Number(item.plagiarism_percentage) : null,
  currentVersion: item.current_version || 1,
  revisionToken: item.revision_token,
  revisionTokenExpires: item.revision_token_expires,
  revisionRequestedAt: item.revision_requested_at,
  revisionDeadline: item.revision_deadline,
  revisionEmailStatus: item.revision_email_status,
  revisionLastEmailSentAt: item.revision_last_email_sent_at,
  revisionTokenStatus: item.revision_token_status,
  versions: item.versions || [],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const list = async ({
  includeAll = false,
  reviewerId = null,
  teamId = null,
  leadTeamIds = null,
  assignedReviewerId = null,
  workflowStage = null,
  unassignedOnly = false,
  limit = null,
  offset = 0,
  compact = false,
} = {}) => {
  const whereClauses = [];
  const params = [];

  if (!includeAll) {
    whereClauses.push("a.status = 'accepted'");
  }

  if (reviewerId) {
    whereClauses.push("(a.reviewer_id = ? OR EXISTS (SELECT 1 FROM abstract_review_assignments ara WHERE ara.abstract_id = a.id AND ara.reviewer_id = ?))");
    params.push(reviewerId, reviewerId);
  }

  if (assignedReviewerId) {
    whereClauses.push("EXISTS (SELECT 1 FROM abstract_review_assignments ara WHERE ara.abstract_id = a.id AND ara.reviewer_id = ?)");
    params.push(assignedReviewerId);
  }

  if (unassignedOnly) {
    whereClauses.push("a.team_id IS NULL");
  } else if (teamId) {
    whereClauses.push("a.team_id = ?");
    params.push(teamId);
  } else if (leadTeamIds && leadTeamIds.length > 0) {
    whereClauses.push(`a.team_id IN (${leadTeamIds.map(() => '?').join(',')})`);
    params.push(...leadTeamIds);
  }

  if (workflowStage) {
    whereClauses.push("a.workflow_stage = ?");
    params.push(workflowStage);
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let paginationSql = '';
  if (limit) {
    paginationSql = ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset || 0));
  }

  const [rows] = await pool.query(
    `SELECT a.*, rt.name AS team_name,
       (SELECT ara.reviewer_id FROM abstract_review_assignments ara WHERE ara.abstract_id = a.id LIMIT 1) AS assigned_reviewer_id,
       (SELECT u.name FROM abstract_review_assignments ara INNER JOIN reviewers r ON r.id = ara.reviewer_id INNER JOIN users u ON u.id = r.user_id WHERE ara.abstract_id = a.id LIMIT 1) AS assigned_reviewer_name
     FROM abstracts a
     LEFT JOIN reviewer_teams rt ON rt.id = a.team_id
     ${where}
     ORDER BY a.award_nomination DESC, a.category ASC, a.created_at DESC${paginationSql}`,
    params
  );
  return rows.map(normalize);
};

const findById = async (id) => {
  const isNumeric = !isNaN(Number(id));
  const [rows] = isNumeric
    ? await pool.query(`
        SELECT a.*, rt.name AS team_name,
          (SELECT ara.reviewer_id FROM abstract_review_assignments ara WHERE ara.abstract_id = a.id LIMIT 1) AS assigned_reviewer_id,
          (SELECT u.name FROM abstract_review_assignments ara INNER JOIN reviewers r ON r.id = ara.reviewer_id INNER JOIN users u ON u.id = r.user_id WHERE ara.abstract_id = a.id LIMIT 1) AS assigned_reviewer_name
        FROM abstracts a
        LEFT JOIN reviewer_teams rt ON rt.id = a.team_id
        WHERE a.id = ? OR a.abstract_id = ?
        LIMIT 1`, [id, String(id)])
    : await pool.query(`
        SELECT a.*, rt.name AS team_name,
          (SELECT ara.reviewer_id FROM abstract_review_assignments ara WHERE ara.abstract_id = a.id LIMIT 1) AS assigned_reviewer_id,
          (SELECT u.name FROM abstract_review_assignments ara INNER JOIN reviewers r ON r.id = ara.reviewer_id INNER JOIN users u ON u.id = r.user_id WHERE ara.abstract_id = a.id LIMIT 1) AS assigned_reviewer_name
        FROM abstracts a
        LEFT JOIN reviewer_teams rt ON rt.id = a.team_id
        WHERE a.abstract_id = ?
        LIMIT 1`, [String(id)]);
  if (!rows.length) return null;
  const abstract = rows[0];
  const [versions] = await pool.query('SELECT * FROM abstract_versions WHERE abstract_id = ? ORDER BY version_number DESC', [Number(abstract.id)]);
  abstract.versions = versions;
  return normalize(abstract);
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO abstracts
      (abstract_id, title, authors, corresponding_author, presenting_author, institution, email, phone, country, city_state, specialty, year_of_study, category_id, category, track, keywords, abstract_text, file_url, pdf_url, declaration_url, status, submission_status, submitted_at, award_nomination)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.abstractId || null,
      data.title,
      data.authors || null,
      data.correspondingAuthor || data.presentingAuthor || null,
      data.presentingAuthor || null,
      data.institution || null,
      data.email || null,
      data.phone || null,
      data.country || null,
      data.city_state || null,
      data.specialty || null,
      data.year_of_study || null,
      data.categoryId || null,
      data.category || 'poster',
      data.track || null,
      data.keywords || null,
      data.abstractText || null,
      data.pdfUrl || null,
      data.pdfUrl || null,
      data.declaration_url || null,
      data.status || 'draft',
      data.status || 'draft',
      data.status === 'submitted' ? new Date() : null,
      Boolean(data.awardNomination),
    ]
  );
  await pool.query('UPDATE abstracts SET abstract_id = CONCAT(\'GHC-ABS-\', LPAD(id, 5, \'0\')) WHERE id = ? AND abstract_id IS NULL', [result.insertId]);
  return findById(result.insertId);
};

const updateIntegrity = async (id, data) => {
  await pool.query(
    `UPDATE abstracts SET
      ai_percentage = ?,
      plagiarism_percentage = ?
     WHERE id = ?`,
    [
      data.aiPercentage !== undefined ? data.aiPercentage : null,
      data.plagiarismPercentage !== undefined ? data.plagiarismPercentage : null,
      id
    ]
  );
  return findById(id);
};

const update = async (id, data) => {
  await pool.query(
    `UPDATE abstracts SET
      title = ?,
      authors = ?,
      corresponding_author = ?,
      presenting_author = ?,
      institution = ?,
      email = ?,
      phone = ?,
      country = ?,
      city_state = ?,
      specialty = ?,
      year_of_study = ?,
      category_id = ?,
      category = ?,
      track = ?,
      keywords = ?,
      abstract_text = ?,
      file_url = COALESCE(?, file_url),
      pdf_url = COALESCE(?, pdf_url),
      declaration_url = COALESCE(?, declaration_url),
      status = ?,
      submission_status = ?,
      award_nomination = ?
     WHERE id = ?`,
    [
      data.title,
      data.authors || null,
      data.correspondingAuthor || data.presentingAuthor || null,
      data.presentingAuthor || null,
      data.institution || null,
      data.email || null,
      data.phone || null,
      data.country || null,
      data.city_state || null,
      data.specialty || null,
      data.year_of_study || null,
      data.categoryId || null,
      data.category || 'poster',
      data.track || null,
      data.keywords || null,
      data.abstractText || null,
      data.pdfUrl || null,
      data.pdfUrl || null,
      data.declaration_url || null,
      data.status || 'draft',
      data.status || 'draft',
      Boolean(data.awardNomination),
      id,
    ]
  );
  return findById(id);
};



const review = async (id, data) => {
  await pool.query(
    `UPDATE abstracts SET
      review_score = ?,
      review_notes = ?,
      reviewer_id = ?,
      status = ?,
      award_nomination = ?
     WHERE id = ?`,
    [
      data.reviewScore,
      data.reviewNotes || null,
      data.reviewerId || null,
      data.status || 'under_review',
      Boolean(data.awardNomination),
      id,
    ]
  );
  return findById(id);
};

const setStatus = async (id, status) => {
  await pool.query('UPDATE abstracts SET status = ?, submission_status = ? WHERE id = ?', [status, status, id]);
  return findById(id);
};

const setAward = async (id, awardNomination) => {
  await pool.query('UPDATE abstracts SET award_nomination = ? WHERE id = ?', [Boolean(awardNomination), id]);
  return findById(id);
};

const stats = async () => {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'submitted' OR status = 'draft') AS newSubmissions,
      SUM(status = 'under_review') AS underReview,
      SUM(status = 'accepted') AS accepted,
      SUM(status = 'rejected') AS rejected,
      SUM(status = 'revision_requested') AS revisionRequested,
      SUM(award_nomination = 1) AS awardNominees,
      (SELECT COUNT(*) FROM abstract_review_assignments) AS totalAssignments,
      (SELECT COUNT(*) FROM abstract_reviews) AS totalCompletedReviews,
      (SELECT COUNT(*) FROM abstracts WHERE (status = 'submitted' OR status = 'draft') AND id NOT IN (SELECT abstract_id FROM abstract_review_assignments)) AS unassignedCount,
      (SELECT COUNT(*) FROM abstracts WHERE status = 'under_review' AND id IN (SELECT abstract_id FROM abstract_reviews)) AS awaitingDecisionCount
    FROM abstracts
  `);

  const r = rows[0] || {};
  const totalAssignments = Number(r.totalAssignments || 0);
  const totalCompletedReviews = Number(r.totalCompletedReviews || 0);
  const reviewsPending = Math.max(0, totalAssignments - totalCompletedReviews);
  const reviewCompletion = totalAssignments > 0 ? Math.round((totalCompletedReviews / totalAssignments) * 100) : 0;

  return {
    total: Number(r.total || 0),
    newSubmissions: Number(r.newSubmissions || 0),
    underReview: Number(r.underReview || 0),
    accepted: Number(r.accepted || 0),
    rejected: Number(r.rejected || 0),
    revisionRequested: Number(r.revisionRequested || 0),
    awardNominees: Number(r.awardNominees || 0),
    totalAssignments,
    totalCompletedReviews,
    reviewsPending,
    reviewCompletion,
    unassignedCount: Number(r.unassignedCount || 0),
    awaitingDecisionCount: Number(r.awaitingDecisionCount || 0),
  };
};

const hashRevisionToken = (token) =>
  require('crypto').createHash('sha256').update(String(token)).digest('hex');

const hashSecureToken = hashRevisionToken;

const findRevisionToken = async (token) => {
  const tokenHash = hashRevisionToken(token);
  const [rows] = await pool.query(
    `SELECT art.*, a.status AS abstract_status
     FROM abstract_revision_tokens art
     INNER JOIN abstracts a ON a.id = art.abstract_id
     WHERE art.token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
};

const findByToken = async (token) => {
  const revisionToken = await findRevisionToken(token);
  if (!revisionToken) return null;
  if (revisionToken.status !== 'active' || revisionToken.used_at || new Date(revisionToken.expires_at) <= new Date()) return null;
  if (revisionToken.abstract_status !== 'revision_requested') return null;
  const submission = await findById(revisionToken.abstract_id);
  if (!submission) return null;
  return {
    ...submission,
    revisionTokenId: revisionToken.id,
    revisionComments: revisionToken.comments,
    revisionDeadline: revisionToken.expires_at,
  };
};

const createVersion = async (abstractId, versionNumber, pdfUrl, declarationUrl, data = {}, conn = pool) => {
  let numericAbstractId = Number(abstractId);
  if (!Number.isInteger(numericAbstractId) || numericAbstractId <= 0) {
    const [[row]] = await conn.query('SELECT id FROM abstracts WHERE abstract_id = ? LIMIT 1', [String(abstractId)]);
    numericAbstractId = Number(row?.id);
  }
  if (!Number.isInteger(numericAbstractId) || numericAbstractId <= 0) {
    const error = new Error(`Invalid abstract id for version history: ${abstractId}`);
    error.code = 'INVALID_ABSTRACT_ID';
    throw error;
  }

  await conn.query(
    `INSERT INTO abstract_versions
      (abstract_id, version_number, title, abstract_text, category, pdf_url, declaration_url, status, revision_comments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      abstract_text = VALUES(abstract_text),
      category = VALUES(category),
      pdf_url = VALUES(pdf_url),
      declaration_url = VALUES(declaration_url),
      status = VALUES(status),
      revision_comments = VALUES(revision_comments)`,
    [
      numericAbstractId,
      versionNumber,
      data.title || null,
      data.abstractText || data.abstract_text || null,
      data.category || null,
      pdfUrl,
      declarationUrl,
      data.status || null,
      data.revisionComments || data.revision_comments || null,
    ]
  );
};

const requestRevision = async (id, token, expires, data = {}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[abstractRow]] = !isNaN(Number(id))
      ? await conn.query('SELECT id FROM abstracts WHERE id = ? OR abstract_id = ? LIMIT 1', [id, String(id)])
      : await conn.query('SELECT id FROM abstracts WHERE abstract_id = ? LIMIT 1', [String(id)]);
    if (!abstractRow) {
      const error = new Error('Research submission not found');
      error.code = 'ABSTRACT_NOT_FOUND';
      throw error;
    }
    const abstractId = abstractRow.id;
    await conn.query(
      `UPDATE abstract_revision_tokens
       SET status = 'revoked'
       WHERE abstract_id = ? AND status = 'active' AND used_at IS NULL`,
      [abstractId]
    );
    await conn.query(
      `INSERT INTO abstract_revision_tokens
        (abstract_id, token_hash, applicant_email, abstract_version, expires_at, created_by, status, comments)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        abstractId,
        hashRevisionToken(token),
        data.applicantEmail || null,
        data.abstractVersion || 1,
        expires,
        data.createdBy || null,
        data.comments || null,
      ]
    );
    await conn.query(
      `UPDATE abstracts
       SET status = 'revision_requested',
           submission_status = 'revision_requested',
           revision_token = NULL,
           revision_token_expires = ?,
           revision_requested_at = NOW(),
           revision_deadline = ?,
           revision_token_status = 'active'
       WHERE id = ?`,
      [expires, expires, abstractId]
    );
    await conn.commit();
    return findById(id);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const markRevisionEmailStatus = async (abstractId, status) => {
  await pool.query(
    'UPDATE abstracts SET revision_email_status = ?, revision_last_email_sent_at = NOW() WHERE id = ?',
    [status, abstractId]
  );
};

const createParticipationToken = async (id, token, expires, data = {}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[abstractRow]] = !isNaN(Number(id))
      ? await conn.query('SELECT id FROM abstracts WHERE id = ? OR abstract_id = ? LIMIT 1', [id, String(id)])
      : await conn.query('SELECT id FROM abstracts WHERE abstract_id = ? LIMIT 1', [String(id)]);
    if (!abstractRow) {
      const error = new Error('Research submission not found');
      error.code = 'ABSTRACT_NOT_FOUND';
      throw error;
    }
    const abstractId = abstractRow.id;
    await conn.query(
      `UPDATE abstract_participation_tokens
       SET status = 'revoked'
       WHERE abstract_id = ? AND status = 'active' AND confirmed_at IS NULL`,
      [abstractId]
    );
    await conn.query(
      `INSERT INTO abstract_participation_tokens
        (abstract_id, token_hash, applicant_email, expires_at, created_by, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [
        abstractId,
        hashSecureToken(token),
        data.applicantEmail || null,
        expires,
        data.createdBy || null,
      ]
    );
    await conn.commit();
    return findById(abstractId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const findParticipationToken = async (token) => {
  const tokenHash = hashSecureToken(token);
  const [rows] = await pool.query(
    `SELECT apt.*, a.status AS abstract_status, a.abstract_id AS abstract_code, a.title, a.presenting_author, a.authors, a.institution
     FROM abstract_participation_tokens apt
     INNER JOIN abstracts a ON a.id = apt.abstract_id
     WHERE apt.token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
};

const confirmParticipation = async (token) => {
  const tokenHash = hashSecureToken(token);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT apt.*, a.abstract_id AS abstract_code, a.title, a.presenting_author, a.authors, a.institution
       FROM abstract_participation_tokens apt
       INNER JOIN abstracts a ON a.id = apt.abstract_id
       WHERE apt.token_hash = ?
       FOR UPDATE`,
      [tokenHash]
    );
    const row = rows[0];
    if (!row) {
      const error = new Error('Invalid participation confirmation link.');
      error.code = 'INVALID_TOKEN';
      throw error;
    }
    if (row.confirmed_at || row.status === 'confirmed') {
      await conn.commit();
      return { alreadyConfirmed: true, submission: row };
    }
    if (row.status !== 'active' || new Date(row.expires_at) <= new Date()) {
      const error = new Error('This participation confirmation link has expired.');
      error.code = 'EXPIRED_TOKEN';
      throw error;
    }
    await conn.query(
      "UPDATE abstract_participation_tokens SET status = 'confirmed', confirmed_at = NOW() WHERE id = ?",
      [row.id]
    );
    await conn.commit();
    return { alreadyConfirmed: false, submission: row };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const saveRevision = async (token, data) => {
  const tokenHash = hashRevisionToken(token);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [tokens] = await conn.query(
      `SELECT art.id AS revision_token_id,
              art.abstract_id AS token_abstract_id,
              art.status AS token_status,
              art.used_at,
              art.expires_at,
              art.comments,
              a.*
       FROM abstract_revision_tokens art
       INNER JOIN abstracts a ON a.id = art.abstract_id
       WHERE art.token_hash = ?
       FOR UPDATE`,
      [tokenHash]
    );
    const row = tokens[0];
    if (!row) {
      const error = new Error('Invalid revision link.');
      error.code = 'INVALID_TOKEN';
      throw error;
    }
    if (row.used_at || row.token_status === 'used') {
      const error = new Error('This revision link has already been used.');
      error.code = 'USED_TOKEN';
      throw error;
    }
    if (row.token_status !== 'active' || new Date(row.expires_at) <= new Date()) {
      const error = new Error('This revision link has expired. Please contact the GHC Scientific Committee.');
      error.code = 'EXPIRED_TOKEN';
      throw error;
    }
    if (row.status !== 'revision_requested' && row.submission_status !== 'revision_requested') {
      const error = new Error('This abstract is no longer awaiting revision.');
      error.code = 'NOT_AWAITING_REVISION';
      throw error;
    }

    const currentVersion = row.current_version || 1;
    const newVersion = currentVersion + 1;
    const numericAbstractId = row.token_abstract_id;

    await createVersion(numericAbstractId, currentVersion, row.file_url || row.pdf_url, row.declaration_url, {
      title: row.title,
      abstractText: row.abstract_text,
      category: row.category,
      status: row.submission_status || row.status,
      revisionComments: row.comments,
    }, conn);

    await createVersion(numericAbstractId, newVersion, data.pdfUrl, data.declarationUrl, {
      title: data.title || row.title,
      abstractText: data.abstractText || row.abstract_text,
      category: data.category || row.category,
      status: 'revised_submitted',
      revisionComments: row.comments,
    }, conn);

    await conn.query(
      `UPDATE abstracts SET
        title = COALESCE(?, title),
        abstract_text = COALESCE(?, abstract_text),
        category = COALESCE(?, category),
        pdf_url = COALESCE(?, pdf_url),
        file_url = COALESCE(?, file_url),
        declaration_url = COALESCE(?, declaration_url),
        current_version = ?,
        status = 'revised_submitted',
        submission_status = 'revised_submitted',
        revision_token = NULL,
        revision_token_expires = NULL,
        revision_token_status = 'used'
       WHERE id = ?`,
      [data.title || null, data.abstractText || null, data.category || null, data.pdfUrl, data.pdfUrl, data.declarationUrl, newVersion, numericAbstractId]
    );
    await conn.query(
      "UPDATE abstract_revision_tokens SET status = 'used', used_at = NOW() WHERE id = ?",
      [row.revision_token_id]
    );
    await conn.commit();
    return findById(numericAbstractId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

const setTeam = async (id, teamId) => {
  await pool.query(
    `UPDATE abstracts SET team_id = ?, workflow_stage = CASE WHEN ? IS NULL THEN 'submitted' ELSE 'assigned_to_team' END WHERE id = ?`,
    [teamId, teamId, id]
  );
  return findById(id);
};

const setWorkflowStage = async (id, stage, extra = {}) => {
  const updates = ['workflow_stage = ?'];
  const params = [stage];
  if (extra.leadReviewerId !== undefined) {
    updates.push('lead_reviewer_id = ?');
    params.push(extra.leadReviewerId);
  }
  if (extra.leadReviewNotes !== undefined) {
    updates.push('lead_review_notes = ?');
    params.push(extra.leadReviewNotes);
  }
  if (extra.leadDecisionAt !== undefined) {
    updates.push('lead_decision_at = ?');
    params.push(extra.leadDecisionAt);
  }
  if (extra.reviewerRevisionNotes !== undefined) {
    updates.push('reviewer_revision_notes = ?');
    params.push(extra.reviewerRevisionNotes);
  }
  if (extra.reviewerRecommendedAction !== undefined) {
    updates.push('reviewer_recommended_action = ?');
    params.push(extra.reviewerRecommendedAction);
  }
  if (extra.reviewerSubmittedAt !== undefined) {
    updates.push('reviewer_submitted_at = ?');
    params.push(extra.reviewerSubmittedAt);
  }
  params.push(id);
  await pool.query(`UPDATE abstracts SET ${updates.join(', ')} WHERE id = ?`, params);
  return findById(id);
};

module.exports = {
  create,
  findById,
  findByToken,
  findRevisionToken,
  findParticipationToken,
  confirmParticipation,
  createParticipationToken,
  createVersion,
  requestRevision,
  saveRevision,
  markRevisionEmailStatus,
  list,
  review,
  setAward,
  setStatus,
  setTeam,
  setWorkflowStage,
  stats,
  update,
  updateIntegrity,
};
