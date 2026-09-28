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

  if (loading) return <div className="p-10 text-black text-center font-medium">Loading details...</div>;
  if (!app) return <div className="p-10 text-red-600 text-center font-bold">Application not found.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-black">
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate('visa-applications')} className="p-2 hover:bg-gray-100 rounded-full text-black transition-colors" title="Back to Visa Applications">
          <ArrowLeft className="text-black" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-3">
            <span>Application {app.application_id}</span>
            <span className="text-sm px-3 py-1 bg-gray-100 border border-gray-200 text-gray-800 rounded-full font-semibold">
              {app.status}
            </span>
          </h1>
          <p className="text-gray-600 text-sm font-medium">Submitted on {new Date(app.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-black">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2"><User className="text-blue-600"/> Personal Details</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Full Name</p>
                <p className="text-black font-semibold mt-0.5">{app.full_name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Date of Birth</p>
                <p className="text-black font-semibold mt-0.5">{new Date(app.date_of_birth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Gender</p>
                <p className="text-black font-semibold mt-0.5">{app.gender || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Nationality</p>
                <p className="text-black font-semibold mt-0.5">{app.nationality}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Email</p>
                <p className="text-black font-semibold mt-0.5">{app.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Mobile</p>
                <p className="text-black font-semibold mt-0.5">{app.mobile}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-black">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2"><Book className="text-blue-600"/> Passport Details</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm mb-6">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Passport Number</p>
                <p className="text-black font-mono font-bold mt-0.5">{app.passport_number}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Issuing Country</p>
                <p className="text-black font-semibold mt-0.5">{app.passport_issuing_country}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Issue Date</p>
                <p className="text-black font-semibold mt-0.5">{app.passport_issue_date ? new Date(app.passport_issue_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Expiry Date</p>
                <p className="text-black font-semibold mt-0.5">{new Date(app.passport_expiry_date).toLocaleDateString()}</p>
              </div>
            </div>
            <a 
              href={app.passport_document} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <FileText className="w-4 h-4" /> View Passport Document
            </a>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-black">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2"><BriefcaseMedical className="text-blue-600"/> Professional & GHC Info</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Organisation</p>
                <p className="text-black font-semibold mt-0.5">{app.organisation}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Designation</p>
                <p className="text-black font-semibold mt-0.5">{app.designation || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Country of Residence</p>
                <p className="text-black font-semibold mt-0.5">{app.country_of_residence || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Participant Category</p>
                <p className="text-black font-semibold mt-0.5">
                  {app.participant_category} 
                  {app.participant_category_other ? ` (${app.participant_category_other})` : ''}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">GHC Registration ID</p>
                <p className="text-black font-mono font-bold bg-gray-100 border border-gray-200 inline-block px-2.5 py-1 rounded mt-1">{app.ghc_registration_id}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-black">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2"><PlaneTakeoff className="text-blue-600"/> Travel Details</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Arrival Date</p>
                <p className="text-black font-semibold mt-0.5">{new Date(app.arrival_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Departure Date</p>
                <p className="text-black font-semibold mt-0.5">{new Date(app.departure_date).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Accommodation Details</p>
                <p className="text-black font-semibold mt-0.5">{app.accommodation_details || 'Not provided'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Purpose of Visit</p>
                <p className="text-black font-semibold mt-0.5">{app.purpose_of_visit}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-black">
            <h2 className="text-lg font-bold text-black mb-4">Admin Actions</h2>
            
            <div className="space-y-3 mb-6">
              <label className="text-sm font-bold text-black">Admin Notes</label>
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes..."
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-black text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                rows="3"
              />
              <button 
                onClick={() => updateStatus(app.status, adminNotes)}
                disabled={actionLoading || adminNotes === (app.admin_notes || '')}
                className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-black text-sm py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                Save Notes
              </button>
            </div>

            <hr className="border-gray-200 mb-6" />

            <div className="space-y-3">
              {app.status === 'Pending' && (
                <button 
                  onClick={() => updateStatus('Under Review')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4" /> Mark Under Review
                </button>
              )}

              {(app.status === 'Pending' || app.status === 'Under Review') && (
                <>
                  <button 
                    onClick={() => updateStatus('Approved')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Application
                  </button>
                  <button 
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-lg font-bold transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject Application
                  </button>
                </>
              )}

              {(app.status === 'Approved' || app.status === 'Letter Generated') && (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-emerald-800 text-sm font-bold flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4" /> Application Approved
                    </p>
                    <p className="text-gray-600 text-xs">Approved on {new Date(app.approved_at).toLocaleString()}</p>
                  </div>
                  
                  <button 
                    onClick={generateLetter}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-lg font-bold transition-all shadow-md"
                  >
                    <Send className="w-4 h-4" /> 
                    {app.letter_generated ? 'Regenerate Letter' : 'Generate Invitation Letter'}
                  </button>

                  {app.letter_generated && app.generated_letter_url && (
                    <a 
                      href={app.generated_letter_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-black py-3 rounded-lg font-bold transition-colors border border-gray-300"
                    >
                      <Download className="w-4 h-4" /> View Generated Letter
                    </a>
                  )}
                </div>
              )}

              {app.status === 'Rejected' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-bold flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4" /> Application Rejected
                  </p>
                  <p className="text-gray-800 text-sm mt-2 font-semibold">Reason:</p>
                  <p className="text-gray-600 text-sm">{app.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl w-full max-w-md shadow-2xl text-black">
            <h3 className="text-xl font-bold text-black flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-600" /> Reject Application
            </h3>
            <p className="text-gray-700 text-sm mb-4">Please provide a reason for rejecting this visa application. This will be saved in the admin notes.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-black outline-none focus:border-red-500 mb-6"
              rows="4"
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-black transition-colors font-medium"
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
