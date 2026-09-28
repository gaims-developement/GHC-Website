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
    <div className="p-6 space-y-6 text-black max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-black">
            <PlaneTakeoff className="text-blue-600" /> <span className="text-black">Visa Applications</span>
          </h1>
          <p className="text-gray-600">Manage international visa invitation requests</p>
        </div>
        <button 
          onClick={() => onNavigate('visa-settings')}
          className="bg-white hover:bg-gray-100 text-black border border-gray-300 shadow-sm px-4 py-2 rounded-lg font-bold transition-colors"
        >
          Letter Settings
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm font-semibold">Total</p>
          <p className="text-2xl font-bold text-black">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-yellow-500">
          <p className="text-gray-500 text-sm font-semibold">Pending</p>
          <p className="text-2xl font-bold text-black">{stats.pending || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-gray-500 text-sm font-semibold">Under Review</p>
          <p className="text-2xl font-bold text-black">{stats.under_review || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-gray-500 text-sm font-semibold">Approved</p>
          <p className="text-2xl font-bold text-black">{stats.approved || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
          <p className="text-gray-500 text-sm font-semibold">Generated</p>
          <p className="text-2xl font-bold text-black">{stats.letter_generated || 0}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search name, ID, passport..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm font-medium"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Letter Generated">Letter Generated</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-800">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b border-gray-200">
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
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">Loading applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">No applications found.</td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => onNavigate(`visa-application-${app.id}`)}>
                    <td className="px-6 py-4 font-mono font-bold text-black">{app.application_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-black">{app.full_name}</div>
                      <div className="text-xs text-gray-500">{app.email}</div>
                    </td>
                    <td className="px-6 py-4 text-black">{app.nationality}</td>
                    <td className="px-6 py-4 text-black">{app.participant_category}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-700 transition-colors">
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
