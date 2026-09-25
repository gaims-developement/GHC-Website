import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Plus, Search, Download, Mail, Upload, X } from "lucide-react";
import { apiUrl } from "../../config/api";
import ResearchForm from "../components/research/ResearchForm";
import ResearchTable from "../components/research/ResearchTable";

const tabs = ["All Abstracts", "Pending / Review", "Revisions", "Approved", "Rejected"];

function Research({ api }) {
  const [submissions, setSubmissions] = useState([]);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All Abstracts");
  
  // New States
  const [registeredEmails, setRegisteredEmails] = useState(null);
  const [mailModal, setMailModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const [scoreModal, setScoreModal] = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [revisionModal, setRevisionModal] = useState(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionLoading, setRevisionLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  const loadSubmissions = useCallback(() => {
    api.get("/api/research?admin=1").then((response) => setSubmissions(response.data.submissions || []));
  }, [api]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const stats = useMemo(() => ({
    total: submissions.length,
    underReview: submissions.filter((item) => item.status === "under_review").length,
    accepted: submissions.filter((item) => item.status === "accepted").length,
    rejected: submissions.filter((item) => item.status === "rejected").length,
    awardNominees: submissions.filter((item) => item.awardNomination).length,
  }), [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch = [submission.title, submission.presentingAuthor, submission.institution, submission.track, submission.keywords, submission.category, submission.status].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      const isFinal = submission.status === 'accepted' || submission.status === 'rejected';
      const hasRevisions = (submission.currentVersion || submission.current_version || 1) > 1 || submission.status === 'revision_requested';

      switch (activeTab) {
        case "All Abstracts":
          return true;
        case "Approved":
          return submission.status === "accepted";
        case "Rejected":
          return submission.status === "rejected";
        case "Revisions":
          return submission.status === "revision_requested" || (!isFinal && hasRevisions);
        case "Pending / Review":
          return !isFinal && submission.status !== "revision_requested";
        default:
          return true;
      }
    });
  }, [activeTab, search, submissions]);

  const openForm = (submission = null) => {
    setEditingSubmission(submission);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingSubmission(null);
    setShowForm(false);
  };

  const submitResearch = async (form, pdf) => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    if (pdf) formData.append("pdf", pdf);

    if (editingSubmission?.id) {
      await api.put(`/api/research/${editingSubmission.id}`, formData);
    } else {
      await api.post("/api/research", formData);
    }

    closeForm();
    loadSubmissions();
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    const score = e.target.score.value;
    const aiPercentage = e.target.aiPercentage.value;
    const plagiarismPercentage = e.target.plagiarismPercentage.value;

    await api.put(`/api/research/${scoreModal.id}/integrity`, { aiPercentage, plagiarismPercentage });
    await api.patch(`/api/research/${scoreModal.id}/review`, { reviewScore: score, status: scoreModal.status || 'under_review' });
    setScoreModal(null);
    loadSubmissions();
  };

  const approveSubmission = async () => {
    await api.patch(`/api/research/${approveModal.id}/status`, { status: "accepted" });
    setApproveModal(null);
    loadSubmissions();
  };

  const rejectSubmission = async () => {
    await api.patch(`/api/research/${rejectModal.id}/status`, { status: "rejected" });
    setRejectModal(null);
    loadSubmissions();
  };

  const requestRevision = async () => {
    setRevisionLoading(true);
    try {
      const res = await api.post(`/api/research/${revisionModal.id}/request-revision`, {
        notes: revisionNotes.trim(),
        revisionNotes: revisionNotes.trim(),
      });
      alert(res.data?.emailSent 
        ? `Revision request & notification email sent successfully to ${res.data?.recipient || 'the author'}!` 
        : "Revision status updated successfully.");
      setRevisionModal(null);
      setRevisionNotes("");
      loadSubmissions();
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to request revision.");
    } finally {
      setRevisionLoading(false);
    }
  };

  const handleMailSubmit = async (e) => {
    e.preventDefault();
    const subject = e.target.subject.value;
    const message = e.target.message.value;
    const emails = submissions.map(s => s.email).filter(Boolean);
    await api.post('/api/research/email', { subject, message, emails });
    alert("Emails sent successfully (simulated)");
    setMailModal(false);
  };

  const handleExportCsv = () => {
    window.open(`${api.defaults.baseURL || ''}/api/research/export`, '_blank');
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const emails = text.split(/[\n,]+/).map(s => s.trim().toLowerCase()).filter(s => s.includes('@'));
      setRegisteredEmails(emails);
      alert(`Loaded ${emails.length} emails for registration checking.`);
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  return (
    <div className="admin-speakers-page admin-research-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Research CMS</p>
            <h1>Abstract Management</h1>
            <p className="admin-muted">Manage abstracts, review workflow, scores and final decisions.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="admin-secondary-button" onClick={handleExportCsv}><Download size={18} /> Export CSV</button>
            <button className="admin-secondary-button" onClick={() => setMailModal(true)}><Mail size={18} /> Send Mail</button>
            <button className="admin-secondary-button" onClick={() => fileInputRef.current?.click()}><Upload size={18} /> Registration Checker</button>
            <input type="file" ref={fileInputRef} onChange={handleCsvUpload} accept=".csv" style={{ display: 'none' }} />
          </div>
        </div>

        <div className="workshop-kpi-row">
          <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("All Abstracts")}>
            <strong>{stats.total}</strong>Total submissions
          </span>
          <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("Pending / Review")}>
            <strong>{stats.underReview}</strong>Under review
          </span>
          <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("Approved")}>
            <strong>{stats.accepted}</strong>Approved
          </span>
          <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("Rejected")}>
            <strong>{stats.rejected}</strong>Rejected
          </span>
        </div>

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search research" /></label>
          <div className="speaker-filter-row">
            {tabs.map((item) => {
              let count = 0;
              if (item === "All Abstracts") count = submissions.length;
              else if (item === "Approved") count = submissions.filter((s) => s.status === "accepted").length;
              else if (item === "Rejected") count = submissions.filter((s) => s.status === "rejected").length;
              else if (item === "Revisions") count = submissions.filter((s) => s.status === "revision_requested" || (s.status !== "accepted" && s.status !== "rejected" && ((s.currentVersion || 1) > 1))).length;
              else if (item === "Pending / Review") count = submissions.filter((s) => s.status !== "accepted" && s.status !== "rejected" && s.status !== "revision_requested").length;

              return (
                <button
                  key={item}
                  className={activeTab === item ? "active" : ""}
                  onClick={() => setActiveTab(item)}
                >
                  {item} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {showForm && (
        <section className="admin-panel">
          <ResearchForm submission={editingSubmission} onSubmit={submitResearch} onCancel={closeForm} />
        </section>
      )}

      <section className="admin-panel">
        <ResearchTable
          submissions={filteredSubmissions}
          registeredEmails={registeredEmails}
          onPreview={setPreviewModal}
          onScore={setScoreModal}
          onApprove={setApproveModal}
          onReject={setRejectModal}
          onRevisionRequest={setRevisionModal}
        />
      </section>

      {/* Modals */}
      {previewModal && (
        <div className="admin-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="admin-modal" style={{ width: '90%', height: '90%', maxWidth: '1200px', display: 'flex', flexDirection: 'column' }}>
            <header>
              <h2>View Abstract: {previewModal.title}</h2>
              <button onClick={() => setPreviewModal(null)}><X size={20} /></button>
            </header>
            <div style={{ flex: 1, backgroundColor: '#f0f0f0', position: 'relative' }}>
              {(previewModal.pdfUrl || previewModal.pdf_url || previewModal.fileUrl) ? (
                <iframe src={apiUrl(previewModal.pdfUrl || previewModal.pdf_url || previewModal.fileUrl)} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview" />
              ) : (
                <div style={{ padding: '2rem', background: '#fff', height: '100%', overflowY: 'auto' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{previewModal.title}</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    <strong>Author:</strong> {previewModal.presentingAuthor || previewModal.authors || "Not specified"} • <strong>Institution:</strong> {previewModal.institution || "Not specified"}
                  </p>
                  <hr style={{ margin: '1rem 0', borderColor: '#eee' }} />
                  <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6, color: '#333' }}>
                    {previewModal.abstractText || "No document file or text content provided for this abstract."}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-form-actions" style={{ padding: '1rem', borderTop: '1px solid #ddd' }}>
              <button type="button" onClick={() => setPreviewModal(null)}>Close Viewer</button>
            </div>
          </div>
        </div>
      )}

      {scoreModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <header>
              <h2>Scoring for Abstract</h2>
              <button onClick={() => setScoreModal(null)}><X size={20} /></button>
            </header>
            <form onSubmit={handleScoreSubmit} className="admin-form">
              <label>Abstract Score
                <input name="score" type="number" step="0.1" defaultValue={scoreModal.reviewScore} required />
              </label>
              <label>AI Plagiarism (%)
                <input name="aiPercentage" type="number" step="0.01" min="0" max="100" defaultValue={scoreModal.aiPercentage} required />
              </label>
              <label>Plagiarism (%)
                <input name="plagiarismPercentage" type="number" step="0.01" min="0" max="100" defaultValue={scoreModal.plagiarismPercentage} required />
              </label>
              <div className="admin-form-actions">
                <button type="button" onClick={() => setScoreModal(null)}>Cancel</button>
                <button type="submit" className="admin-primary-button">Save Score</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {approveModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <header>
              <h2>Approve this abstract?</h2>
              <button onClick={() => setApproveModal(null)}><X size={20} /></button>
            </header>
            <div style={{ padding: '1rem 0', color: '#666' }}>
              Once approved, this decision is permanent and cannot be changed through the review system.
            </div>
            <div className="admin-form-actions">
              <button onClick={() => setApproveModal(null)}>Cancel</button>
              <button onClick={approveSubmission} className="admin-primary-button" style={{ backgroundColor: 'green', color: 'white' }}>Approve Abstract</button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <header>
              <h2>Reject this abstract?</h2>
              <button onClick={() => setRejectModal(null)}><X size={20} /></button>
            </header>
            <div style={{ padding: '1rem 0', color: '#666' }}>
              Once rejected, this decision is permanent and cannot be changed through the review system.
            </div>
            <div className="admin-form-actions">
              <button onClick={() => setRejectModal(null)}>Cancel</button>
              <button onClick={rejectSubmission} className="admin-primary-button" style={{ backgroundColor: 'red', color: 'white' }}>Reject Abstract</button>
            </div>
          </div>
        </div>
      )}

      {revisionModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '520px', width: '90%' }}>
            <header>
              <h2>Request Revision?</h2>
              <button onClick={() => { setRevisionModal(null); setRevisionNotes(""); }} disabled={revisionLoading}><X size={20} /></button>
            </header>
            <div style={{ padding: '0.75rem 0 0.5rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
              This will update the abstract status to <strong>Revision Requested</strong> and send an email with a secure revision link to the author <strong>({revisionModal.email || revisionModal.presentingAuthor || 'Author'})</strong>.
            </div>
            <div style={{ margin: '0.75rem 0 1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Reviewer / Committee Feedback for Author (Optional):
              </label>
              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Specify required corrections, additional data, formatting adjustments, etc."
                rows={4}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
                disabled={revisionLoading}
              />
            </div>
            <div className="admin-form-actions">
              <button onClick={() => { setRevisionModal(null); setRevisionNotes(""); }} disabled={revisionLoading}>Cancel</button>
              <button onClick={requestRevision} className="admin-primary-button" disabled={revisionLoading}>
                {revisionLoading ? "Sending Request..." : "Request Revision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mailModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <header>
              <h2>Email All Participants</h2>
              <button onClick={() => setMailModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleMailSubmit} className="admin-form">
              <label>Subject
                <input name="subject" required />
              </label>
              <label>Message
                <textarea name="message" rows="5" required />
              </label>
              <div className="admin-form-actions">
                <button type="button" onClick={() => setMailModal(false)}>Cancel</button>
                <button type="submit" className="admin-primary-button">Send Emails</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Research;
