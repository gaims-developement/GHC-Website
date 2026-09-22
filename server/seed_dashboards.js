require('dotenv').config();
const { pool } = require('./config/db');

const predefinedTeams = [
  {
    name: 'Admin',
    slug: 'admin',
    description: 'General GHC event administration',
    color: '#3b82f6',
    icon: 'A',
    modules: [
      'speakers', 'sessions', 'schedule', 'tracks', 'halls', 'cme', 'resources', 
      'workshops', 'events', 'event-feedback', 'event-certificates', 'event-resources', 
      'venues', 'event-reports', 'scientific', 'abstracts', 'reviewers', 'reviews', 
      'presentation-sessions', 'posters', 'judges', 'awards', 'scientific-reports', 
      'certificates', 'certificate-templates', 'certificate-generate', 'certificate-bulk', 
      'certificate-signatures', 'certificate-accreditation', 'certificate-reports', 
      'logistics', 'accommodation', 'transport', 'vendors', 'inventory', 'volunteers', 
      'recruitment', 'interviews', 'departments', 'shifts', 'attendance', 'tasks', 
      'volunteer-reports', 'partners', 'exhibitors', 'stalls', 
      'contracts', 'invoices', 'deliverables', 'sponsorship-reports', 'media', 
      'marketing', 'announcements', 'news', 'homepage', 'committees', 'banners', 
      'gallery', 'campaigns', 'media-partners', 'notifications', 'media-library', 
      'trailer', 'seo', 'forms', 'forms-create', 'forms-templates', 'forms-analytics'
    ]
  },
  {
    name: 'Award Jury',
    slug: 'award-jury',
    description: 'Evaluate award nominations/candidates',
    color: '#f59e0b',
    icon: 'J',
    modules: ['awards', 'judges']
  },
  {
    name: 'Scientific Committee Chair',
    slug: 'scientific-committee-chair',
    description: 'Scientific oversight of GHC',
    color: '#8b5cf6',
    icon: 'S',
    modules: ['scientific', 'abstracts', 'reviewers', 'reviews', 'presentation-sessions', 'posters', 'scientific-reports']
  },
  {
    name: 'Reviewer',
    slug: 'reviewer',
    description: 'Review assigned abstracts only',
    color: '#10b981',
    icon: 'R',
    modules: ['abstracts', 'reviews']
  },
  {
    name: 'Workshop Team',
    slug: 'workshop-team',
    description: 'Manage workshops and resources',
    color: '#ef4444',
    icon: 'W',
    modules: ['workshops', 'event-resources', 'venues', 'halls', 'schedule', 'event-certificates', 'checkin']
  },
  {
    name: 'Sponsors Team',
    slug: 'sponsors-team',
    description: 'Manage sponsors and exhibitors',
    color: '#06b6d4',
    icon: 'P',
    modules: ['partners', 'exhibitors', 'stalls', 'contracts', 'invoices', 'deliverables', 'sponsorship-reports', 'media', 'media-library', 'media-partners']
  }
];

async function seedDashboards() {
  console.log("Seeding predefined dashboards (teams)...");

  try {
    const [dbModules] = await pool.query('SELECT id, module_key FROM modules');
    const moduleMap = {};
    for (const mod of dbModules) {
      moduleMap[mod.module_key] = mod.id;
    }

    for (const team of predefinedTeams) {
      const [existing] = await pool.query('SELECT id FROM teams WHERE slug = ?', [team.slug]);
      let teamId;
      
      if (existing.length > 0) {
        teamId = existing[0].id;
        await pool.query(
          'UPDATE teams SET name = ?, description = ?, color = ?, icon = ? WHERE id = ?',
          [team.name, team.description, team.color, team.icon, teamId]
        );
        console.log(`Updated team: ${team.name}`);
      } else {
        const [result] = await pool.query(
          'INSERT INTO teams (name, slug, description, color, icon, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [team.name, team.slug, team.description, team.color, team.icon]
        );
        teamId = result.insertId;
        console.log(`Created team: ${team.name}`);
      }

      await pool.query('DELETE FROM team_modules WHERE team_id = ?', [teamId]);

      const insertPairs = [];
      for (const modKey of team.modules) {
        if (moduleMap[modKey]) {
          insertPairs.push([teamId, moduleMap[modKey]]);
        } else {
          console.warn(`Warning: Module '${modKey}' not found in database.`);
        }
      }

      if (insertPairs.length > 0) {
        await pool.query('INSERT IGNORE INTO team_modules (team_id, module_id) VALUES ?', [insertPairs]);
      }
    }

    console.log("Dashboards seeded successfully.");
  } catch (error) {
    console.error("Error seeding dashboards:", error);
  } finally {
    process.exit(0);
  }
}

seedDashboards();
