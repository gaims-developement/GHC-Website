import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, FileText, CheckCircle, XCircle, 
  RefreshCcw, Download, User, Book, BriefcaseMedical, 
  PlaneTakeoff, Send, AlertTriangle, Eye
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function VisaApplicationDetails({ activePage, onNavigate, api }) {
  const id = activePage.replace("visa-application-", "");
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchApp = async () => {
    try {
      const res = await api.get(`/api/visa-applications/${id}`);
      setApp(res.data.data);
      setAdminNotes(res.data.data.admin_notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const updateStatus = async (status, notes = adminNotes) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/visa-applications/${id}/status`, {
        status,
        admin_notes: notes
      });
      fetchApp();
      setShowRejectModal(false);
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const generateLetter = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/visa-applications/${id}/generate-letter`, {});
      alert('Letter generated and email sent successfully!');
      fetchApp();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate letter');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-white/50 text-center">Loading details...</div>;
  if (!app) return <div className="p-10 text-red-500 text-center">Application not found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate('visa-applications')} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
          <ArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Application {app.application_id}
            <span className="text-sm px-3 py-1 bg-white/10 rounded-full font-normal">
              {app.status}
            </span>
          </h1>
          <p className="text-white/50 text-sm">Submitted on {new Date(app.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1a2234] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><User className="text-blue-400"/> Personal Details</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-white/50">Full Name</p>
                <p className="text-white font-medium">{app.full_name}</p>
              </div>
              <div>
                <p className="text-white/50">Date of Birth</p>
                <p className="text-white font-medium">{new Date(app.date_of_birth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-white/50">Gender</p>
                <p className="text-white font-medium">{app.gender || '-'}</p>
              </div>
              <div>
                <p className="text-white/50">Nationality</p>
                <p className="text-white font-medium">{app.nationality}</p>
              </div>
              <div>
                <p className="text-white/50">Email</p>
                <p className="text-white font-medium">{app.email}</p>
              </div>
              <div>
                <p className="text-white/50">Mobile</p>
                <p className="text-white font-medium">{app.mobile}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a2234] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Book className="text-blue-400"/> Passport Details</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm mb-6">
              <div>
                <p className="text-white/50">Passport Number</p>
                <p className="text-white font-medium">{app.passport_number}</p>
              </div>
              <div>
                <p className="text-white/50">Issuing Country</p>
                <p className="text-white font-medium">{app.passport_issuing_country}</p>
              </div>
              <div>
                <p className="text-white/50">Issue Date</p>
                <p className="text-white font-medium">{app.passport_issue_date ? new Date(app.passport_issue_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-white/50">Expiry Date</p>
                <p className="text-white font-medium">{new Date(app.passport_expiry_date).toLocaleDateString()}</p>
              </div>
            </div>
            <a 
              href={app.passport_document} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FileText className="w-4 h-4" /> View Passport Document
            </a>
          </div>

          <div className="bg-[#1a2234] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BriefcaseMedical className="text-blue-400"/> Professional & GHC Info</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-white/50">Organisation</p>
                <p className="text-white font-medium">{app.organisation}</p>
              </div>
              <div>
                <p className="text-white/50">Designation</p>
                <p className="text-white font-medium">{app.designation || '-'}</p>
              </div>
              <div>
                <p className="text-white/50">Country of Residence</p>
                <p className="text-white font-medium">{app.country_of_residence || '-'}</p>
              </div>
              <div>
                <p className="text-white/50">Participant Category</p>
                <p className="text-white font-medium">
                  {app.participant_category} 
                  {app.participant_category_other ? ` (${app.participant_category_other})` : ''}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-white/50">GHC Registration ID</p>
                <p className="text-white font-mono font-medium bg-white/5 inline-block px-2 py-1 rounded mt-1">{app.ghc_registration_id}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a2234] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><PlaneTakeoff className="text-blue-400"/> Travel Details</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-white/50">Arrival Date</p>
                <p className="text-white font-medium">{new Date(app.arrival_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-white/50">Departure Date</p>
                <p className="text-white font-medium">{new Date(app.departure_date).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-white/50">Accommodation Details</p>
                <p className="text-white font-medium mt-1">{app.accommodation_details || 'Not provided'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-white/50">Purpose of Visit</p>
                <p className="text-white font-medium mt-1">{app.purpose_of_visit}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1a2234] border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Admin Actions</h2>
            
            <div className="space-y-3 mb-6">
              <label className="text-sm font-bold text-white/70">Admin Notes</label>
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-blue-500"
                rows="3"
              />
              <button 
                onClick={() => updateStatus(app.status, adminNotes)}
                disabled={actionLoading || adminNotes === (app.admin_notes || '')}
                className="w-full bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Save Notes
              </button>
            </div>

            <hr className="border-white/10 mb-6" />

            <div className="space-y-3">
              {app.status === 'Pending' && (
                <button 
                  onClick={() => updateStatus('Under Review')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  <Eye className="w-4 h-4" /> Mark Under Review
                </button>
              )}

              {(app.status === 'Pending' || app.status === 'Under Review') && (
                <>
                  <button 
                    onClick={() => updateStatus('Approved')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Application
                  </button>
                  <button 
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 py-3 rounded-lg font-bold transition-colors border border-red-500/20"
                  >
                    <XCircle className="w-4 h-4" /> Reject Application
                  </button>
                </>
              )}

              {(app.status === 'Approved' || app.status === 'Letter Generated') && (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-emerald-400 text-sm font-bold flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4" /> Application Approved
                    </p>
                    <p className="text-white/50 text-xs">Approved on {new Date(app.approved_at).toLocaleString()}</p>
                  </div>
                  
                  <button 
                    onClick={generateLetter}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-lg font-bold transition-all shadow-lg"
                  >
                    <Send className="w-4 h-4" /> 
                    {app.letter_generated ? 'Regenerate Letter' : 'Generate Invitation Letter'}
                  </button>

                  {app.letter_generated && app.generated_letter_url && (
                    <a 
                      href={app.generated_letter_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-bold transition-colors border border-white/10"
                    >
                      <Download className="w-4 h-4" /> View Generated Letter
                    </a>
                  )}
                </div>
              )}

              {app.status === 'Rejected' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm font-bold flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4" /> Application Rejected
                  </p>
                  <p className="text-white/70 text-sm mt-2 font-medium">Reason:</p>
                  <p className="text-white/50 text-sm">{app.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a2234] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-500" /> Reject Application
            </h3>
            <p className="text-white/70 text-sm mb-4">Please provide a reason for rejecting this visa application. This will be saved in the admin notes.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 mb-6"
              rows="4"
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => updateStatus('Rejected', adminNotes ? `${adminNotes}\nRejection Reason: ${rejectionReason}` : `Rejection Reason: ${rejectionReason}`)}
                disabled={!rejectionReason || actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold disabled:opacity-50 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
