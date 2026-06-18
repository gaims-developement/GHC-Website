const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const asyncHandler = require('../utils/asyncHandler');

const clean = (value) => (value === undefined || value === null || value === '' ? null : value);
const num = (value) => Number(value || 0);
const bool = (value) => value === true || value === 'true' || value === '1' || value === 1;
const dateTime = (value) => clean(value) ? String(value).replace('T', ' ').slice(0, 19) : null;
const log = (req, action, module, recordId, metadata) =>
  ActivityLog.logActivity({ userId: req.user?.id, action, module, recordId: String(recordId || ''), metadata });

const configs = {
  accommodations: {
    table: 'accommodations',
    key: 'accommodations',
    fields: ['name', 'hotel_type', 'address', 'contact_person', 'contact_number', 'room_capacity', 'available_rooms', 'status'],
    values: (b) => [b.name, b.hotelType || b.hotel_type || 'hotel', clean(b.address), clean(b.contactPerson || b.contact_person), clean(b.contactNumber || b.contact_number), num(b.roomCapacity || b.room_capacity), num(b.availableRooms || b.available_rooms), b.status || 'active'],
  },
  accommodationBookings: {
    table: 'accommodation_bookings',
    key: 'bookings',
    fields: ['registration_id', 'accommodation_id', 'room_number', 'check_in', 'check_out', 'booking_type', 'status'],
    values: (b) => [clean(b.registrationId || b.registration_id), b.accommodationId || b.accommodation_id, clean(b.roomNumber || b.room_number), dateTime(b.checkIn || b.check_in), dateTime(b.checkOut || b.check_out), clean(b.bookingType || b.booking_type), b.status || 'pending'],
  },
  transportRoutes: {
    table: 'transport_routes',
    key: 'routes',
    fields: ['name', 'pickup_location', 'drop_location', 'vehicle_type', 'capacity', 'status'],
    values: (b) => [b.name, clean(b.pickupLocation || b.pickup_location), clean(b.dropLocation || b.drop_location), clean(b.vehicleType || b.vehicle_type), num(b.capacity), b.status || 'active'],
  },
  transportBookings: {
    table: 'transport_bookings',
    key: 'bookings',
    fields: ['registration_id', 'route_id', 'pickup_time', 'status'],
    values: (b) => [clean(b.registrationId || b.registration_id), b.routeId || b.route_id, dateTime(b.pickupTime || b.pickup_time), b.status || 'confirmed'],
  },
  vendors: {
    table: 'vendors',
    key: 'vendors',
    fields: ['company_name', 'category_id', 'category', 'contact_person', 'email', 'phone', 'contract_value', 'contract_url', 'payment_status', 'deliverable_status', 'status'],
    values: (b) => [b.companyName || b.company_name, clean(b.categoryId || b.category_id), clean(b.category), clean(b.contactPerson || b.contact_person), clean(b.email), clean(b.phone), num(b.contractValue || b.contract_value), clean(b.contractUrl || b.contract_url), b.paymentStatus || b.payment_status || 'pending', b.deliverableStatus || b.deliverable_status || 'pending', b.status || 'active'],
  },
  vendorCategories: {
    table: 'vendor_categories',
    key: 'categories',
    fields: ['name', 'description', 'is_active'],
    values: (b) => [b.name, clean(b.description), b.isActive === undefined ? true : bool(b.isActive)],
  },
  inventory: {
    table: 'inventory',
    key: 'inventory',
    fields: ['item_name', 'category', 'quantity', 'available_quantity', '`condition`'],
    values: (b) => [b.itemName || b.item_name, clean(b.category), num(b.quantity), num(b.availableQuantity || b.available_quantity), b.condition || 'good'],
  },
  inventoryAllocations: {
    table: 'inventory_allocations',
    key: 'allocations',
    fields: ['inventory_id', 'hall_id', 'allocated_quantity', 'allocation_status', 'allocated_by', 'returned_at'],
    values: (b, req) => [b.inventoryId || b.inventory_id, clean(b.hallId || b.hall_id), num(b.allocatedQuantity || b.allocated_quantity), b.allocationStatus || b.allocation_status || 'checked_out', req.user?.id || null, dateTime(b.returnedAt || b.returned_at)],
  },
  volunteers: {
    table: 'volunteer_assignments',
    key: 'volunteers',
    fields: ['user_id', 'volunteer_name', 'role_area', 'location', 'shift_start', 'shift_end', 'attendance_status', 'notes'],
    values: (b) => [clean(b.userId || b.user_id), clean(b.volunteerName || b.volunteer_name), clean(b.roleArea || b.role_area), clean(b.location), dateTime(b.shiftStart || b.shift_start), dateTime(b.shiftEnd || b.shift_end), b.attendanceStatus || b.attendance_status || 'assigned', clean(b.notes)],
  },
  security: {
    table: 'security_incidents',
    key: 'incidents',
    fields: ['title', 'access_zone', 'incident_type', 'severity', 'status', 'description'],
    values: (b) => [b.title, clean(b.accessZone || b.access_zone), clean(b.incidentType || b.incident_type), b.severity || 'medium', b.status || 'open', clean(b.description)],
  },
  emergency: {
    table: 'emergency_contacts',
    key: 'contacts',
    fields: ['name', 'designation', 'department', 'phone', 'email', 'priority_level', 'contact_type'],
    values: (b) => [b.name, clean(b.designation), clean(b.department), clean(b.phone), clean(b.email), num(b.priorityLevel || b.priority_level || 1), clean(b.contactType || b.contact_type)],
  },
  tasks: {
    table: 'logistics_tasks',
    key: 'tasks',
    fields: ['title', 'description', 'assigned_to', 'module', 'priority', 'status', 'due_date'],
    values: (b) => [b.title, clean(b.description), clean(b.assignedTo || b.assigned_to), clean(b.module), b.priority || 'medium', b.status || 'pending', dateTime(b.dueDate || b.due_date)],
  },
};

