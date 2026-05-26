import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import SpeakerCard from "../components/speakers/SpeakerCard";
import SpeakerForm from "../components/speakers/SpeakerForm";
import SpeakerTable from "../components/speakers/SpeakerTable";

const filters = ["all", "published", "draft", "featured", "keynote"];

function Speakers({ api }) {
  const [speakers, setSpeakers] = useState([]);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadSpeakers = useCallback(() => {
    api.get("/api/speakers?admin=1").then((response) => setSpeakers(response.data.speakers || []));
  }, [api]);

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  const filteredSpeakers = useMemo(() => {
    return speakers.filter((speaker) => {
      const matchesSearch = [speaker.name, speaker.institution, speaker.topic].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        speaker.status === filter ||
        (filter === "featured" && speaker.featured) ||
        (filter === "keynote" && speaker.keynote);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, speakers]);

  const openForm = (speaker = null) => {
    setEditingSpeaker(speaker);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingSpeaker(null);
    setShowForm(false);
  };

  const submitSpeaker = async (form, photo) => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    if (photo) formData.append("photo", photo);

    if (editingSpeaker?.id) {
      await api.put(`/api/speakers/${editingSpeaker.id}`, formData);
    } else {
      await api.post("/api/speakers", formData);
    }

    closeForm();
    loadSpeakers();
  };

  const deleteSpeaker = async (speaker) => {
    if (!window.confirm(`Delete ${speaker.name}?`)) return;
    await api.delete(`/api/speakers/${speaker.id}`);
    loadSpeakers();
  };

  const publishSpeaker = async (speaker) => {
    await api.patch(`/api/speakers/${speaker.id}/publish`);
    loadSpeakers();
  };

  const toggleFeature = async (speaker) => {
    await api.put(`/api/speakers/${speaker.id}`, { ...speaker, featured: !speaker.featured });
    loadSpeakers();
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Speaker CMS</p>
            <h1>Speaker Management</h1>
            <p className="admin-muted">Create, publish, feature and order speakers for the public GHC site.</p>
          </div>
          <button className="admin-primary-button" onClick={() => openForm()}>
            <Plus size={18} />
            Add Speaker
          </button>
        </div>
        <div className="speaker-toolbar">
          <div className="speaker-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search speakers" />
          </div>
          <div className="speaker-filter-row">
            {filters.map((item) => (
              <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {showForm && (
        <section className="admin-panel">
          <SpeakerForm key={editingSpeaker?.id || "new-speaker"} speaker={editingSpeaker} onSubmit={submitSpeaker} onCancel={closeForm} />
        </section>
      )}

      <section className="speaker-card-row">
        {filteredSpeakers.slice(0, 4).map((speaker) => (
          <SpeakerCard key={speaker.id} speaker={speaker} onEdit={openForm} />
        ))}
      </section>

      <section className="admin-panel">
        <SpeakerTable speakers={filteredSpeakers} onEdit={openForm} onDelete={deleteSpeaker} onPublish={publishSpeaker} onFeature={toggleFeature} />
      </section>
    </div>
  );
}

export default Speakers;
