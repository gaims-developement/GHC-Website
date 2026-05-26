import { Award, Check, X } from "lucide-react";
import { useState } from "react";

function ResearchReview({ onCancel, onSubmit, submission }) {
  const [score, setScore] = useState(submission?.reviewScore || 75);
  const [notes, setNotes] = useState(submission?.reviewNotes || "");
  const [awardNomination, setAwardNomination] = useState(Boolean(submission?.awardNomination));

  if (!submission) return null;

  const submit = (status) => {
    onSubmit(submission, { reviewScore: score, reviewNotes: notes, awardNomination, status });
  };

  return (
    <section className="admin-panel research-review-panel">
      <p className="admin-eyebrow">Review workflow</p>
      <h2>{submission.title}</h2>
      <p className="admin-muted">{submission.authors}</p>
      <label>Score: {score}<input type="range" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></label>
      <label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} /></label>
      <label className="review-award-toggle"><input type="checkbox" checked={awardNomination} onChange={(event) => setAwardNomination(event.target.checked)} /> Nominate for award</label>
      <div className="speaker-form-actions review-actions">
        <button type="button" onClick={() => submit("accepted")}><Check size={16} /> Accept</button>
        <button type="button" onClick={() => submit("rejected")}><X size={16} /> Reject</button>
        <button type="button" onClick={() => submit("under_review")}><Award size={16} /> Save Review</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </section>
  );
}

export default ResearchReview;
