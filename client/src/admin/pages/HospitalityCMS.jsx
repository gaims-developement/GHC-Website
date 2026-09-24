import { useState, useEffect, useCallback } from "react";
import { MapPin, MapPinned, Coffee, Hotel, Plus, Edit2, Trash2, Link as LinkIcon, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const endpoints = {
  cafe: { path: "/api/cafes", title: "Student-Friendly Cafes", icon: Coffee, key: "cafes", singular: "Cafe" },
  places: { path: "/api/stays", title: "Accommodations", icon: Hotel, key: "stays", singular: "Accommodation" }
};

function HospitalityCMS({ api }) {
  const [activeTab, setActiveTab] = useState("cafe");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(null);

  const currentConfig = endpoints[activeTab] || endpoints.cafe;

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(currentConfig.path);
      setItems(response.data[currentConfig.key] || []);
    } catch (err) {
      setError(`Failed to load ${currentConfig.title.toLowerCase()}`);
    }
    setLoading(false);
  }, [api, currentConfig]);

  useEffect(() => {
    loadItems();
    setForm(null);
  }, [activeTab, loadItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (form._id || form.id) {
        await api.put(`${currentConfig.path}/${form._id || form.id}`, form);
        setSuccess("Successfully updated!");
      } else {
        await api.post(currentConfig.path, form);
        setSuccess("Successfully created!");
      }
      setForm(null);
      loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save item.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`${currentConfig.path}/${id}`);
      setSuccess("Item deleted successfully.");
      loadItems();
    } catch (err) {
      setError("Failed to delete item.");
    }
  };

  const getEmptyForm = () => {
    return { name: "", address: "", description: "", googleMapsLink: "", status: "active" };
  };

  return (
    <div className="admin-panel max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <p className="text-[#4FC3F7] font-bold text-sm tracking-wider uppercase mb-2">Hospitality Manager</p>
          <h1 className="text-4xl font-black text-white font-['Sora'] tracking-tight">Hospitality CMS</h1>
        </div>
        {!form && (
          <button 
            onClick={() => setForm(getEmptyForm())}
            className="flex items-center gap-2 bg-[#0D47A1] hover:bg-[#1565C0] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-[#0D47A1]/20 hover:-translate-y-0.5"
          >
            <Plus size={18} /> Add New {currentConfig.singular}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-8 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl w-fit border border-black/10 dark:border-white/10">
        {Object.entries(endpoints).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-black ${
                isActive 
                  ? "bg-[#4FC3F7] shadow-md ring-1 ring-black/10 font-bold" 
                  : "bg-white/90 hover:bg-white shadow-sm border border-gray-200 hover:border-gray-300"
              }`}
              style={{ color: "#000000" }}
            >
              <Icon size={18} className="text-black" />
              <span className="text-black font-bold">{config.title}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3">
            <RefreshCw size={18} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {form ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0b1b33] border border-[#1e3a5f] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0D47A1] to-[#4FC3F7]"></div>
          
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold font-['Sora'] text-white">
              {form._id || form.id ? `Edit ${currentConfig.singular}` : `Add New ${currentConfig.singular}`}
            </h2>
            <button onClick={() => setForm(null)} className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10">Cancel</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Name</label>
                <input 
                  required 
                  type="text" 
                  value={form.name || ""} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="w-full bg-[#061528] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4FC3F7] transition-colors" 
                  placeholder={activeTab === "cafe" ? "e.g. SDA Market Cafes" : "e.g. Le Meridien Delhi"} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Address / Area</label>
                <input 
                  required 
                  type="text" 
                  value={form.address || ""} 
                  onChange={(e) => setForm({...form, address: e.target.value})} 
                  className="w-full bg-[#061528] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4FC3F7] transition-colors" 
                  placeholder={activeTab === "cafe" ? "e.g. Opposite IIT Delhi, 2 km from AIIMS" : "e.g. Janpath, Connaught Place"} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <LinkIcon size={14} /> Google Maps Link
              </label>
              <input type="url" value={form.googleMapsLink || ""} onChange={(e) => setForm({...form, googleMapsLink: e.target.value})} className="w-full bg-[#061528] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4FC3F7] transition-colors" placeholder="https://maps.google.com/..." />
              {form.googleMapsLink && (
                <div className="mt-4 rounded-xl overflow-hidden border border-[#1e3a5f] h-48 relative bg-black/20 flex items-center justify-center">
                  <iframe src={form.googleMapsLink.replace('/place/', '/search/').replace('/maps/', '/maps/embed?pb=')} className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" title="Map preview"></iframe>
                  <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                    <MapPin className="text-[#4FC3F7] h-8 w-8" />
                    <span className="text-sm font-bold bg-[#061528]/80 px-3 py-1 rounded-full text-[#4FC3F7]">Map Link Active</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Description</label>
              <textarea 
                rows={4} 
                value={form.description || ""} 
                onChange={(e) => setForm({...form, description: e.target.value})} 
                className="w-full bg-[#061528] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4FC3F7] transition-colors resize-none" 
                placeholder={activeTab === "cafe" ? "Provide details about the cafe, student vibe, Wi-Fi, pricing, etc." : "Provide details about the accommodation, proximity to venue, amenities, etc."} 
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button type="submit" className="bg-gradient-to-r from-[#0D47A1] to-[#4FC3F7] hover:from-[#1565C0] hover:to-[#5fd4ff] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#4FC3F7]/20 flex items-center gap-2">
                Save Location
              </button>
              <label className="flex items-center gap-3 cursor-pointer ml-4">
                <div className={`w-12 h-6 rounded-full transition-colors relative ${form.status === 'active' ? 'bg-[#4FC3F7]' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.status === 'active' ? 'translate-x-6' : ''}`}></div>
                </div>
                <input type="checkbox" className="hidden" checked={form.status === 'active'} onChange={(e) => setForm({...form, status: e.target.checked ? 'active' : 'inactive'})} />
                <span className="text-sm font-semibold text-white">Active</span>
              </label>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center"><RefreshCw className="animate-spin text-[#4FC3F7]" /></div>
          ) : items.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
              <currentConfig.icon className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No {currentConfig.title} Yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Add your first location to display it on the public landing page map.</p>
              <button onClick={() => setForm(getEmptyForm())} className="text-[#4FC3F7] hover:text-white font-bold transition-colors">
                + Add {currentConfig.title.replace(/s$/, '')}
              </button>
            </div>
          ) : (
            items.map((item) => (
              <motion.div key={item._id || item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0b1b33] border border-[#1e3a5f] hover:border-[#4FC3F7]/50 rounded-[1.5rem] p-6 transition-colors group flex flex-col justify-between h-full relative overflow-hidden">
                {!item.status || item.status === 'inactive' && (
                  <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">Draft</div>
                )}
                <div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0D47A1]/20 to-[#4FC3F7]/20 rounded-2xl flex items-center justify-center mb-5 border border-white/5 text-[#4FC3F7]">
                    <currentConfig.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-gray-400 text-sm mb-6 flex items-start gap-2">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-[#4FC3F7]" />
                    <span className="line-clamp-2">{item.address}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-[#1e3a5f] pt-5 mt-auto">
                  <button onClick={() => setForm(item)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(item._id || item.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default HospitalityCMS;
