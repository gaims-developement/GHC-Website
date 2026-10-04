require('dotenv').config();
const { getPool } = require('../config/db');

async function run() {
  const pool = getPool();
  await pool.query("UPDATE speakers SET speaker_type = 'current' WHERE name LIKE '%(Invited)%'");

  const pastSpeakers = [
    {
      name: 'Dr Mukesh Bhatia',
      designation: 'Founder, DBMCI',
      achievements: 'Pioneer in PG Medical Entrance education. Mentored millions of medical students.',
      photo_url: '/assets/Speakers/mukeshBhatia.jpeg',
      display_order: 1,
      speaker_type: 'past',
      status: 'published'
    },
    {
      name: 'Dr Randeep Guleria',
      designation: 'Former Director, AIIMS New Delhi',
      achievements: 'Padma Shri Awardee. Lead architect of India\'s COVID-19 pandemic response.',
      photo_url: '/assets/Speakers/RandeepGuleria.jpeg',
      display_order: 2,
      speaker_type: 'past',
      status: 'published'
    },
    {
      name: 'Dr Minu Bajpai',
      designation: 'Executive Director, NBE',
      achievements: 'Renowned Paediatric Surgeon and academician. Former Head of Department at AIIMS.',
      photo_url: '/assets/Speakers/MinuBhajpai.jpeg',
      display_order: 3,
      speaker_type: 'past',
      status: 'published'
    },
    {
      name: 'Dr Rakesh Garg',
      designation: 'Additional Professor, AIIMS New Delhi',
      achievements: 'Expert in Anesthesiology, Pain Medicine and Critical Care. Over 200+ publications.',
      photo_url: '/assets/Speakers/RakeshGarg.jpeg',
      display_order: 4,
      speaker_type: 'past',
      status: 'published'
    },
    {
      name: 'Dr Tanmay Motiwala',
      designation: 'Paediatric Surgeon & Influencer',
      achievements: 'Inspiring voice in the medical community with focus on surgical education.',
      photo_url: '/assets/Speakers/TanmayMotiwala.jpeg',
      display_order: 5,
      speaker_type: 'past',
      status: 'published'
    },
    {
      name: 'Lt Gen Dr DP Vats',
      designation: 'Former Director, AFMC Pune',
      achievements: 'Rajya Sabha MP. Param Vishisht Seva Medal (PVSM) awardee. Eminent Ophthalmologist.',
      photo_url: '/assets/Speakers/LtGenDrDPVats.jpeg',
      display_order: 6,
      speaker_type: 'past',
      status: 'published'
    },
    {
      name: 'Dr Yogendra Malik',
      designation: 'Former Advisor to CM, Haryana',
      achievements: 'Eminent medical educationist and health policy maker.',
      photo_url: '/assets/Speakers/YogendraMalik.jpeg',
      display_order: 7,
      speaker_type: 'past',
      status: 'published'
    }
  ];

  for (const s of pastSpeakers) {
    const [existing] = await pool.query('SELECT id FROM speakers WHERE name = ?', [s.name]);
    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO speakers (name, full_name, designation, achievements, photo_url, profile_image, display_order, speaker_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.name, s.name, s.designation, s.achievements, s.photo_url, s.photo_url, s.display_order, s.speaker_type, s.status]
      );
      console.log('Inserted past speaker:', s.name);
    } else {
      await pool.query(
        'UPDATE speakers SET speaker_type = ?, achievements = COALESCE(achievements, ?), photo_url = COALESCE(photo_url, ?) WHERE id = ?',
        ['past', s.achievements, s.photo_url, existing[0].id]
      );
      console.log('Updated to past speaker:', s.name);
    }
  }

  const [all] = await pool.query('SELECT id, name, speaker_type, status FROM speakers ORDER BY speaker_type, display_order');
  console.log('Total speakers in DB:', all.length);
  console.table(all);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
