import { Edit3, Plus, Search, Ticket, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  currency: "USD",
  capacity: "",
  remaining: "",
  featured: false,
  active: true,
};

const formatMoney = (ticket) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ticket.currency || "USD",
    maximumFractionDigits: 2,
  }).format(Number(ticket.price || 0));

const toForm = (ticket) => ({
  name: ticket.name || "",
  description: ticket.description || "",
  price: String(ticket.price ?? ""),
  currency: ticket.currency || "USD",
  capacity: String(ticket.capacity ?? ""),
  remaining: String(ticket.remaining ?? ""),
  featured: Boolean(ticket.featured),
  active: Boolean(ticket.active),
});

function AdminTickets({ api }) {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTicket, setEditingTicket] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/tickets/admin");
      setTickets(response.data.tickets || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const stats = useMemo(() => {
    const active = tickets.filter((ticket) => ticket.active).length;
    const capacity = tickets.reduce((sum, ticket) => sum + Number(ticket.capacity || 0), 0);
    const remaining = tickets.reduce((sum, ticket) => sum + Number(ticket.remaining || 0), 0);
    return { total: tickets.length, active, inactive: tickets.length - active, capacity, remaining };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = [ticket.name, ticket.description, ticket.currency].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && ticket.active) ||
        (filter === "inactive" && !ticket.active) ||
        (filter === "featured" && ticket.featured);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, tickets]);

  const openForm = (ticket = null) => {
    setEditingTicket(ticket);
    setForm(ticket ? toForm(ticket) : emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingTicket(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(false);
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Ticket name is required.";
    if (Number(form.price || 0) < 0) return "Price cannot be negative.";
    if (Number(form.capacity || 0) < 0) return "Capacity cannot be negative.";
    if (form.remaining !== "" && Number(form.remaining || 0) < 0) return "Remaining capacity cannot be negative.";
    if (form.remaining !== "" && Number(form.remaining || 0) > Number(form.capacity || 0)) {
      return "Remaining capacity cannot exceed capacity.";
    }
    return "";
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price || 0),
      currency: form.currency.trim() || "USD",
      capacity: Number(form.capacity || 0),
      remaining: form.remaining === "" ? Number(form.capacity || 0) : Number(form.remaining || 0),
      featured: form.featured,
      active: form.active,
    };

    setSaving(true);
    setFormError("");

    try {
      if (editingTicket?.id) {
        await api.put(`/api/tickets/${editingTicket.id}`, payload);
      } else {
        await api.post("/api/tickets", payload);
      }
      closeForm();
      await loadTickets();
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to save ticket.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTicket = async (ticket) => {
    setError("");
    try {
      await api.put(`/api/tickets/${ticket.id}`, { ...ticket, active: !ticket.active });
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update ticket status.");
    }
  };

  const deleteTicket = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");

    try {
      await api.delete(`/api/tickets/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadTickets();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-speakers-page admin-tickets-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Tickets CMS</p>
            <h1>Ticket Management</h1>
            <p className="admin-muted">Create categories, manage capacity, and control which tickets are available for registration.</p>
          </div>
          <button className="admin-primary-button" onClick={() => openForm()}>
            <Plus size={18} />
            Add Ticket
          </button>
        </div>

        <div className="workshop-kpi-row">
          <span><strong>{stats.total}</strong>Total tickets</span>
          <span><strong>{stats.active}</strong>Active</span>
          <span><strong>{stats.inactive}</strong>Disabled</span>
          <span><strong>{stats.capacity}</strong>Capacity</span>
          <span><strong>{stats.remaining}</strong>Remaining</span>
        </div>

        <div className="speaker-toolbar">
          <label className="speaker-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets" />
          </label>
          <div className="speaker-filter-row">
            {["all", "active", "inactive", "featured"].map((item) => (
              <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {showForm && (
        <section className="admin-panel">
          <form className="speaker-form ticket-form" onSubmit={submitTicket}>
            <div className="speaker-form-fields">
              <p className="admin-eyebrow">{editingTicket ? "Edit Ticket" : "New Ticket"}</p>
              {formError && <div className="admin-error">{formError}</div>}
              <div className="speaker-form-grid">
                <label>
                  Ticket name
                  <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
                </label>
                <label>
                  Currency
                  <input value={form.currency} onChange={(event) => updateField("currency", event.target.value.toUpperCase())} maxLength={10} />
                </label>
                <label>
                  Price
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
                </label>
                <label>
                  Capacity
                  <input type="number" min="0" step="1" value={form.capacity} onChange={(event) => updateField("capacity", event.target.value)} />
                </label>
                <label>
                  Remaining capacity
                  <input type="number" min="0" step="1" value={form.remaining} onChange={(event) => updateField("remaining", event.target.value)} />
                </label>
              </div>
              <label>
                Description
                <textarea rows="4" value={form.description} onChange={(event) => updateField("description", event.target.value)} />
              </label>
              <div className="speaker-toggle-row">
                <label><input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} /> Active</label>
                <label><input type="checkbox" checked={form.featured} onChange={(event) => updateField("featured", event.target.checked)} /> Featured</label>
              </div>
              <div className="speaker-form-actions">
                <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Ticket"}</button>
                <button type="button" onClick={closeForm}>Cancel</button>
              </div>
            </div>
            <aside className="workshop-preview ticket-preview">
              <Ticket size={28} />
              <h3>{form.name || "Ticket category"}</h3>
              <strong>{formatMoney({ price: form.price, currency: form.currency })}</strong>
              <p>{form.description || "Ticket details will appear here."}</p>
              <div className="workshop-preview-meta">
                <span>{form.remaining || 0} remaining</span>
                <span>{form.capacity || 0} capacity</span>
                <span>{form.active ? "Active" : "Disabled"}</span>
              </div>
            </aside>
          </form>
        </section>
      )}

      <section className="admin-panel">
        {loading ? (
          <div className="admin-empty-state">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="admin-empty-state">No tickets found.</div>
        ) : (
          <>
            <div className="admin-mobile-card-list">
              {filteredTickets.map((ticket) => (
                <article className="admin-mobile-data-card" key={ticket.id}>
                  <div>
                    <h3>{ticket.name}</h3>
                    <span className={`status-pill ${ticket.active ? "published" : "closed"}`}>{ticket.active ? "Active" : "Disabled"}</span>
                  </div>
                  <p>{ticket.description || "No description"}</p>
                  <dl>
                    <div><dt>Price</dt><dd>{formatMoney(ticket)}</dd></div>
                    <div><dt>Capacity</dt><dd>{ticket.capacity}</dd></div>
                    <div><dt>Remaining</dt><dd>{ticket.remaining}</dd></div>
                    <div><dt>Status</dt><dd>{ticket.active ? "Enabled" : "Disabled"}</dd></div>
                  </dl>
                  <div className="speaker-actions mobile-actions">
                    <button onClick={() => openForm(ticket)} title="Edit"><Edit3 size={16} />Edit</button>
                    <button onClick={() => toggleTicket(ticket)} title={ticket.active ? "Disable" : "Enable"}>
                      {ticket.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {ticket.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => setDeleteTarget(ticket)} title="Delete"><Trash2 size={16} />Delete</button>
                  </div>
                </article>
              ))}
            </div>

            <div className="speaker-table-wrap">
              <table className="speaker-table ticket-table">
                <thead>
                  <tr>
                    <th>Ticket name</th>
                    <th>Price</th>
                    <th>Capacity</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <strong>{ticket.name}</strong>
                        <small>{ticket.description || "No description"}</small>
                      </td>
                      <td>{formatMoney(ticket)}</td>
                      <td>{ticket.capacity}</td>
                      <td>{ticket.remaining}</td>
                      <td><span className={`status-pill ${ticket.active ? "published" : "closed"}`}>{ticket.active ? "Active" : "Disabled"}</span></td>
                      <td>
                        <div className="speaker-actions">
                          <button onClick={() => openForm(ticket)} title="Edit"><Edit3 size={16} /></button>
                          <button onClick={() => toggleTicket(ticket)} title={ticket.active ? "Disable" : "Enable"}>
                            {ticket.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button onClick={() => setDeleteTarget(ticket)} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {deleteTarget && (
        <div className="admin-modal-backdrop" role="presentation">
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-ticket-title">
            <button className="admin-modal-close" onClick={() => setDeleteTarget(null)} aria-label="Close delete confirmation">
              <X size={18} />
            </button>
            <p className="admin-eyebrow">Confirm delete</p>
            <h2 id="delete-ticket-title">Delete {deleteTarget.name}?</h2>
            <p className="admin-muted">This removes the ticket category from the CMS. Existing registrations will no longer display this ticket through joins.</p>
            <div className="speaker-form-actions">
              <button type="button" onClick={deleteTicket} disabled={saving}>{saving ? "Deleting..." : "Delete Ticket"}</button>
              <button type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminTickets;
