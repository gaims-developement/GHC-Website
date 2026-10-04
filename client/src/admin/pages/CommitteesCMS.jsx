import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  Building2,
  Check,
  Edit3,
  Globe,
  Layers,
  LayoutGrid,
  List,
  Microscope,
  Plus,
  Scale,
  Search,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { getImageUrl } from "../../config/api";

const LinkedinIcon = ({ size = 15, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = ({ size = 15, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const GripHandleIcon = ({ size = 16, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="9" cy="5" r="1.5" fill="currentColor" />
    <circle cx="9" cy="12" r="1.5" fill="currentColor" />
    <circle cx="9" cy="19" r="1.5" fill="currentColor" />
    <circle cx="15" cy="5" r="1.5" fill="currentColor" />
    <circle cx="15" cy="12" r="1.5" fill="currentColor" />
    <circle cx="15" cy="19" r="1.5" fill="currentColor" />
  </svg>
);

function initials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CM"
  );
}

const defaultCommittees = [
  { id: 1, slug: "organising", name: "Organising Committee", displayOrder: 1 },
  { id: 2, slug: "jury", name: "Jury Board", displayOrder: 2 },
  { id: 3, slug: "scientific", name: "Scientific Committee", displayOrder: 3 },
];

const emptyMember = {
  committeeType: "organising",
  name: "",
  designation: "",
  organization: "",
  committeeRole: "",
  biography: "",
  photoUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  displayOrder: 0,
  status: "published",
};

function MemberAvatar({ photoUrl, name, size = "4rem", fontSize = "1.2rem" }) {
  const [imgError, setImgError] = useState(false);
  const src = photoUrl ? getImageUrl(photoUrl) : null;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "16px",
        background: "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        border: "2px solid #ffffff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        color: "#64748B",
        fontSize: fontSize,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}

function CommitteesCMS({ api, initialTab = "organising" }) {
  const [committeesList, setCommitteesList] = useState(defaultCommittees);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyMember);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommitteesModalOpen, setIsCommitteesModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const fileInputRef = useRef(null);

  // New Committee form state inside Committees modal
  const [newCommitteeName, setNewCommitteeName] = useState("");
  const [committeeSaving, setCommitteeSaving] = useState(false);
  const [committeeError, setCommitteeError] = useState("");
  const [editingCommittee, setEditingCommittee] = useState(null);

  // Drag and drop reordering state
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [orderSavedToast, setOrderSavedToast] = useState(false);

  // Custom Delete Confirmation Modal states (pop-up instead of browser alert)
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [committeeToDelete, setCommitteeToDelete] = useState(null);
  const [isDeletingCommittee, setIsDeletingCommittee] = useState(false);

  // Reorder persistence
  const persistOrder = (updatedList) => {
    api
      .put("/api/admin/committees/definitions/reorder", {
        items: updatedList.map((c) => ({ id: c.id, displayOrder: c.displayOrder })),
      })
      .then(() => {
        setOrderSavedToast(true);
        setTimeout(() => setOrderSavedToast(false), 2200);
      })
      .catch((err) => console.error("Failed to reorder committees", err));
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === undefined || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...committeesList];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setCommitteesList(reordered);
    setDraggedIdx(null);
    setDragOverIdx(null);
    persistOrder(reordered);
  };

  const moveCommittee = (fromIdx, direction) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= committeesList.length) return;

    const updated = [...committeesList];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setCommitteesList(reordered);
    persistOrder(reordered);
  };

  // Member reordering persistence (List / Table view)
  const [draggedMemberIdx, setDraggedMemberIdx] = useState(null);
  const [dragOverMemberIdx, setDragOverMemberIdx] = useState(null);
  const [memberOrderSavedToast, setMemberOrderSavedToast] = useState(false);

  const persistMemberOrder = (updatedList) => {
    api
      .put("/api/admin/committees/reorder", {
        items: updatedList.map((m) => ({ id: m.id, displayOrder: m.displayOrder })),
      })
      .then(() => {
        setMemberOrderSavedToast(true);
        setTimeout(() => setMemberOrderSavedToast(false), 2200);
      })
      .catch((err) => console.error("Failed to reorder committee members", err));
  };

  const handleMemberDragStart = (e, index) => {
    setDraggedMemberIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleMemberDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverMemberIdx !== index) {
      setDragOverMemberIdx(index);
    }
  };

  const handleMemberDragLeave = () => {
    setDragOverMemberIdx(null);
  };

  const handleMemberDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedMemberIdx === null || draggedMemberIdx === undefined || draggedMemberIdx === targetIdx) {
      setDraggedMemberIdx(null);
      setDragOverMemberIdx(null);
      return;
    }

    const updated = [...members];
    const [moved] = updated.splice(draggedMemberIdx, 1);
    updated.splice(targetIdx, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setMembers(reordered);
    setDraggedMemberIdx(null);
    setDragOverMemberIdx(null);
    persistMemberOrder(reordered);
  };

  const moveMember = (fromIdx, direction) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= members.length) return;

    const updated = [...members];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setMembers(reordered);
    persistMemberOrder(reordered);
  };

  // Load committee definitions (names)
  const loadCommittees = () => {
    api
      .get("/api/admin/committees/definitions")
      .then((res) => {
        if (res.data.committees?.length) {
          setCommitteesList(res.data.committees);
        }
      })
      .catch(() => {});
  };

  // Load members for active tab
  const loadMembers = () => {
    setLoading(true);
    api
      .get(`/api/admin/committees?type=${activeTab}`)
      .then((response) => setMembers(response.data.members || []))
      .catch((err) => console.error("Failed to load committee members", err))
      .finally(() => setLoading(false));

    // Also fetch all members for overview counts
    api
      .get(`/api/admin/committees`)
      .then((response) => setAllMembers(response.data.members || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadCommittees();
  }, []);

  useEffect(() => {
    loadMembers();
  }, [activeTab]);

  // Map of slug to committee name
  const committeeNameMap = useMemo(() => {
    const map = {};
    committeesList.forEach((c) => {
      map[c.slug] = c.name;
    });
    return map;
  }, [committeesList]);

  // Counts per committee (Organising committee includes all members)
  const memberCounts = useMemo(() => {
    const counts = { total: allMembers.length };
    allMembers.forEach((m) => {
      counts[m.committeeType] = (counts[m.committeeType] || 0) + 1;
    });
    counts["organising"] = allMembers.length;
    return counts;
  }, [allMembers]);

  // Filtered members by search
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const query = search.toLowerCase();
    return members.filter((m) => {
      const match = [m.name, m.designation, m.organization, m.committeeRole, m.biography]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return match.includes(query);
    });
  }, [members, search]);

  const handleOpenModal = (member = null) => {
    setError("");
    if (member) {
      setEditingId(member.id);
      const currentIdx = members.findIndex((m) => m.id === member.id);
      const safeOrder = member.displayOrder && Number(member.displayOrder) > 0
        ? Number(member.displayOrder)
        : (currentIdx >= 0 ? currentIdx + 1 : members.length);
      setForm({ ...member, displayOrder: safeOrder });
    } else {
      setEditingId(null);
      const maxOrder = members.reduce((max, m) => Math.max(max, Number(m.displayOrder || 0)), 0);
      setForm({ ...emptyMember, committeeType: activeTab, displayOrder: maxOrder + 1 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setForm(emptyMember);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      displayOrder: Number(form.displayOrder || 0),
    };

    const request = editingId
      ? api.put(`/api/admin/committees/${editingId}`, payload)
      : api.post("/api/admin/committees", payload);

    request
      .then(() => {
        handleCloseModal();
        loadMembers();
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to save committee member");
      })
      .finally(() => setSaving(false));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setSaving(true);
      const response = await api.post("/api/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, photoUrl: response.data.asset?.url || "" }));
    } catch {
      setError("Failed to upload photo. You might need Media permissions.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (memberOrId, maybeName) => {
    if (memberOrId && typeof memberOrId === "object") {
      setMemberToDelete(memberOrId);
    } else {
      const found = members.find((m) => m.id === memberOrId) || { id: memberOrId, name: maybeName };
      setMemberToDelete(found);
    }
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      setIsDeletingMember(true);
      await api.delete(`/api/admin/committees/${memberToDelete.id}`);
      setMemberToDelete(null);
      loadMembers();
    } catch (err) {
      console.error("Failed to delete member", err);
      setError(err.response?.data?.message || "Failed to remove member");
    } finally {
      setIsDeletingMember(false);
    }
  };

  // Add or update a committee name
  const handleSaveCommittee = (e) => {
    e.preventDefault();
    if (!newCommitteeName.trim()) return;

    setCommitteeSaving(true);
    setCommitteeError("");

    if (editingCommittee) {
      api
        .put(`/api/admin/committees/definitions/${editingCommittee.id}`, {
          name: newCommitteeName.trim(),
        })
        .then(() => {
          setNewCommitteeName("");
          setEditingCommittee(null);
          loadCommittees();
        })
        .catch((err) => {
          setCommitteeError(err.response?.data?.message || "Failed to update committee");
        })
        .finally(() => setCommitteeSaving(false));
    } else {
      api
        .post("/api/admin/committees/definitions", {
          name: newCommitteeName.trim(),
        })
        .then(() => {
          setNewCommitteeName("");
          loadCommittees();
        })
        .catch((err) => {
          setCommitteeError(err.response?.data?.message || "Failed to add committee");
        })
        .finally(() => setCommitteeSaving(false));
    }
  };

  const handleDeleteCommittee = (committee) => {
    setCommitteeToDelete(committee);
  };

  const confirmDeleteCommittee = async () => {
    if (!committeeToDelete) return;
    try {
      setIsDeletingCommittee(true);
      await api.delete(`/api/admin/committees/definitions/${committeeToDelete.id}`);
      const deletedSlug = committeeToDelete.slug;
      setCommitteeToDelete(null);
      loadCommittees();
      if (activeTab === deletedSlug) {
        setActiveTab("organising");
      }
    } catch (err) {
      console.error("Failed to delete committee", err);
      setCommitteeError(err.response?.data?.message || "Failed to delete committee");
    } finally {
      setIsDeletingCommittee(false);
    }
  };

  // Get active committee object
  const activeCommitteeObj = committeesList.find((c) => c.slug === activeTab) || {
    name: activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + " Committee",
  };

  return (
    <div className="admin-speakers-page">
      {/* Top Header Card */}
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Conclave Leadership</p>
            <h1>Committees & Jury Management</h1>
            <p className="admin-muted">
              Manage organizing committee leaders, jury adjudicators, and scientific review board members.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Committees Button (Opens Committees Name Manager) */}
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                setCommitteeError("");
                setIsCommitteesModalOpen(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Layers size={17} style={{ color: "var(--ghc-primary)" }} />
              <span>Committees ({committeesList.length})</span>
            </button>

            {/* Add Member Button */}
            <button className="admin-primary-button" onClick={() => handleOpenModal()}>
              <Plus size={18} />
              Add Member
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Strip */}
        <div className="committee-stats-strip">
          <div className="committee-stat-card">
            <div className="committee-stat-icon" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
              <Users size={22} />
            </div>
            <div className="committee-stat-content">
              <small>Total Members</small>
              <strong>{memberCounts.total || 0}</strong>
            </div>
          </div>

          {committeesList.slice(0, 3).map((comm, idx) => {
            const colors = [
              { bg: "#F0FDF4", text: "#16A34A", icon: Building2 },
              { bg: "#FFFBEB", text: "#D97706", icon: Scale },
              { bg: "#FAF5FF", text: "#9333EA", icon: Microscope },
            ][idx % 3];
            const Icon = colors.icon;

            return (
              <div
                key={comm.slug}
                className="committee-stat-card"
                style={{
                  cursor: "pointer",
                  borderColor: activeTab === comm.slug ? "var(--ghc-primary)" : undefined,
                }}
                onClick={() => setActiveTab(comm.slug)}
              >
                <div className="committee-stat-icon" style={{ background: colors.bg, color: colors.text }}>
                  <Icon size={22} />
                </div>
                <div className="committee-stat-content">
                  <small>{comm.name}</small>
                  <strong>{memberCounts[comm.slug] || 0}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar: Dynamic Segmented Tabs, Search & View Switcher */}
        <div className="committee-toolbar">
          <div
            className="committee-segmented-tabs"
            style={{ overflowX: "auto", maxWidth: "100%", paddingBottom: "4px" }}
            role="tablist"
          >
            {committeesList.map((comm) => (
              <button
                key={comm.slug}
                type="button"
                className={`committee-segmented-tab ${activeTab === comm.slug ? "active" : ""}`}
                onClick={() => setActiveTab(comm.slug)}
              >
                <span>{comm.name}</span>
                <span className="tab-count">{memberCounts[comm.slug] || 0}</span>
              </button>
            ))}

            <button
              type="button"
              className="committee-segmented-tab"
              onClick={() => setIsCommitteesModalOpen(true)}
              style={{ color: "var(--ghc-primary)", borderStyle: "dashed" }}
              title="Manage committee names"
            >
              <Plus size={14} />
              <span>Add / Manage</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div className="speaker-search-box" style={{ minWidth: "16rem", minHeight: "2.5rem" }}>
              <Search size={16} style={{ color: "#94A3B8" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member, role, org..."
                style={{ fontSize: "0.85rem" }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* View Mode Toggle Buttons */}
            <div style={{ display: "inline-flex", background: "#F1F5F9", padding: "3px", borderRadius: "10px", gap: "2px" }}>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid Cards View"
                style={{
                  padding: "0.45rem 0.65rem",
                  border: "none",
                  borderRadius: "8px",
                  background: viewMode === "grid" ? "#ffffff" : "transparent",
                  color: viewMode === "grid" ? "var(--ghc-primary)" : "#64748B",
                  boxShadow: viewMode === "grid" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table Directory View"
                style={{
                  padding: "0.45rem 0.65rem",
                  border: "none",
                  borderRadius: "8px",
                  background: viewMode === "table" ? "#ffffff" : "transparent",
                  color: viewMode === "table" ? "var(--ghc-primary)" : "#64748B",
                  boxShadow: viewMode === "table" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              {activeCommitteeObj.name}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0.2rem 0 0" }}>
              {activeTab === "organising"
                ? `Showing ${filteredMembers.length} members (includes organising committee & all committee members).`
                : `Showing ${filteredMembers.length} enrolled members in this committee.`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-panel" style={{ textAlign: "center", padding: "3rem", color: "#64748B" }}>
            <p>Loading committee members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="admin-panel" style={{ textAlign: "center", padding: "3.5rem 1rem", color: "#64748B" }}>
            <Users size={44} style={{ margin: "0 auto 1rem", color: "#CBD5E1", strokeWidth: 1.5 }} />
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1E293B", marginBottom: "0.4rem" }}>
              No members found
            </h3>
            <p style={{ fontSize: "0.88rem", maxWidth: "26rem", margin: "0 auto 1.25rem" }}>
              {search
                ? "No committee members matched your search query."
                : `There are currently no members enrolled under ${activeCommitteeObj.name}.`}
            </p>
            <button className="admin-primary-button" onClick={() => handleOpenModal()}>
              <Plus size={16} /> Add Member to {activeCommitteeObj.name}
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View: Rich Member Cards */
          <div className="committee-cards-grid">
            {filteredMembers.map((member) => (
              <div key={member.id} className="committee-member-card">
                <div>
                  <div className="committee-card-header">
                    <MemberAvatar photoUrl={member.photoUrl} name={member.name} />
                    <div className="committee-card-badges">
                      <span className="committee-order-chip">#{member.displayOrder ?? 0}</span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: member.status === "published" ? "#DCFCE7" : "#F1F5F9",
                          color: member.status === "published" ? "#166534" : "#475569",
                          textTransform: "capitalize",
                        }}
                      >
                        {member.status || "draft"}
                      </span>
                    </div>
                  </div>

                  <div className="committee-card-body">
                    <h3>{member.name}</h3>

                    {member.committeeRole && (
                      <div className="committee-role-pill">
                        <Award size={13} />
                        <span>{member.committeeRole}</span>
                      </div>
                    )}

                    {activeTab === "organising" && member.committeeType && member.committeeType !== "organising" && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "6px",
                          background: "#F1F5F9",
                          color: "#475569",
                          border: "1px solid #E2E8F0",
                          marginBottom: "0.35rem",
                          width: "fit-content",
                        }}
                        title={`Assigned Committee: ${committeeNameMap[member.committeeType] || member.committeeType}`}
                      >
                        <Building2 size={11} />
                        <span>{committeeNameMap[member.committeeType] || member.committeeType}</span>
                      </div>
                    )}

                    {member.designation && <div className="designation">{member.designation}</div>}

                    {member.organization && (
                      <div className="org">
                        <Building2 size={13} style={{ color: "#94A3B8" }} />
                        <span>{member.organization}</span>
                      </div>
                    )}

                    {member.biography && (
                      <p style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "0.6rem", lineHeight: "1.45" }}>
                        {member.biography.length > 120 ? `${member.biography.slice(0, 120)}...` : member.biography}
                      </p>
                    )}
                  </div>
                </div>

                <div className="committee-card-footer">
                  <div className="committee-social-row">
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="committee-social-link"
                        title="LinkedIn"
                      >
                        <LinkedinIcon size={14} />
                      </a>
                    )}
                    {member.twitterUrl && (
                      <a
                        href={member.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="committee-social-link"
                        title="Twitter / X"
                      >
                        <TwitterIcon size={14} />
                      </a>
                    )}
                  </div>

                  <div className="committee-actions-row">
                    <button
                      className="committee-action-btn"
                      onClick={() => handleOpenModal(member)}
                      title="Edit Member"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="committee-action-btn delete"
                      onClick={() => handleDelete(member)}
                      title="Delete Member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table / List View: Directory Table with Drag-to-Reorder */
          <div className="admin-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", padding: "0.25rem 0.25rem 0" }}>
              <div style={{ fontSize: "0.8rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <GripHandleIcon size={14} style={{ color: "#94A3B8" }} />
                <span>
                  <strong>Drag</strong> rows by the grip handle to change member display order, or use the <strong>↑ ↓</strong> arrows.
                </span>
              </div>
              {memberOrderSavedToast && (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16A34A", display: "flex", alignItems: "center", gap: "0.3rem", background: "#DCFCE7", padding: "0.2rem 0.65rem", borderRadius: "999px" }}>
                  <Check size={12} strokeWidth={3} /> Member order saved
                </span>
              )}
            </div>

            <div className="speaker-table-wrap">
              <table className="speaker-table">
                <thead>
                  <tr>
                    <th style={{ width: "42px", textAlign: "center" }}></th>
                    <th>Member</th>
                    <th>Role & Committee</th>
                    <th>Designation & Org</th>
                    <th style={{ width: "115px" }}>Order</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, idx) => {
                    const isDragging = draggedMemberIdx === idx;
                    const isDragOver = dragOverMemberIdx === idx;

                    return (
                      <tr
                        key={member.id}
                        draggable={!search.trim()}
                        onDragStart={(e) => handleMemberDragStart(e, idx)}
                        onDragOver={(e) => handleMemberDragOver(e, idx)}
                        onDragLeave={handleMemberDragLeave}
                        onDrop={(e) => handleMemberDrop(e, idx)}
                        onDragEnd={() => {
                          setDraggedMemberIdx(null);
                          setDragOverMemberIdx(null);
                        }}
                        className={`committee-table-row ${isDragging ? "is-row-dragging" : ""} ${isDragOver ? "is-row-drag-over" : ""}`}
                      >
                        {/* Drag Handle */}
                        <td style={{ width: "42px", textAlign: "center", padding: "0.5rem" }}>
                          <div
                            className="committee-drag-handle"
                            title={search.trim() ? "Clear search to reorder" : "Drag to change display order"}
                            style={{ width: "1.75rem", height: "1.75rem", margin: "0 auto" }}
                          >
                            <GripHandleIcon size={16} />
                          </div>
                        </td>

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                            <MemberAvatar photoUrl={member.photoUrl} name={member.name} size="2.6rem" fontSize="0.9rem" />
                            <div>
                              <strong style={{ color: "#0F172A", fontSize: "0.95rem" }}>{member.name}</strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: "var(--ghc-primary-soft)",
                              color: "var(--ghc-primary)",
                            }}
                          >
                            <Award size={12} />
                            {member.committeeRole || "Member"}
                          </span>
                          {activeTab === "organising" && member.committeeType && member.committeeType !== "organising" && (
                            <div
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: "#475569",
                                marginTop: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <Building2 size={11} />
                              <span>{committeeNameMap[member.committeeType] || member.committeeType}</span>
                            </div>
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1E293B" }}>
                            {member.designation || "—"}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#64748B" }}>{member.organization || "—"}</div>
                        </td>

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <span className="committee-order-badge">#{member.displayOrder ?? idx + 1}</span>
                            <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
                              <button
                                type="button"
                                className="committee-move-btn"
                                disabled={idx === 0 || !!search.trim()}
                                onClick={() => moveMember(idx, -1)}
                                title="Move Up"
                              >
                                <ArrowUp size={10} strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                className="committee-move-btn"
                                disabled={idx === filteredMembers.length - 1 || !!search.trim()}
                                onClick={() => moveMember(idx, 1)}
                                title="Move Down"
                              >
                                <ArrowDown size={10} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`status-pill ${member.status}`}>{member.status}</span>
                        </td>

                        <td>
                          <div className="speaker-actions" style={{ justifyContent: "flex-end" }}>
                            <button onClick={() => handleOpenModal(member)} title="Edit">
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => handleDelete(member)} title="Delete">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          COMMITTEES MANAGEMENT MODAL (Opened by "Committees" button)
          ======================================================== */}
      {isCommitteesModalOpen && (
        <div
          className="admin-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCommitteesModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "22px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "1.5rem 1.75rem 1.25rem",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div>
                <p className="admin-eyebrow" style={{ margin: "0 0 0.2rem" }}>
                  Configuration
                </p>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Manage Committees
                </h2>
                <p style={{ fontSize: "0.84rem", color: "#64748B", margin: "0.25rem 0 0" }}>
                  All committee names listed here will automatically appear in the dropdown when adding or editing members.
                </p>
              </div>
              <button
                type="button"
                className="speaker-close-form-btn"
                onClick={() => setIsCommitteesModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: "1.5rem 1.75rem", flex: 1 }}>
              {committeeError && (
                <div
                  style={{
                    background: "#FEE2E2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  {committeeError}
                </div>
              )}

              {/* Add / Edit Committee Form */}
              <form
                onSubmit={handleSaveCommittee}
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  marginBottom: "1.5rem",
                  background: "#F8FAFC",
                  padding: "1rem",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div style={{ flex: 1 }}>
                  <input
                    value={newCommitteeName}
                    onChange={(e) => setNewCommitteeName(e.target.value)}
                    placeholder="Enter new committee name (e.g. Souvenir Committee)..."
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.95rem",
                      borderRadius: "10px",
                      border: "1.5px solid #CBD5E1",
                      fontSize: "0.88rem",
                      fontWeight: 500,
                      outline: "none",
                      background: "#ffffff",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="speaker-btn-primary"
                  disabled={committeeSaving || !newCommitteeName.trim()}
                  style={{ padding: "0.65rem 1.25rem", fontSize: "0.85rem", flexShrink: 0 }}
                >
                  {editingCommittee ? "Update" : "Add Committee"}
                </button>
                {editingCommittee && (
                  <button
                    type="button"
                    className="speaker-btn-secondary"
                    onClick={() => {
                      setEditingCommittee(null);
                      setNewCommitteeName("");
                    }}
                    style={{ padding: "0.65rem 1rem", fontSize: "0.85rem" }}
                  >
                    Cancel
                  </button>
                )}
              </form>

              {/* List of Committees */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 0.25rem" }}>
                  <p style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", margin: 0 }}>
                    Committees Order ({committeesList.length})
                  </p>
                  {orderSavedToast && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16A34A", display: "flex", alignItems: "center", gap: "0.3rem", background: "#DCFCE7", padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                      <Check size={12} strokeWidth={3} /> Order saved
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "#64748B",
                    background: "#F8FAFC",
                    padding: "0.55rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px dashed #CBD5E1",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <GripHandleIcon size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
                  <span>
                    <strong>Drag</strong> any committee to change its display order across tabs and dropdowns, or use the <strong>↑ ↓</strong> arrows.
                  </span>
                </div>

                {committeesList.map((comm, idx) => {
                  const isDragging = draggedIdx === idx;
                  const isDragOver = dragOverIdx === idx;

                  return (
                    <div
                      key={comm.id || comm.slug}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={() => {
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      className={`committee-drag-item ${isDragging ? "is-dragging" : ""} ${isDragOver ? "is-drag-over" : ""}`}
                    >
                      {/* Left: Drag handle, order badge, icon, and info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flex: 1, minWidth: 0 }}>
                        <div
                          className="committee-drag-handle"
                          title="Drag to change display order"
                        >
                          <GripHandleIcon size={16} />
                        </div>

                        <span className="committee-order-badge" title={`Display Order #${idx + 1}`}>
                          #{idx + 1}
                        </span>

                        <div
                          style={{
                            width: "2.1rem",
                            height: "2.1rem",
                            borderRadius: "8px",
                            background: "var(--ghc-primary-soft)",
                            color: "var(--ghc-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={15} />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong style={{ fontSize: "0.92rem", color: "#0F172A", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {comm.name}
                          </strong>
                          <span style={{ fontSize: "0.76rem", color: "#64748B" }}>
                            slug: <code>{comm.slug}</code> • {memberCounts[comm.slug] || 0} members
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick move buttons + edit/delete */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginRight: "0.25rem" }}>
                          <button
                            type="button"
                            className="committee-move-btn"
                            disabled={idx === 0}
                            onClick={() => moveCommittee(idx, -1)}
                            title="Move Up"
                          >
                            <ArrowUp size={11} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            className="committee-move-btn"
                            disabled={idx === committeesList.length - 1}
                            onClick={() => moveCommittee(idx, 1)}
                            title="Move Down"
                          >
                            <ArrowDown size={11} strokeWidth={2.5} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="committee-action-btn"
                          onClick={() => {
                            setEditingCommittee(comm);
                            setNewCommitteeName(comm.name);
                          }}
                          title="Edit Committee Name"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="committee-action-btn delete"
                          onClick={() => handleDeleteCommittee(comm)}
                          title="Delete Committee"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "1rem 1.75rem",
                borderTop: "1px solid #F1F5F9",
                background: "#FAFAFC",
              }}
            >
              <button
                type="button"
                className="speaker-btn-primary"
                onClick={() => setIsCommitteesModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD / EDIT MEMBER MODAL (With Dynamic Committee Dropdown)
          ======================================================== */}
      {isModalOpen && (
        <div
          className="admin-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "22px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "1.5rem 1.75rem 1.25rem",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div>
                <p className="admin-eyebrow" style={{ margin: "0 0 0.2rem" }}>
                  Leadership Enrollment
                </p>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  {editingId ? `Edit: ${form.name}` : "Add Committee Member"}
                </h2>
                <p style={{ fontSize: "0.84rem", color: "#64748B", margin: "0.25rem 0 0" }}>
                  Configure role assignment, organizational credentials, and public leadership profile.
                </p>
              </div>
              <button
                type="button"
                className="speaker-close-form-btn"
                onClick={handleCloseModal}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: "1.5rem 1.75rem", flex: 1 }}>
              {error && (
                <div
                  style={{
                    background: "#FEE2E2",
                    border: "1px solid #FECACA",
                    color: "#DC2626",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  {error}
                </div>
              )}

              <form id="member-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Photo Dropzone Box */}
                <div
                  className="speaker-photo-dropzone-box"
                  style={{ background: "#F8FAFC", padding: "1rem 1.25rem" }}
                >
                  <MemberAvatar photoUrl={form.photoUrl} name={form.name} size="4.5rem" fontSize="1.3rem" />
                  <div className="speaker-dropzone-controls">
                    <p style={{ margin: "0 0 0.25rem", fontWeight: 700, color: "#1E293B", fontSize: "0.9rem" }}>
                      Member Photo / Portrait
                    </p>
                    <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", color: "#64748B" }}>
                      Square headshot recommended (PNG, JPG, WebP).
                    </p>
                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        className="speaker-upload-file-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                      >
                        <Upload size={14} />
                        {form.photoUrl ? "Change Photo" : "Upload Photo"}
                      </button>
                      {form.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, photoUrl: "" }))}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#DC2626",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Committee Dropdown */}
                <div className="speaker-field-item">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <label className="speaker-field-label" style={{ margin: 0 }}>
                      <span>Committee Assignment <span className="req">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setIsCommitteesModalOpen(true);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--ghc-primary)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <Plus size={13} />
                      Manage Committees
                    </button>
                  </div>
                  <div className="speaker-field-input-box">
                    <select
                      value={form.committeeType}
                      onChange={(e) => setForm((prev) => ({ ...prev, committeeType: e.target.value }))}
                      required
                      style={{
                        fontWeight: 700,
                        fontSize: "0.92rem",
                        color: "#0F172A",
                        background: "#FAF9FF",
                        borderColor: "var(--ghc-primary-muted)",
                      }}
                    >
                      {committeesList.map((comm) => (
                        <option key={comm.slug} value={comm.slug}>
                          {comm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Name & Role */}
                <div className="speaker-fields-grid-2">
                  <div className="speaker-field-item">
                    <label className="speaker-field-label">
                      <span>Full Name <span className="req">*</span></span>
                    </label>
                    <div className="speaker-field-input-box">
                      <input
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Dr. Shubham Anand"
                        required
                      />
                    </div>
                  </div>

                  <div className="speaker-field-item">
                    <label className="speaker-field-label">
                      <span>Committee Role</span>
                      <span className="hint">e.g. Chairperson, Convenor</span>
                    </label>
                    <div className="speaker-field-input-box">
                      <input
                        value={form.committeeRole || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, committeeRole: e.target.value }))}
                        placeholder="e.g. Organising Secretary"
                      />
                    </div>
                  </div>
                </div>

                {/* Designation & Organization */}
                <div className="speaker-fields-grid-2">
                  <div className="speaker-field-item">
                    <label className="speaker-field-label">
                      <span>Professional Designation</span>
                    </label>
                    <div className="speaker-field-input-box">
                      <input
                        value={form.designation || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))}
                        placeholder="e.g. Head of Department"
                      />
                    </div>
                  </div>

                  <div className="speaker-field-item">
                    <label className="speaker-field-label">
                      <span>Organization / Hospital</span>
                    </label>
                    <div className="speaker-field-input-box">
                      <input
                        value={form.organization || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, organization: e.target.value }))}
                        placeholder="e.g. AIIMS / GAIMS"
                      />
                    </div>
                  </div>
                </div>

                {/* Biography */}
                <div className="speaker-field-item">
                  <label className="speaker-field-label">
                    <span>Biography & Background</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.biography || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, biography: e.target.value }))}
                    placeholder="Brief background and career highlights of the committee member..."
                  />
                </div>

                {/* Social Profiles */}
                <div className="speaker-fields-grid-2">
                  <div className="speaker-field-item">
                    <label className="speaker-field-label">
                      <span>LinkedIn Profile</span>
                    </label>
                    <div className="speaker-field-input-box has-icon">
                      <LinkedinIcon className="field-icon" size={15} />
                      <input
                        type="url"
                        value={form.linkedinUrl || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>

                  <div className="speaker-field-item">
                    <label className="speaker-field-label">
                      <span>Twitter / X</span>
                    </label>
                    <div className="speaker-field-input-box has-icon">
                      <TwitterIcon className="field-icon" size={15} />
                      <input
                        type="url"
                        value={form.twitterUrl || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, twitterUrl: e.target.value }))}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Display Order & Status */}
                <div className="speaker-fields-grid-2">
                  <div className="speaker-field-item">
                    <label className="speaker-field-label">
                      <span>Display Order</span>
                      <span className="hint">Lower = shown first</span>
                    </label>
                    <div className="speaker-field-input-box">
                      <input
                        type="number"
                        value={form.displayOrder ?? 0}
                        onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="speaker-field-item">
                    <label className="speaker-field-label">
                      <span>Publication Status</span>
                    </label>
                    <div className="speaker-field-input-box">
                      <select
                        value={form.status || "published"}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                        style={{ fontWeight: 600 }}
                      >
                        <option value="published">Published (Visible)</option>
                        <option value="draft">Draft (Hidden)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                padding: "1rem 1.75rem",
                borderTop: "1px solid #F1F5F9",
                background: "#FAFAFC",
              }}
            >
              <button type="button" className="speaker-btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button type="submit" form="member-form" className="speaker-btn-primary" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRM DELETE MEMBER POPUP MODAL
          ======================================================== */}
      {memberToDelete && (
        <div
          className="admin-confirm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingMember) {
              setMemberToDelete(null);
            }
          }}
        >
          <div className="admin-confirm-dialog">
            {/* Modal Body */}
            <div style={{ padding: "1.75rem 1.75rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                {/* Warning Icon Badge */}
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "14px",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)",
                  }}
                >
                  <AlertTriangle size={24} strokeWidth={2.2} />
                </div>

                {/* Text Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", margin: "0 0 0.35rem" }}>
                    Remove Committee Member
                  </h3>
                  <p style={{ fontSize: "0.86rem", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                    Are you sure you want to remove this member? They will no longer appear on the website or committee listings.
                  </p>
                </div>
              </div>

              {/* Member Card Preview Box */}
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                }}
              >
                <MemberAvatar
                  photoUrl={memberToDelete.photoUrl}
                  name={memberToDelete.name}
                  size="2.75rem"
                  fontSize="0.95rem"
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ fontSize: "0.95rem", color: "#0F172A", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {memberToDelete.name}
                  </strong>
                  <div style={{ fontSize: "0.78rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "2px" }}>
                    {memberToDelete.committeeRole && (
                      <span style={{ fontWeight: 700, color: "var(--ghc-primary)" }}>
                        {memberToDelete.committeeRole}
                      </span>
                    )}
                    {memberToDelete.committeeRole && memberToDelete.designation && <span>•</span>}
                    {memberToDelete.designation && (
                      <span>{memberToDelete.designation}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                padding: "1rem 1.75rem",
                background: "#FAFAFC",
                borderTop: "1px solid #F1F5F9",
              }}
            >
              <button
                type="button"
                className="speaker-btn-secondary"
                disabled={isDeletingMember}
                onClick={() => setMemberToDelete(null)}
                style={{
                  padding: "0.65rem 1.25rem",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  borderRadius: "10px",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingMember}
                onClick={confirmDeleteMember}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.65rem 1.35rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  border: "none",
                  background: "#DC2626",
                  color: "#ffffff",
                  cursor: isDeletingMember ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
                  transition: "all 0.15s ease",
                  opacity: isDeletingMember ? 0.7 : 1,
                }}
              >
                <Trash2 size={15} />
                <span>{isDeletingMember ? "Removing..." : "Remove Member"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRM DELETE COMMITTEE POPUP MODAL
          ======================================================== */}
      {committeeToDelete && (
        <div
          className="admin-confirm-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingCommittee) {
              setCommitteeToDelete(null);
            }
          }}
        >
          <div className="admin-confirm-dialog">
            <div style={{ padding: "1.75rem 1.75rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "14px",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={24} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", margin: "0 0 0.35rem" }}>
                    Delete Committee
                  </h3>
                  <p style={{ fontSize: "0.86rem", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                    Are you sure you want to delete <strong>&ldquo;{committeeToDelete.name}&rdquo;</strong>? Members currently assigned to this committee will remain in the database.
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                padding: "1rem 1.75rem",
                background: "#FAFAFC",
                borderTop: "1px solid #F1F5F9",
              }}
            >
              <button
                type="button"
                className="speaker-btn-secondary"
                disabled={isDeletingCommittee}
                onClick={() => setCommitteeToDelete(null)}
                style={{ padding: "0.65rem 1.25rem", fontSize: "0.88rem", borderRadius: "10px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCommittee}
                onClick={confirmDeleteCommittee}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.65rem 1.35rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  borderRadius: "10px",
                  border: "none",
                  background: "#DC2626",
                  color: "#ffffff",
                  cursor: isDeletingCommittee ? "not-allowed" : "pointer",
                }}
              >
                <Trash2 size={15} />
                <span>{isDeletingCommittee ? "Deleting..." : "Delete Committee"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommitteesCMS;