const dashboard = asyncHandler(async (_req, res) => {
  const [[venues], [halls], [accommodation], [transport], [vendors], [inventory], [volunteers], [emergency], [tasks]] = await Promise.all([
    pool.query('SELECT COUNT(*) AS total FROM venues WHERE status = "active" OR is_active = TRUE'),
    pool.query('SELECT COUNT(*) AS total FROM halls'),
    pool.query('SELECT SUM(room_capacity) AS capacity, SUM(available_rooms) AS available FROM accommodations'),
    pool.query('SELECT COUNT(*) AS total FROM transport_bookings'),
    pool.query('SELECT SUM(contract_value) AS value, COUNT(*) AS total FROM vendors'),
    pool.query('SELECT SUM(quantity) AS total, SUM(available_quantity) AS available FROM inventory'),
    pool.query('SELECT COUNT(*) AS total FROM volunteer_assignments'),
    pool.query('SELECT COUNT(*) AS total FROM emergency_contacts'),
    pool.query('SELECT COUNT(*) AS total FROM logistics_tasks WHERE status != "completed"'),
  ]);
  const capacity = num(accommodation[0]?.capacity);
  const available = num(accommodation[0]?.available);
  const invTotal = num(inventory[0]?.total);
  const invAvailable = num(inventory[0]?.available);
  res.json({
    metrics: {
      totalVenues: num(venues[0]?.total),
      totalHalls: num(halls[0]?.total),
      accommodationOccupancy: capacity ? Math.round(((capacity - available) / capacity) * 100) : 0,
      transportBookings: num(transport[0]?.total),
      vendorContracts: num(vendors[0]?.value),
      inventoryUsage: invTotal ? Math.round(((invTotal - invAvailable) / invTotal) * 100) : 0,
      volunteerAssignments: num(volunteers[0]?.total),
      emergencyContacts: num(emergency[0]?.total),
      pendingTasks: num(tasks[0]?.total),
    },
  });
});

const list = (type) => asyncHandler(async (_req, res) => {
  const config = configs[type];
  if (!config) return res.status(404).json({ message: 'Unknown logistics type' });
  const [items] = await pool.query(`SELECT * FROM ${config.table} ORDER BY id DESC`);
  res.json({ [config.key]: items, items });
});

const save = (type) => asyncHandler(async (req, res) => {
  const config = configs[type];
  if (!config) return res.status(404).json({ message: 'Unknown logistics type' });
  const values = config.values(req.body || {}, req);
  if (req.params.id) {
    await pool.query(`UPDATE ${config.table} SET ${config.fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`, [...values, req.params.id]);
  } else {
    const [result] = await pool.query(`INSERT INTO ${config.table} (${config.fields.join(', ')}) VALUES (${config.fields.map(() => '?').join(', ')})`, values);
    req.params.id = result.insertId;
  }
  await log(req, req.params.id ? `saved_${type}` : `created_${type}`, config.table, req.params.id);
  if (type === 'inventoryAllocations') {
    const qty = num(req.body.allocatedQuantity || req.body.allocated_quantity);
    if ((req.body.allocationStatus || req.body.allocation_status || 'checked_out') === 'checked_out') {
      await pool.query('UPDATE inventory SET available_quantity = GREATEST(available_quantity - ?, 0) WHERE id = ?', [qty, req.body.inventoryId || req.body.inventory_id]);
    }
  }
  return list(type)(req, res);
});

const reports = asyncHandler(async (_req, res) => {
  const [[accommodation], [transport], [vendors], [inventory], [volunteers], [halls]] = await Promise.all([
    pool.query('SELECT name AS label, room_capacity - available_rooms AS used, room_capacity AS total FROM accommodations ORDER BY used DESC'),
    pool.query('SELECT transport_routes.name AS label, COUNT(transport_bookings.id) AS used, transport_routes.capacity AS total FROM transport_routes LEFT JOIN transport_bookings ON transport_bookings.route_id = transport_routes.id GROUP BY transport_routes.id ORDER BY used DESC'),
    pool.query('SELECT COALESCE(vendor_categories.name, vendors.category, "Unassigned") AS label, SUM(contract_value) AS value, COUNT(*) AS total FROM vendors LEFT JOIN vendor_categories ON vendor_categories.id = vendors.category_id GROUP BY label'),
    pool.query('SELECT category AS label, SUM(quantity - available_quantity) AS used, SUM(quantity) AS total FROM inventory GROUP BY category'),
    pool.query('SELECT role_area AS label, COUNT(*) AS total FROM volunteer_assignments GROUP BY role_area'),
    pool.query('SELECT status AS label, COUNT(*) AS total FROM halls GROUP BY status'),
  ]);
  res.json({ accommodation, transport, vendors, inventory, volunteers, halls });
});

const publicSync = asyncHandler(async (_req, res) => {
  const [[venues], [accommodations], [routes], [emergency]] = await Promise.all([
    pool.query('SELECT * FROM venues WHERE status = "active" OR is_active = TRUE ORDER BY name ASC'),
    pool.query('SELECT * FROM accommodations WHERE status = "active" ORDER BY name ASC'),
    pool.query('SELECT * FROM transport_routes WHERE status = "active" ORDER BY name ASC'),
    pool.query('SELECT * FROM emergency_contacts ORDER BY priority_level ASC'),
  ]);
  res.json({ venues, accommodations, transportRoutes: routes, emergencyContacts: emergency });
});

module.exports = { dashboard, list, publicSync, reports, save };
