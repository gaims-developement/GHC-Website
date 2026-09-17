import { Edit3, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

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

function CommitteesCMS({ api }) {
  const [activeTab, setActiveTab] = useState("organising");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyMember);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = () => {
    setLoading(true);
    api
      .get(`/api/admin/committees?type=${activeTab}`)
      .then((response) => setMembers(response.data.members || []))
      .catch((err) => console.error("Failed to load committee members", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, [activeTab]);

  const handleOpenModal = (member = null) => {
    setError("");
    if (member) {
      setEditingId(member.id);
      setForm(member);
    } else {
      setEditingId(null);
      setForm({ ...emptyMember, committeeType: activeTab });
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

    const request = editingId
      ? api.put(`/api/admin/committees/${editingId}`, form)
      : api.post("/api/admin/committees", form);

    request
      .then(() => {
        handleCloseModal();
        loadMembers();
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to save member");
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    
    api
      .delete(`/api/admin/committees/${id}`)
      .then(() => loadMembers())
      .catch((err) => console.error("Failed to delete member", err));
  };

  const renderPhotoUpload = () => {
    return (
      <div className="admin-field">
        <label>Photo URL</label>
        <input
          type="text"
          value={form.photoUrl || ""}
          onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
          placeholder="Enter Cloudinary URL or image link"
        />
        <div className="text-xs text-slate-500 mt-1">
          (Use the Media Library to upload and get the URL)
        </div>
      </div>
    );
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <p className="admin-eyebrow">CMS module</p>
          <h1>Committees</h1>
        </div>
        <button className="admin-btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "organising" ? "active" : ""}
          onClick={() => setActiveTab("organising")}
        >
          Organising Committee
        </button>
        <button
          className={activeTab === "jury" ? "active" : ""}
          onClick={() => setActiveTab("jury")}
        >
          Jury
        </button>
        <button
          className={activeTab === "scientific" ? "active" : ""}
          onClick={() => setActiveTab("scientific")}
        >
          Scientific Committee
        </button>
      </div>

      <div className="admin-card mt-6">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Users className="mx-auto h-8 w-8 mb-3 opacity-20" />
            <p>No members found for this committee.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Designation / Org</th>
                <th>Display Order</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Users size={16} />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{member.name}</div>
                        {member.committeeRole && <div className="text-xs text-slate-500">{member.committeeRole}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{member.designation}</div>
                    <div className="text-xs text-slate-500">{member.organization}</div>
                  </td>
                  <td>{member.displayOrder}</td>
                  <td>
                    <span className={`admin-badge ${member.status === 'published' ? 'success' : 'warning'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="admin-btn-icon" onClick={() => handleOpenModal(member)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="admin-btn-icon text-red-500 hover:bg-red-50" onClick={() => handleDelete(member.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-2xl">
            <div className="admin-modal-header">
              <h2>{editingId ? "Edit Member" : "Add Member"}</h2>
              <button className="admin-modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="admin-modal-body">
              {error && <div className="admin-error mb-4">{error}</div>}
              <form id="member-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="admin-field col-span-2">
                  <label>Committee Type</label>
                  <select
                    value={form.committeeType}
                    onChange={(e) => setForm({ ...form, committeeType: e.target.value })}
                    required
                  >
                    <option value="organising">Organising Committee</option>
                    <option value="jury">Jury</option>
                    <option value="scientific">Scientific Committee</option>
                  </select>
                </div>

                <div className="admin-field col-span-2 sm:col-span-1">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="admin-field col-span-2 sm:col-span-1">
                  <label>Committee Role (Optional)</label>
                  <input
                    type="text"
                    value={form.committeeRole || ""}
                    onChange={(e) => setForm({ ...form, committeeRole: e.target.value })}
                    placeholder="e.g. Chair, Member"
                  />
                </div>

                <div className="admin-field col-span-2 sm:col-span-1">
                  <label>Designation</label>
                  <input
                    type="text"
                    value={form.designation || ""}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  />
                </div>

                <div className="admin-field col-span-2 sm:col-span-1">
                  <label>Organization / Institution</label>
                  <input
                    type="text"
                    value={form.organization || ""}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  {renderPhotoUpload()}
                </div>

                <div className="admin-field col-span-2">
                  <label>Biography</label>
                  <textarea
                    rows={4}
                    value={form.biography || ""}
                    onChange={(e) => setForm({ ...form, biography: e.target.value })}
                  />
                </div>

                <div className="admin-field col-span-2 sm:col-span-1">
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    value={form.linkedinUrl || ""}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                  />
                </div>
                
                <div className="admin-field col-span-2 sm:col-span-1">
                  <label>Twitter URL</label>
                  <input
                    type="url"
                    value={form.twitterUrl || ""}
                    onChange={(e) => setForm({ ...form, twitterUrl: e.target.value })}
                  />
                </div>

                <div className="admin-field col-span-2 sm:col-span-1">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="admin-field col-span-2 sm:col-span-1">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-ghost" onClick={handleCloseModal}>
                Cancel
              </button>
              <button type="submit" form="member-form" className="admin-btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommitteesCMS;
