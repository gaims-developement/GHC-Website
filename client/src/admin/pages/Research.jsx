import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import ResearchForm from "../components/research/ResearchForm";
import ResearchReview from "../components/research/ResearchReview";
import ResearchTable from "../components/research/ResearchTable";

const filters = ["all", "poster", "oral", "under_review", "accepted", "rejected", "award"];

function Research({ api }) {
  const [submissions, setSubmissions] = useState([]);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

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
      const matchesSearch = [submission.title, submission.authors, submission.institution, submission.track, submission.keywords].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        submission.category === filter ||
        submission.status === filter ||
        (filter === "award" && submission.awardNomination);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, submissions]);

  const openForm = (submission = null) => {
    setEditingSubmission(submission);
    setShowForm(true);
    setReviewingSubmission(null);
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

  const deleteSubmission = async (submission) => {
    if (!window.confirm(`Delete ${submission.title}?`)) return;
    await api.delete(`/api/research/${submission.id}`);
    loadSubmissions();
  };

  const submitReview = async (submission, review) => {
    await api.patch(`/api/research/${submission.id}/review`, review);
    setReviewingSubmission(null);
    loadSubmissions();
  };

  const rejectSubmission = async (submission) => {
    await api.patch(`/api/research/${submission.id}/status`, { status: "rejected" });
    loadSubmissions();
  };

  const toggleAward = async (submission) => {
    await api.patch(`/api/research/${submission.id}/award`, { awardNomination: !submission.awardNomination });
    loadSubmissions();
  };

  return (
    <div className="admin-speakers-page admin-research-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Research CMS</p>
            <h1>Research Management</h1>
            <p className="admin-muted">Manage abstracts, poster and oral presentations, review workflow, awards and publication opportunities.</p>
          </div>
          <button className="admin-primary-button" onClick={() => openForm()}><Plus size={18} /> Add Research</button>
        </div>

        <div className="workshop-kpi-row">
          <span><strong>{stats.total}</strong>Total submissions</span>
          <span><strong>{stats.underReview}</strong>Under review</span>
          <span><strong>{stats.accepted}</strong>Accepted</span>
          <span><strong>{stats.rejected}</strong>Rejected</span>
          <span><strong>{stats.awardNominees}</strong>Award nominees</span>
        </div>

        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search research" /></label>
          <div className="speaker-filter-row">
            {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item.replace("_", " ")}</button>)}
          </div>
        </div>
      </section>

      {showForm && (
        <section className="admin-panel">
          <ResearchForm submission={editingSubmission} onSubmit={submitResearch} onCancel={closeForm} />
        </section>
      )}

      {reviewingSubmission && (
        <ResearchReview key={reviewingSubmission.id} submission={reviewingSubmission} onSubmit={submitReview} onCancel={() => setReviewingSubmission(null)} />
      )}

      <section className="admin-panel">
        <ResearchTable
          submissions={filteredSubmissions}
          onAward={toggleAward}
          onDelete={deleteSubmission}
          onEdit={openForm}
          onReject={rejectSubmission}
          onReview={setReviewingSubmission}
        />
      </section>
    </div>
  );
}

export default Research;
