import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Save, FileText, Settings } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function VisaSettings({ onBack, onNavigate, api }) {
  const [settings, setSettings] = useState({
    event_name: 'Global Health Conclave (GHC)',
    event_dates: 'November 2026',
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
  const [statusMessage, setStatusMessage] = useState(null);

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else if (typeof onNavigate === 'function') {
      onNavigate('visa-applications');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get(`/api/visa-applications/settings`);
      if (res.data?.data) {
        setSettings({
          event_name: res.data.data.event_name || '',
          event_dates: res.data.data.event_dates || '',
          venue: res.data.data.venue || '',
          organizer_name: res.data.data.organizer_name || '',
          collaboration_org: res.data.data.collaboration_org || '',
          general_email: res.data.data.general_email || '',
          conference_email: res.data.data.conference_email || '',
          signatory_name: res.data.data.signatory_name || '',
          signatory_designation: res.data.data.signatory_designation || '',
          contact_number: res.data.data.contact_number || '',
          official_logo_url: res.data.data.official_logo_url || '',
          official_letterhead_url: res.data.data.official_letterhead_url || '',
          footer_text: res.data.data.footer_text || '',
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to load visa letter settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await api.post(`/api/visa-applications/settings`, settings);
      setStatusMessage({ type: 'success', text: 'Visa letter settings saved successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-black text-center font-medium">Loading settings...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-black">
      {statusMessage && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="ml-4 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full text-black transition-colors" title="Back to Visa Applications">
            <ArrowLeft className="text-black" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-black flex items-center gap-3">
              <Settings className="text-blue-600" /> <span className="text-black">Visa Letter Settings</span>
            </h1>
            <p className="text-gray-700 text-sm font-medium">Configure the generated PDF invitation letters</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
        >
          <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-8 shadow-sm text-black">
        <div>
          <h2 className="text-xl font-bold text-black mb-4">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">Event Name</label>
              <input 
                type="text" 
                value={settings.event_name}
                onChange={e => setSettings({...settings, event_name: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">Event Dates</label>
              <input 
                type="text" 
                value={settings.event_dates}
                onChange={e => setSettings({...settings, event_dates: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-bold text-black">Venue</label>
              <input 
                type="text" 
                value={settings.venue}
                onChange={e => setSettings({...settings, venue: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">Organizer Name</label>
              <input 
                type="text" 
                value={settings.organizer_name}
                onChange={e => setSettings({...settings, organizer_name: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">Collaboration Organization</label>
              <input 
                type="text" 
                value={settings.collaboration_org}
                onChange={e => setSettings({...settings, collaboration_org: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <h2 className="text-xl font-bold text-black mb-4">Contact & Signature</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">General Queries Email</label>
              <input 
                type="text" 
                value={settings.general_email}
                onChange={e => setSettings({...settings, general_email: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">Conference Queries Email</label>
              <input 
                type="text" 
                value={settings.conference_email}
                onChange={e => setSettings({...settings, conference_email: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">Signatory Name</label>
              <input 
                type="text" 
                value={settings.signatory_name}
                onChange={e => setSettings({...settings, signatory_name: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">Signatory Designation</label>
              <input 
                type="text" 
                value={settings.signatory_designation}
                onChange={e => setSettings({...settings, signatory_designation: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">Contact Number</label>
              <input 
                type="text" 
                value={settings.contact_number}
                onChange={e => setSettings({...settings, contact_number: e.target.value})}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black placeholder-gray-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
