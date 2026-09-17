import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlaneTakeoff, Search, Filter, Eye, CheckCircle, XCircle, FileText, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function VisaApplications({ onNavigate, api }) {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [search, statusFilter]);

  const fetchApplications = async () => {
    try {
      const res = await api.get(`/api/visa-applications`, {
        params: { search, status: statusFilter }
      });
      setApplications(res.data.data);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-yellow-500/20 text-yellow-500',
      'Under Review': 'bg-blue-500/20 text-blue-500',
      'Approved': 'bg-emerald-500/20 text-emerald-500',
      'Letter Generated': 'bg-purple-500/20 text-purple-500',
      'Rejected': 'bg-red-500/20 text-red-500'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-500/20 text-gray-500'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 text-white max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PlaneTakeoff className="text-blue-500" /> Visa Applications
          </h1>
          <p className="text-white/50">Manage international visa invitation requests</p>
        </div>
        <button 
          onClick={() => onNavigate('visa-settings')}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Letter Settings
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1a2234] p-4 rounded-xl border border-white/10">
          <p className="text-white/50 text-sm">Total</p>
          <p className="text-2xl font-bold">{stats.total || 0}</p>
        </div>
        <div className="bg-[#1a2234] p-4 rounded-xl border border-white/10 border-l-4 border-l-yellow-500">
          <p className="text-white/50 text-sm">Pending</p>
          <p className="text-2xl font-bold">{stats.pending || 0}</p>
        </div>
        <div className="bg-[#1a2234] p-4 rounded-xl border border-white/10 border-l-4 border-l-blue-500">
          <p className="text-white/50 text-sm">Under Review</p>
          <p className="text-2xl font-bold">{stats.under_review || 0}</p>
        </div>
        <div className="bg-[#1a2234] p-4 rounded-xl border border-white/10 border-l-4 border-l-emerald-500">
          <p className="text-white/50 text-sm">Approved</p>
          <p className="text-2xl font-bold">{stats.approved || 0}</p>
        </div>
        <div className="bg-[#1a2234] p-4 rounded-xl border border-white/10 border-l-4 border-l-purple-500">
          <p className="text-white/50 text-sm">Generated</p>
          <p className="text-2xl font-bold">{stats.letter_generated || 0}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search name, ID, passport..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a2234] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1a2234] border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Letter Generated">Letter Generated</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-[#1a2234] rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-white/50 uppercase">
              <tr>
                <th className="px-6 py-4">Application ID</th>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Nationality</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-white/50">Loading applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-white/50">No applications found.</td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => onNavigate(`visa-application-${app.id}`)}>
                    <td className="px-6 py-4 font-mono">{app.application_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{app.full_name}</div>
                      <div className="text-xs text-white/50">{app.email}</div>
                    </td>
                    <td className="px-6 py-4">{app.nationality}</td>
                    <td className="px-6 py-4">{app.participant_category}</td>
                    <td className="px-6 py-4">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 transition-colors">
                        <ChevronRight className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
