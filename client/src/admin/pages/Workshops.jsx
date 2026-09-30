import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Search, Trash2, X } from "lucide-react";
import WorkshopCard from "../components/workshops/WorkshopCard";
import WorkshopForm from "../components/workshops/WorkshopForm";
import WorkshopTable from "../components/workshops/WorkshopTable";

const filters = ["all", "draft", "published", "closed", "featured"];

function Workshops({ api }) {
  const [workshops, setWorkshops] = useState([]);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadWorkshops = useCallback(() => {
    api.get("/api/workshops?admin=1").then((response) => setWorkshops(response.data.workshops || []));
  }, [api]);

  useEffect(() => {
    loadWorkshops();
  }, [loadWorkshops]);

  const stats = useMemo(() => {
    const total = workshops.length;
    const featured = workshops.filter((workshop) => workshop.featured).length;
    const published = workshops.filter((workshop) => workshop.status === "published").length;
    const capacity = workshops.reduce((sum, workshop) => sum + Number(workshop.capacity || 0), 0);
    const registered = workshops.reduce((sum, workshop) => sum + Number(workshop.registeredCount || 0), 0);
    return { total, featured, published, seatsFilled: registered, occupancy: capacity ? Math.round((registered / capacity) * 100) : 0 };
  }, [workshops]);

  const filteredWorkshops = useMemo(() => {
    return workshops.filter((workshop) => {
      const matchesSearch = [workshop.title, workshop.faculty, workshop.workshopType, workshop.venue].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        workshop.status === filter ||
        (filter === "featured" && workshop.featured);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, workshops]);

  const openForm = (workshop = null) => {
    setEditingWorkshop(workshop);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingWorkshop(null);
    setShowForm(false);
  };

  const submitWorkshop = async (form, image) => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const valToAppend = typeof value === "object" && !(value instanceof File) ? JSON.stringify(value) : value;
        formData.append(key, valToAppend);
      }
    });
    if (image) formData.append("image", image);

    if (editingWorkshop?.id) {
      await api.put(`/api/workshops/${editingWorkshop.id}`, formData);
    } else {
      await api.post("/api/workshops", formData);
    }

    closeForm();
    loadWorkshops();
  };

  const requestDeleteWorkshop = (workshop) => {
    setDeleteTarget(workshop);
    setDeleteError("");
  };

  const cancelDeleteWorkshop = () => {
    if (deleteBusy) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDeleteWorkshop = async () => {
    if (!deleteTarget?.id) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await api.delete(`/api/workshops/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadWorkshops();
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.response?.data?.error || "Unable to delete this workshop right now.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const publishWorkshop = async (workshop) => {
    await api.patch(`/api/workshops/${workshop.id}/publish`);
    loadWorkshops();
  };

  const closeWorkshop = async (workshop) => {
    await api.patch(`/api/workshops/${workshop.id}/close`);
    loadWorkshops();
  };

  const toggleFeature = async (workshop) => {
    await api.put(`/api/workshops/${workshop.id}`, { ...workshop, featured: !workshop.featured });
    loadWorkshops();
  };

  return (
    <div className="admin-speakers-page admin-workshops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Workshop CMS</p>
            <h1>Workshop Management</h1>
            <p className="admin-muted">Manage clinical skill rooms, research labs, seat capacity and publication state.</p>
          </div>
          <button className="admin-primary-button" onClick={() => openForm()}><Plus size={18} /> Add Workshop</button>
        </div>

        <div className="workshop-kpi-row">
          <span><strong>{stats.total}</strong>Total workshops</span>
          <span><strong>{stats.featured}</strong>Featured</span>
          <span><strong>{stats.published}</strong>Published</span>
          <span><strong>{stats.seatsFilled}</strong>Seats filled</span>
          <span><strong>{stats.occupancy}%</strong>Occupancy</span>
        </div>

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workshops" /></label>
          <div className="speaker-filter-row">
            {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
        </div>
      </section>

      {showForm && (
        <section className="admin-panel">
          <WorkshopForm workshop={editingWorkshop} onSubmit={submitWorkshop} onCancel={closeForm} />
        </section>
      )}

      <section className="speaker-card-row">
        {filteredWorkshops.slice(0, 4).map((workshop) => <WorkshopCard key={workshop.id} workshop={workshop} />)}
      </section>

      <section className="admin-panel">
        <WorkshopTable
          workshops={filteredWorkshops}
          onClose={closeWorkshop}
          onDelete={requestDeleteWorkshop}
          onEdit={openForm}
          onFeature={toggleFeature}
          onPublish={publishWorkshop}
        />
      </section>

      {deleteTarget && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-workshop-title">
          <section className="admin-modal workshop-delete-modal">
            <button className="admin-modal-close" type="button" aria-label="Close delete confirmation" onClick={cancelDeleteWorkshop} disabled={deleteBusy}>
              <X size={17} />
            </button>

            <div className="workshop-delete-icon">
              <AlertTriangle size={24} />
            </div>

            <p className="admin-eyebrow">Delete workshop</p>
            <h2 id="delete-workshop-title">Remove this workshop?</h2>
            <p className="admin-muted">
              This will permanently delete <strong>{deleteTarget.title}</strong> from the CMS and public workshop listings.
            </p>

            <div className="workshop-delete-summary">
              <span>{deleteTarget.workshopType || "Workshop"}</span>
              <strong>{deleteTarget.title}</strong>
              <small>{deleteTarget.venue || "No venue set"} · {deleteTarget.capacity || 0} seats</small>
            </div>

            {deleteError && <div className="admin-inline-error">{deleteError}</div>}

            <div className="workshop-delete-actions">
              <button className="admin-secondary-button" type="button" onClick={cancelDeleteWorkshop} disabled={deleteBusy}>
                Keep workshop
              </button>
              <button className="admin-danger-button" type="button" onClick={confirmDeleteWorkshop} disabled={deleteBusy}>
                <Trash2 size={17} /> {deleteBusy ? "Deleting..." : "Delete workshop"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Workshops;
