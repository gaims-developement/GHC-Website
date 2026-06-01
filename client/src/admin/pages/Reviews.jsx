import { CheckCircle2, Save } from "lucide-react";
import { useEffect, useState } from "react";

function Reviews({ api }) {
  const [assignments, setAssignments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ abstractId: "", scientificMerit: 0, originality: 0, methodology: 0, presentationQuality: 0, relevance: 0, comments: "", recommendation: "revise" });

  const load = () => Promise.all([api.get("/api/research/reviews/assigned"), api.get("/api/research/reviews")]).then(([assignedRes, reviewsRes]) => {
    setAssignments(assignedRes.data.assignments || []);
    setReviews(reviewsRes.data.reviews || []);
  });

  useEffect(() => { load().catch(() => {}); }, [api]);

  const submit = async (event) => {
    event.preventDefault();
    await api.post(`/api/research/${form.abstractId}/reviews`, form);
    setForm({ abstractId: "", scientificMerit: 0, originality: 0, methodology: 0, presentationQuality: 0, relevance: 0, comments: "", recommendation: "revise" });
    load();
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel"><p className="admin-eyebrow">Reviewer Portal</p><h1>Reviews</h1><p className="admin-muted">Assigned reviewers can score only their assigned abstracts.</p></section>
      <section className="admin-panel">
        <form className="super-form-grid" onSubmit={submit}>
          <label>Assigned Abstract<select value={form.abstractId} onChange={(event) => setForm({ ...form, abstractId: event.target.value })}><option value="">Select</option>{assignments.map((item) => <option key={item.id} value={item.abstract_id}>{item.title}</option>)}</select></label>
          {["scientificMerit", "originality", "methodology", "presentationQuality", "relevance"].map((field) => <label key={field}>{field}<input type="number" value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></label>)}
          <label>Recommendation<select value={form.recommendation} onChange={(event) => setForm({ ...form, recommendation: event.target.value })}><option value="accept">Accept</option><option value="reject">Reject</option><option value="revise">Revise</option></select></label>
          <label>Comments<textarea value={form.comments} onChange={(event) => setForm({ ...form, comments: event.target.value })} /></label>
          <button className="admin-primary-button" type="submit"><Save size={18} /> Submit Review</button>
        </form>
      </section>
      <section className="admin-panel"><div className="speaker-table-wrap"><table className="speaker-table"><thead><tr><th>Abstract</th><th>Reviewer</th><th>Total</th><th>Recommendation</th><th>Reviewed</th></tr></thead><tbody>{reviews.map((review) => <tr key={review.id}><td>{review.title}</td><td>{review.reviewer_name}</td><td>{review.total_score}</td><td><CheckCircle2 size={14} /> {review.recommendation}</td><td>{review.reviewed_at}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}

export default Reviews;
