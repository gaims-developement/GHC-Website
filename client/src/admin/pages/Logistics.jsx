import { BriefcaseBusiness, Bus, Hotel, MapPinned, PackageCheck, ShieldCheck, Siren, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function Logistics({ api, onNavigate }) {
  const [metrics, setMetrics] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/logistics/dashboard");
      setMetrics(response.data.metrics || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load logistics dashboard.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const cards = [
    ["Total Venues", metrics.totalVenues || 0, MapPinned, "venues"],
    ["Total Halls", metrics.totalHalls || 0, BriefcaseBusiness, "halls"],
    ["Accommodation Occupancy", `${metrics.accommodationOccupancy || 0}%`, Hotel, "accommodation"],
    ["Transport Bookings", metrics.transportBookings || 0, Bus, "transport"],
    ["Vendor Contracts", money(metrics.vendorContracts), BriefcaseBusiness, "vendors"],
    ["Inventory Usage", `${metrics.inventoryUsage || 0}%`, PackageCheck, "inventory"],
    ["Volunteer Assignments", metrics.volunteerAssignments || 0, Users, "volunteers"],
    ["Emergency Contacts", metrics.emergencyContacts || 0, Siren, "emergency"],
    ["Pending Tasks", metrics.pendingTasks || 0, ShieldCheck, "security"],
  ];

  return (
    <div className="admin-speakers-page logistics-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Logistics & Operations</p>
        <h1>Logistics Dashboard</h1>
        <p className="admin-muted">Coordinate venues, halls, accommodation, transport, vendors, inventory, volunteers and emergency readiness.</p>
      </section>
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-kpi-grid">
        {cards.map(([label, value, Icon, page]) => (
          <button className="admin-kpi-card marketing-kpi-button" key={label} onClick={() => onNavigate(page)}>
            <Icon size={20} />
            <strong>{value}</strong>
            <span>{label}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

export default Logistics;
