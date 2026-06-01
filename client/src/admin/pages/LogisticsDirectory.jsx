import { Bus, Hotel, PackageCheck, Plus, ShieldCheck, Siren, Users, BriefcaseBusiness } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const configs = {
  accommodation: {
    title: "Accommodation",
    endpoint: "/api/accommodations",
    key: "accommodations",
    icon: Hotel,
    empty: { name: "", hotelType: "hotel", address: "", contactPerson: "", contactNumber: "", roomCapacity: 0, availableRooms: 0, status: "active" },
    fields: [["name", "Name"], ["hotelType", "Type", "select", ["hotel", "hostel", "guest_house"]], ["address", "Address"], ["contactPerson", "Contact Person"], ["contactNumber", "Contact Number"], ["roomCapacity", "Room Capacity", "number"], ["availableRooms", "Available Rooms", "number"], ["status", "Status", "select", ["active", "inactive"]]],
  },
  transport: {
    title: "Transport Routes",
    endpoint: "/api/transport-routes",
    key: "routes",
    icon: Bus,
    empty: { name: "", pickupLocation: "", dropLocation: "", vehicleType: "", capacity: 0, status: "active" },
    fields: [["name", "Name"], ["pickupLocation", "Pickup Location"], ["dropLocation", "Drop Location"], ["vehicleType", "Vehicle Type"], ["capacity", "Capacity", "number"], ["status", "Status", "select", ["active", "inactive"]]],
  },
  vendors: {
    title: "Vendors",
    endpoint: "/api/vendors",
    key: "vendors",
    icon: BriefcaseBusiness,
    empty: { companyName: "", category: "", contactPerson: "", email: "", phone: "", contractValue: 0, contractUrl: "", paymentStatus: "pending", deliverableStatus: "pending", status: "active" },
    fields: [["companyName", "Company Name"], ["category", "Category"], ["contactPerson", "Contact Person"], ["email", "Email"], ["phone", "Phone"], ["contractValue", "Contract Value", "number"], ["contractUrl", "Contract URL"], ["paymentStatus", "Payment", "select", ["pending", "partial", "paid"]], ["deliverableStatus", "Deliverables", "select", ["pending", "in_progress", "completed"]], ["status", "Status"]],
  },
  inventory: {
    title: "Inventory",
    endpoint: "/api/inventory",
    key: "inventory",
    icon: PackageCheck,
    empty: { itemName: "", category: "", quantity: 0, availableQuantity: 0, condition: "good" },
    fields: [["itemName", "Item Name"], ["category", "Category"], ["quantity", "Quantity", "number"], ["availableQuantity", "Available Quantity", "number"], ["condition", "Condition", "select", ["good", "damaged", "maintenance"]]],
  },
  volunteers: {
    title: "Volunteer Deployment",
    endpoint: "/api/volunteers",
    key: "volunteers",
    icon: Users,
    empty: { volunteerName: "", roleArea: "", location: "", shiftStart: "", shiftEnd: "", attendanceStatus: "assigned", notes: "" },
    fields: [["volunteerName", "Volunteer Name"], ["roleArea", "Role Area"], ["location", "Location"], ["shiftStart", "Shift Start", "datetime-local"], ["shiftEnd", "Shift End", "datetime-local"], ["attendanceStatus", "Attendance", "select", ["assigned", "checked_in", "completed", "absent"]], ["notes", "Notes", "textarea"]],
  },
  security: {
    title: "Security",
    endpoint: "/api/security",
    key: "incidents",
    icon: ShieldCheck,
    empty: { title: "", accessZone: "", incidentType: "", severity: "medium", status: "open", description: "" },
    fields: [["title", "Title"], ["accessZone", "Access Zone"], ["incidentType", "Incident Type"], ["severity", "Severity", "select", ["low", "medium", "high", "critical"]], ["status", "Status", "select", ["open", "investigating", "resolved"]], ["description", "Description", "textarea"]],
  },
  emergency: {
    title: "Emergency Contacts",
    endpoint: "/api/emergency",
    key: "contacts",
    icon: Siren,
    empty: { name: "", designation: "", department: "", phone: "", email: "", priorityLevel: 1, contactType: "" },
    fields: [["name", "Name"], ["designation", "Designation"], ["department", "Department"], ["phone", "Phone"], ["email", "Email"], ["priorityLevel", "Priority", "number"], ["contactType", "Contact Type"]],
  },
};

