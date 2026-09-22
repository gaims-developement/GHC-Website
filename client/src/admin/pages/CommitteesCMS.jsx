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

function CommitteesCMS({ api, initialTab = "organising" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setSaving(true);
      const response = await api.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm({ ...form, photoUrl: response.data.asset?.url || "" });
    } catch (err) {
      setError("Failed to upload photo. You might need Media permissions.");
    } finally {
      setSaving(false);
    }
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
      <div className="flex flex-col items-center justify-center mb-2">
        <div className="relative group cursor-pointer">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center relative transition-colors group-hover:border-primary-500 group-hover:bg-primary-50">
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-10 h-10 text-slate-300" />
            )}
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <span className="text-white text-xs font-medium tracking-wide">Upload</span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={saving}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Upload photo"
          />
        </div>
        <div className="text-xs text-slate-500 mt-3 font-medium">
          {saving ? "Uploading..." : "Click avatar to upload photo"}
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
            <div className="admin-modal-body p-0 overflow-y-auto" style={{ maxHeight: '80vh' }}>
              {error && <div className="admin-error mx-8 mt-6">{error}</div>}
              <form id="member-form" onSubmit={handleSubmit} className="flex flex-col">
                
                {/* Header / Photo Section */}
                <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-8 flex flex-col items-center">
                  {renderPhotoUpload()}
                </div>

                <div className="p-8 grid grid-cols-2 gap-x-8 gap-y-6">
                  
                  {/* Basic Info Section */}
                  <div className="col-span-2">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">Committee Type</label>
                        <select
                          value={form.committeeType}
                          onChange={(e) => setForm({ ...form, committeeType: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                        >
                          <option value="organising">Organising Committee</option>
                          <option value="jury">Jury</option>
                          <option value="scientific">Scientific Committee</option>
                        </select>
                      </div>

                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">Full Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                          placeholder="e.g. Dr. Jane Smith"
                        />
                      </div>
                      
                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">Designation</label>
                        <input
                          type="text"
                          value={form.designation || ""}
                          onChange={(e) => setForm({ ...form, designation: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                          placeholder="e.g. Chief Medical Officer"
                        />
                      </div>

                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">Organization / Institution</label>
                        <input
                          type="text"
                          value={form.organization || ""}
                          onChange={(e) => setForm({ ...form, organization: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                          placeholder="e.g. General Hospital"
                        />
                      </div>

                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">Committee Role (Optional)</label>
                        <input
                          type="text"
                          value={form.committeeRole || ""}
                          onChange={(e) => setForm({ ...form, committeeRole: e.target.value })}
                          placeholder="e.g. Chair, Member"
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="col-span-2 border-slate-100 my-2" />

                  {/* Additional Info Section */}
                  <div className="col-span-2">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Additional Details</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      <div className="admin-field col-span-2">
                        <label className="text-slate-600 font-medium">Biography</label>
                        <textarea
                          rows={4}
                          value={form.biography || ""}
                          onChange={(e) => setForm({ ...form, biography: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900 resize-none"
                          placeholder="A brief bio..."
                        />
                      </div>

                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">LinkedIn URL</label>
                        <input
                          type="url"
                          value={form.linkedinUrl || ""}
                          onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      
                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">Twitter URL</label>
                        <input
                          type="url"
                          value={form.twitterUrl || ""}
                          onChange={(e) => setForm({ ...form, twitterUrl: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                          placeholder="https://twitter.com/..."
                        />
                      </div>

                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">Display Order</label>
                        <input
                          type="number"
                          value={form.displayOrder}
                          onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                        />
                      </div>
                      
                      <div className="admin-field col-span-2 sm:col-span-1">
                        <label className="text-slate-600 font-medium">Status</label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-shadow text-slate-900"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                  </div>

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
