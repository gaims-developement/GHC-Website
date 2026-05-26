import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
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
      if (value !== undefined && value !== null) formData.append(key, value);
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

  const deleteWorkshop = async (workshop) => {
    if (!window.confirm(`Delete ${workshop.title}?`)) return;
    await api.delete(`/api/workshops/${workshop.id}`);
    loadWorkshops();
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
          onDelete={deleteWorkshop}
          onEdit={openForm}
          onFeature={toggleFeature}
          onPublish={publishWorkshop}
        />
      </section>
    </div>
  );
}

export default Workshops;
