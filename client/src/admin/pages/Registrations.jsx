import { Download, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import RegistrationTable from "../components/registrations/RegistrationTable";

const filters = ["all", "pending", "approved", "rejected", "attendance"];

function Registrations({ api }) {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, attendance: 0, revenue: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [qrRegistration, setQrRegistration] = useState(null);

  const loadRegistrations = useCallback(() => {
    api.get(`/api/register?limit=25&offset=${page * 25}`).then((response) => {
      setRegistrations(response.data.registrations || []);
      setStats(response.data.stats || { total: 0, paid: 0, pending: 0, attendance: 0, revenue: 0 });
    });
  }, [api, page]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((registration) => {
      const matchesSearch = [registration.fullName, registration.email, registration.institution, registration.ticketName, registration.registrationId].join(" ").toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        registration.registrationStatus === filter ||
        (filter === "attendance" && registration.attendance);
      const matchesTicket = ticketFilter === "all" || String(registration.ticketTypeId) === String(ticketFilter);
      return matchesSearch && matchesFilter && matchesTicket;
    });
  }, [debouncedSearch, filter, registrations, ticketFilter]);

  const ticketOptions = useMemo(() => {
    const map = new Map();
    registrations.forEach((registration) => map.set(registration.ticketTypeId, registration.ticketName));
    return Array.from(map.entries()).filter(([id]) => id);
  }, [registrations]);

  const updateStatus = async (registration, status) => {
    await api.patch(`/api/register/${registration.id}/status`, { status });
    loadRegistrations();
  };

  const checkIn = async (registration) => {
    await api.patch(`/api/register/${registration.id}/checkin`, { attendance: !registration.attendance });
    loadRegistrations();
  };

  return (
    <div className="admin-speakers-page admin-registrations-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Registration CMS</p>
            <h1>Delegate Registrations</h1>
            <p className="admin-muted">Track delegate passes, approvals, check-in and revenue signals.</p>
          </div>
          <div className="export-button-row">
            <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/register/export.csv`}><Download size={18} /> CSV</a>
            <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/register/export.xls`}><Download size={18} /> Excel</a>
          </div>
        </div>

        <div className="workshop-kpi-row">
          <span><strong>{stats.total}</strong>Total registrations</span>
          <span><strong>{stats.paid}</strong>Paid</span>
          <span><strong>{stats.pending}</strong>Pending</span>
          <span><strong>{stats.attendance}</strong>Attendance</span>
          <span><strong>INR {stats.revenue}</strong>Revenue</span>
        </div>

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search delegates" /></label>
          <div className="speaker-filter-row">
            {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
          <label className="admin-inline-select">Ticket
            <select value={ticketFilter} onChange={(event) => setTicketFilter(event.target.value)}>
              <option value="all">All tickets</option>
              {ticketOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
        </div>
      </section>

      {qrRegistration && (
        <section className="admin-panel qr-panel">
          <div className="speaker-page-top">
            <div>
              <p className="admin-eyebrow">Check-in QR</p>
              <h2>{qrRegistration.registrationId}</h2>
              <p className="admin-muted">{qrRegistration.fullName}</p>
            </div>
            <button className="admin-primary-button" onClick={() => setQrRegistration(null)}>Close</button>
          </div>
          {qrRegistration.qrCode && <img src={qrRegistration.qrCode} alt="" />}
        </section>
      )}

      <section className="admin-panel">
        <RegistrationTable
          registrations={filteredRegistrations}
          onApprove={(registration) => updateStatus(registration, "approved")}
          onCheckIn={checkIn}
          onReject={(registration) => updateStatus(registration, "rejected")}
          onViewQr={setQrRegistration}
        />
        <div className="pagination-row">
          <button disabled={page === 0} onClick={() => setPage((current) => Math.max(current - 1, 0))}>Previous</button>
          <span>Page {page + 1}</span>
          <button onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </section>
    </div>
  );
}

export default Registrations;
