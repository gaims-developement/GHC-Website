import { Download, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import RegistrationTable from "../components/registrations/RegistrationTable";

const filters = ["all", "pending", "paid", "failed", "refunded", "checked_in", "registered"];
const emptyForm = { fullName: "", email: "", phone: "", gender: "", institution: "", designation: "", city: "", state: "", country: "", categoryId: "", paymentStatus: "pending", amountPaid: 0, transactionId: "" };

function Registrations({ api, activePage, onNavigate }) {
  const [registrations, setRegistrations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, attendance: 0, revenue: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(0);
  const [qrRegistration, setQrRegistration] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const detailId = activePage?.startsWith("registration-") ? activePage.replace("registration-", "") : null;
  const isCreate = activePage === "registrations-create";

  const loadRegistrations = useCallback(() => {
    const params = new URLSearchParams({ limit: 25, offset: page * 25 });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filter !== "all" && ["pending", "paid", "failed", "refunded"].includes(filter)) params.set("paymentStatus", filter);
    if (filter !== "all" && ["checked_in", "registered"].includes(filter)) params.set("attendanceStatus", filter);
    if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
    if (institutionFilter) params.set("institution", institutionFilter);
    if (countryFilter) params.set("country", countryFilter);
    if (dateFilter) params.set("date", dateFilter);
    api.get(`/api/register?${params}`).then((response) => {
      setRegistrations(response.data.registrations || []);
      setStats(response.data.stats || { total: 0, paid: 0, pending: 0, attendance: 0, revenue: 0 });
    });
  }, [api, page, debouncedSearch, filter, categoryFilter, institutionFilter, countryFilter, dateFilter]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    api.get("/api/register/categories").then((response) => setCategories(response.data.categories || [])).catch(() => {});
    api.get("/api/register/dashboard").then((response) => setDashboard(response.data)).catch(() => {});
  }, [api]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((registration) => {
      const matchesSearch = [registration.fullName, registration.email, registration.institution, registration.ticketName, registration.registrationId].join(" ").toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesSearch;
    });
  }, [debouncedSearch, registrations]);

  const updateStatus = async (registration, status) => {
    await api.patch(`/api/register/${registration.id}/status`, { status });
    loadRegistrations();
  };

  const saveRegistration = async (event) => {
    event.preventDefault();
    if (detailId) await api.put(`/api/register/${detailId}`, form);
    else await api.post("/api/register", { ...form, ticketTypeId: form.categoryId });
    setForm(emptyForm);
    onNavigate("registrations");
    loadRegistrations();
  };

  useEffect(() => {
    if (!detailId) return;
    api.get(`/api/register/${detailId}`).then((response) => {
      const item = response.data.registration;
      setForm({
        fullName: item.fullName || "",
        email: item.email || "",
        phone: item.phone || "",
        gender: item.gender || "",
        institution: item.institution || "",
        designation: item.designation || "",
        city: item.city || "",
        state: item.state || "",
        country: item.country || "",
        categoryId: item.categoryId || item.ticketTypeId || "",
        paymentStatus: item.paymentStatus || "pending",
        amountPaid: item.amountPaid || 0,
        transactionId: item.transactionId || "",
      });
    }).catch(() => {});
  }, [api, detailId]);

  if (isCreate || detailId) {
    return (
      <div className="admin-speakers-page">
        <section className="admin-panel">
          <p className="admin-eyebrow">Registration</p>
          <h1>{detailId ? "Edit Registration" : "Create Registration"}</h1>
        </section>
        <section className="admin-panel">
          <form className="super-form-grid" onSubmit={saveRegistration}>
            {Object.entries({ fullName: "Full Name", email: "Email", phone: "Phone", gender: "Gender", institution: "Institution", designation: "Designation", city: "City", state: "State", country: "Country", transactionId: "Transaction ID" }).map(([key, label]) => (
              <label key={key}>{label}<input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>
            ))}
            <label>Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Payment Status<select value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}>{["pending", "paid", "failed", "refunded"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Amount Paid<input type="number" value={form.amountPaid} onChange={(event) => setForm({ ...form, amountPaid: event.target.value })} /></label>
            <button className="admin-primary-button" type="submit">Save Registration</button>
          </form>
        </section>
      </div>
    );
  }

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
            <button className="admin-primary-button" type="button" onClick={() => onNavigate("registrations-create")}><Plus size={18} /> Create</button>
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
        {dashboard && (
          <div className="workshop-kpi-row">
            <span><strong>{dashboard.stats.todaysRegistrations}</strong>Today's registrations</span>
            <span><strong>{dashboard.stats.pendingPayments}</strong>Pending payments</span>
            <span><strong>{dashboard.stats.checkinsToday}</strong>Check-ins today</span>
            <span><strong>{dashboard.stats.topRegistrationCategory}</strong>Top category</span>
            <span><strong>INR {dashboard.stats.revenueCollected}</strong>Revenue collected</span>
          </div>
        )}

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search delegates" /></label>
          <div className="speaker-filter-row">
            {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
          <label className="admin-inline-select">Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="admin-inline-select">Institution<input value={institutionFilter} onChange={(event) => setInstitutionFilter(event.target.value)} /></label>
          <label className="admin-inline-select">Country<input value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} /></label>
          <label className="admin-inline-select">Date<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
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
          onEdit={(registration) => onNavigate(`registration-${registration.id}`)}
          onCancel={async (registration) => { await api.patch(`/api/register/${registration.id}/cancel`); loadRegistrations(); }}
          onRefund={async (registration) => { await api.patch(`/api/register/${registration.id}/refund`); loadRegistrations(); }}
          onDelete={async (registration) => { await api.delete(`/api/register/${registration.id}`); loadRegistrations(); }}
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