function LogisticsDirectory({ api, type = "accommodation" }) {
  const config = configs[type] || configs.accommodation;
  const Icon = config.icon;
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(config.empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get(config.endpoint);
      setItems(response.data[config.key] || response.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${config.title.toLowerCase()}.`);
    }
  }, [api, config.endpoint, config.key, config.title]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  useEffect(() => {
    queueMicrotask(() => {
      setForm(config.empty);
      setEditing(null);
    });
  }, [config.empty]);

  const normalized = useMemo(() => items.map((item) => ({
    ...item,
    titleText: item.name || item.company_name || item.item_name || item.volunteer_name || item.title,
    subtitle: item.address || item.category || item.role_area || item.department || item.pickup_location || item.access_zone,
  })), [items]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editing?.id) await api.put(`${config.endpoint}/${editing.id}`, form);
      else await api.post(config.endpoint, form);
      setMessage(`${config.title} saved.`);
      setForm(config.empty);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to save ${config.title.toLowerCase()}.`);
    }
  };

  const edit = (item) => {
    setEditing(item);
    setForm({
      ...config.empty,
      ...item,
      companyName: item.company_name,
      contactPerson: item.contact_person,
      contactNumber: item.contact_number,
      roomCapacity: item.room_capacity,
      availableRooms: item.available_rooms,
      pickupLocation: item.pickup_location,
      dropLocation: item.drop_location,
      vehicleType: item.vehicle_type,
      contractValue: item.contract_value,
      contractUrl: item.contract_url,
      paymentStatus: item.payment_status,
      deliverableStatus: item.deliverable_status,
      itemName: item.item_name,
      availableQuantity: item.available_quantity,
      volunteerName: item.volunteer_name,
      roleArea: item.role_area,
      shiftStart: item.shift_start?.slice(0, 16),
      shiftEnd: item.shift_end?.slice(0, 16),
      attendanceStatus: item.attendance_status,
      accessZone: item.access_zone,
      incidentType: item.incident_type,
      priorityLevel: item.priority_level,
      contactType: item.contact_type,
    });
  };

  return (
    <div className="admin-speakers-page logistics-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Logistics & Operations</p>
        <h1>{config.title}</h1>
        <p className="admin-muted">Database-driven logistics records with allocation and audit logging.</p>
      </section>
      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-panel">
        <form className="speaker-form" onSubmit={submit}>
          <div className="speaker-form-fields">
            <div className="speaker-form-grid">
              {config.fields.map(([field, label, inputType, options]) => <label key={field}>{label}{renderField({ field, inputType, options, form, updateField })}</label>)}
            </div>
            <div className="speaker-form-actions">
              <button type="submit"><Plus size={16} /> Save</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm(config.empty); }}>Cancel</button>}
            </div>
          </div>
        </form>
      </section>
      <section className="payment-card-grid">
        {normalized.map((item) => (
          <article className="payment-card" key={item.id}>
            <Icon size={20} />
            <strong>{item.titleText}</strong>
            <p>{item.subtitle || "No details"}</p>
            <dl>
              {item.status && <div><dt>Status</dt><dd>{item.status}</dd></div>}
              {item.capacity !== undefined && <div><dt>Capacity</dt><dd>{item.capacity}</dd></div>}
              {item.available_rooms !== undefined && <div><dt>Available</dt><dd>{item.available_rooms}</dd></div>}
              {item.available_quantity !== undefined && <div><dt>Available</dt><dd>{item.available_quantity}</dd></div>}
              {item.contract_value !== undefined && <div><dt>Contract</dt><dd>₹{Number(item.contract_value || 0).toLocaleString("en-IN")}</dd></div>}
            </dl>
            <div className="payment-card-actions"><button onClick={() => edit(item)}>Edit</button></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function renderField({ field, inputType, options = [], form, updateField }) {
  if (inputType === "select") return <select value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>;
  if (inputType === "textarea") return <textarea rows="3" value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)} />;
  return <input type={inputType || "text"} value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value)} />;
}

export default LogisticsDirectory;
