import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, FileText, Settings } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function VisaSettings({ onBack, api }) {
  const [settings, setSettings] = useState({
    event_name: 'Global Health Conclave (GHC)',
    event_dates: '22nd–24th November 2026',
    venue: 'New Delhi, India',
    organizer_name: 'GAIMS',
    collaboration_org: 'AIIMS Student Association',
    general_email: 'sec@gaims.org',
    conference_email: 'vpe@gaims.org',
    signatory_name: 'Dr. Example Name',
    signatory_designation: 'Organizing Secretary',
    contact_number: '+91 8169011833',
    official_logo_url: '',
    official_letterhead_url: '',
    footer_text: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get(`/api/visa-applications/settings`);
      if (res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/api/visa-applications/settings`, settings);
      alert('Settings saved successfully');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-white/50 text-center">Loading settings...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Settings className="text-blue-500" /> Visa Letter Settings
            </h1>
            <p className="text-white/50 text-sm">Configure the generated PDF invitation letters</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition-colors"
        >
          <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-[#1a2234] border border-white/10 rounded-xl p-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Event Name</label>
              <input 
                type="text" 
                value={settings.event_name}
                onChange={e => setSettings({...settings, event_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Event Dates</label>
              <input 
                type="text" 
                value={settings.event_dates}
                onChange={e => setSettings({...settings, event_dates: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-bold text-white/70">Venue</label>
              <input 
                type="text" 
                value={settings.venue}
                onChange={e => setSettings({...settings, venue: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Organizer Name</label>
              <input 
                type="text" 
                value={settings.organizer_name}
                onChange={e => setSettings({...settings, organizer_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Collaboration Organization</label>
              <input 
                type="text" 
                value={settings.collaboration_org}
                onChange={e => setSettings({...settings, collaboration_org: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-white/10" />

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Contact & Signature</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">General Queries Email</label>
              <input 
                type="text" 
                value={settings.general_email}
                onChange={e => setSettings({...settings, general_email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Conference Queries Email</label>
              <input 
                type="text" 
                value={settings.conference_email}
                onChange={e => setSettings({...settings, conference_email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Signatory Name</label>
              <input 
                type="text" 
                value={settings.signatory_name}
                onChange={e => setSettings({...settings, signatory_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Signatory Designation</label>
              <input 
                type="text" 
                value={settings.signatory_designation}
                onChange={e => setSettings({...settings, signatory_designation: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Contact Number</label>
              <input 
                type="text" 
                value={settings.contact_number}
                onChange={e => setSettings({...settings, contact_number: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
