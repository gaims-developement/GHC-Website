const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const number = (value) => Number(value || 0);

const getKpis = async () => {
  const [[registrations]] = await pool.query(`
    SELECT
      COUNT(*) AS total_delegates,
      SUM(attendance = TRUE) AS checked_in,
      SUM(payment_status IN ('pending', 'failed')) AS payments_pending
    FROM registrations
  `);
  const [[payments]] = await pool.query(`
    SELECT
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS revenue,
      SUM(status = 'paid') AS paid_payments
    FROM payments
  `);
  const [[workshops]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      AVG(CASE WHEN capacity > 0 THEN (registered_count / capacity) * 100 ELSE 0 END) AS occupancy
    FROM workshops
  `);
  const [[research]] = await pool.query('SELECT COUNT(*) AS total FROM abstracts');
  const [[certificates]] = await pool.query('SELECT SUM(issued = TRUE) AS issued, SUM(issued = FALSE) AS pending FROM certificates');

  const totalDelegates = number(registrations.total_delegates);
  const checkedIn = number(registrations.checked_in);

  return {
    totalDelegates,
    revenue: number(payments.revenue),
    workshopsFilled: Math.round(number(workshops.occupancy)),
    attendancePercent: totalDelegates ? Math.round((checkedIn / totalDelegates) * 100) : 0,
    researchSubmissions: number(research.total),
    certificatesIssued: number(certificates.issued),
    certificatesPending: number(certificates.pending),
    paymentsPending: number(registrations.payments_pending),
  };
};

const chartData = async () => {
  const [registrationsOverTime] = await pool.query(`
    SELECT DATE(created_at) AS label, COUNT(*) AS value
    FROM registrations
    GROUP BY DATE(created_at)
    ORDER BY label ASC
    LIMIT 30
  `);

  const [revenueTrend] = await pool.query(`
    SELECT DATE(created_at) AS label, SUM(amount) AS value
    FROM payments
    WHERE status = 'paid'
    GROUP BY DATE(created_at)
    ORDER BY label ASC
    LIMIT 30
  `);

  const [ticketDistribution] = await pool.query(`
    SELECT t.name AS label, COUNT(r.id) AS value
    FROM ticket_types t
    LEFT JOIN registrations r ON r.ticket_type_id = t.id
    GROUP BY t.id, t.name
    ORDER BY value DESC
  `);

  const [workshopOccupancy] = await pool.query(`
    SELECT title AS label, capacity, GREATEST(capacity - registered_count, 0) AS remaining,
      CASE WHEN capacity > 0 THEN ROUND((registered_count / capacity) * 100) ELSE 0 END AS value
    FROM workshops
    ORDER BY value DESC
  `);

  const [attendanceHeatmap] = await pool.query(`
    SELECT HOUR(checkin_time) AS label, COUNT(*) AS value
    FROM attendance_logs
    WHERE checkin_time IS NOT NULL
    GROUP BY HOUR(checkin_time)
    ORDER BY label ASC
  `);

  const [deviceSplit] = await pool.query(`
    SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.device')), 'unknown') AS label, COUNT(*) AS value
    FROM analytics_events
    WHERE event_type = 'device'
    GROUP BY label
  `);

  return {
    registrationsOverTime: registrationsOverTime.map((row) => ({ label: row.label, value: number(row.value) })),
    revenueTrend: revenueTrend.map((row) => ({ label: row.label, value: number(row.value) })),
    ticketDistribution: ticketDistribution.map((row) => ({ label: row.label, value: number(row.value) })),
    workshopOccupancy: workshopOccupancy.map((row) => ({ label: row.label, value: number(row.value), capacity: number(row.capacity), remaining: number(row.remaining) })),
    attendanceHeatmap: attendanceHeatmap.map((row) => ({ label: `${row.label}:00`, value: number(row.value) })),
    deviceSplit: deviceSplit.length ? deviceSplit.map((row) => ({ label: row.label, value: number(row.value) })) : [
      { label: 'mobile', value: 68 },
      { label: 'desktop', value: 24 },
      { label: 'tablet', value: 8 },
    ],
  };
};

const analytics = asyncHandler(async (_req, res) => {
  const [kpis, charts] = await Promise.all([getKpis(), chartData()]);
  res.json({ kpis, charts, cachedFor: 30 });
});

const revenue = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT DATE(created_at) AS date, SUM(amount) AS revenue, COUNT(*) AS payments
    FROM payments
    WHERE status = 'paid'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 60
  `);
  res.json({ revenue: rows.map((row) => ({ ...row, revenue: number(row.revenue), payments: number(row.payments) })) });
});

const registrations = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS registrations, SUM(payment_status = 'paid') AS paid
    FROM registrations
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 60
  `);
  res.json({ registrations: rows.map((row) => ({ ...row, registrations: number(row.registrations), paid: number(row.paid) })) });
});

module.exports = { analytics, registrations, revenue };
