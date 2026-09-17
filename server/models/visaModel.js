const { pool } = require('../config/db');

const VisaModel = {
  createApplication: async (data) => {
    const [result] = await pool.query(
      `INSERT INTO visa_applications 
        (full_name, date_of_birth, gender, nationality, email, mobile, 
         passport_number, passport_issue_date, passport_expiry_date, passport_issuing_country,
         organisation, designation, medical_college_hospital, country_of_residence,
         ghc_registration_id, participant_category, participant_category_other,
         arrival_date, departure_date, accommodation_details, purpose_of_visit,
         passport_document, declaration_accepted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.full_name,
        data.date_of_birth,
        data.gender || null,
        data.nationality,
        data.email,
        data.mobile,
        data.passport_number,
        data.passport_issue_date || null,
        data.passport_expiry_date,
        data.passport_issuing_country || null,
        data.organisation,
        data.designation || null,
        data.medical_college_hospital || null,
        data.country_of_residence || null,
        data.ghc_registration_id,
        data.participant_category,
        data.participant_category_other || null,
        data.arrival_date,
        data.departure_date,
        data.accommodation_details || null,
        data.purpose_of_visit || 'Participation in the Global Health Conclave (GHC)',
        data.passport_document,
        1
      ]
    );

    // Update with generated application ID
    const insertId = result.insertId;
    await pool.query(
      `UPDATE visa_applications SET application_id = CONCAT('GHC-VISA-2026-', LPAD(id, 4, '0')) WHERE id = ?`,
      [insertId]
    );

    const [rows] = await pool.query('SELECT * FROM visa_applications WHERE id = ?', [insertId]);
    return rows[0];
  },

  getAllApplications: async (filters = {}) => {
    let query = 'SELECT * FROM visa_applications WHERE 1=1';
    let params = [];
    
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.nationality) {
      query += ' AND nationality = ?';
      params.push(filters.nationality);
    }
    if (filters.search) {
      query += ' AND (full_name LIKE ? OR application_id LIKE ? OR email LIKE ? OR passport_number LIKE ? OR ghc_registration_id LIKE ?)';
      const search = `%${filters.search}%`;
      params.push(search, search, search, search, search);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  getApplicationById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM visa_applications WHERE id = ?', [id]);
    return rows[0];
  },

  updateStatus: async (id, status, admin_notes = null) => {
    let query = 'UPDATE visa_applications SET status = ?';
    let params = [status];
    
    if (status === 'Approved') {
      query += ', approved_at = CURRENT_TIMESTAMP';
    } else if (status === 'Under Review') {
      query += ', reviewed_at = CURRENT_TIMESTAMP';
    }

    if (admin_notes !== null) {
      query += ', admin_notes = ?';
      params.push(admin_notes);
    }

    query += ' WHERE id = ?';
    params.push(id);
    
    await pool.query(query, params);
    return VisaModel.getApplicationById(id);
  },

  setLetterGenerated: async (id, letter_url) => {
    await pool.query(
      `UPDATE visa_applications 
       SET status = 'Letter Generated', 
           letter_generated = 1, 
           letter_number = application_id, 
           generated_letter_url = ?, 
           generated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [letter_url, id]
    );
    return VisaModel.getApplicationById(id);
  },

  getStats: async () => {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(status = 'Pending') AS pending,
        SUM(status = 'Under Review') AS under_review,
        SUM(status = 'Approved') AS approved,
        SUM(status = 'Letter Generated') AS letter_generated,
        SUM(status = 'Rejected') AS rejected
      FROM visa_applications
    `);
    return rows[0];
  },

  getSettings: async () => {
    const [rows] = await pool.query('SELECT * FROM visa_letter_settings WHERE id = 1');
    return rows[0];
  },

  updateSettings: async (data) => {
    await pool.query(
      `UPDATE visa_letter_settings 
       SET event_name = ?, event_dates = ?, venue = ?, organizer_name = ?, 
           collaboration_org = ?, general_email = ?, conference_email = ?, 
           signatory_name = ?, signatory_designation = ?, contact_number = ?, 
           official_logo_url = ?, official_letterhead_url = ?, footer_text = ? 
       WHERE id = 1`,
      [
        data.event_name, data.event_dates, data.venue, data.organizer_name,
        data.collaboration_org, data.general_email, data.conference_email,
        data.signatory_name, data.signatory_designation, data.contact_number,
        data.official_logo_url || null, data.official_letterhead_url || null, data.footer_text || null
      ]
    );
    return VisaModel.getSettings();
  }
};

module.exports = VisaModel;
