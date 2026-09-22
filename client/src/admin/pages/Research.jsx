import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Plus, Search, Download, Mail, Upload, X } from "lucide-react";
import { apiUrl } from "../../config/api";
import ResearchForm from "../components/research/ResearchForm";
import ResearchTable from "../components/research/ResearchTable";

const tabs = ["Pending / Review", "Revisions", "Approved", "Rejected"];

function Research({ api }) {
  const [submissions, setSubmissions] = useState([]);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Pending / Review");
  
  // New States
  const [registeredEmails, setRegisteredEmails] = useState(null);
  const [mailModal, setMailModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const [scoreModal, setScoreModal] = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [revisionModal, setRevisionModal] = useState(null);
  
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
      const matchesSearch = [submission.title, submission.presentingAuthor, submission.institution, submission.track, submission.keywords].join(" ").toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      const isFinal = submission.status === 'accepted' || submission.status === 'rejected';
      const hasRevisions = submission.currentVersion > 1;

      switch (activeTab) {
        case "Approved":
          return submission.status === "accepted";
        case "Rejected":
          return submission.status === "rejected";
        case "Revisions":
          return !isFinal && hasRevisions;
        case "Pending / Review":
        default:
          return !isFinal && !hasRevisions;
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
    try {
      await api.post(`/api/research/${revisionModal.id}/request-revision`);
      setRevisionModal(null);
      loadSubmissions();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to request revision.");
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
          <span><strong>{stats.total}</strong>Total submissions</span>
          <span><strong>{stats.underReview}</strong>Under review</span>
          <span><strong>{stats.accepted}</strong>Approved</span>
          <span><strong>{stats.rejected}</strong>Rejected</span>
        </div>

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search research" /></label>
          <div className="speaker-filter-row">
            {tabs.map((item) => <button key={item} className={activeTab === item ? "active" : ""} onClick={() => setActiveTab(item)}>{item}</button>)}
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
              <h2>Preview Abstract: {previewModal.title}</h2>
              <button onClick={() => setPreviewModal(null)}><X size={20} /></button>
            </header>
            <div style={{ flex: 1, backgroundColor: '#f0f0f0', position: 'relative' }}>
              <iframe src={apiUrl(previewModal.pdfUrl || previewModal.pdf_url)} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview" />
            </div>
            <div className="admin-form-actions" style={{ padding: '1rem', borderTop: '1px solid #ddd' }}>
              <button type="button" onClick={() => setPreviewModal(null)}>Close Preview</button>
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
          <div className="admin-modal">
            <header>
              <h2>Request Revision?</h2>
              <button onClick={() => setRevisionModal(null)}><X size={20} /></button>
            </header>
            <div style={{ padding: '1rem 0', color: '#666' }}>
              This will update the status and send an email with a secure link to the author for submitting a revised version.
            </div>
            <div className="admin-form-actions">
              <button onClick={() => setRevisionModal(null)}>Cancel</button>
              <button onClick={requestRevision} className="admin-primary-button">Request Revision</button>
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
