import { Award, Edit3, Eye, Trash2, X } from "lucide-react";

function ResearchTable({ onAward, onDelete, onEdit, onReject, onReview, submissions }) {
  const renderActions = (submission, mobile = false) => (
    <div className={mobile ? "speaker-actions mobile-actions" : "speaker-actions"}>
      <button onClick={() => onEdit(submission)} title="Edit"><Edit3 size={16} />{mobile && "Edit"}</button>
      <button onClick={() => onReview(submission)} title="Review"><Eye size={16} />{mobile && "Review"}</button>
      <button onClick={() => onAward(submission)} title="Award"><Award size={16} />{mobile && "Award"}</button>
      <button onClick={() => onReject(submission)} title="Reject"><X size={16} />{mobile && "Reject"}</button>
      <button onClick={() => onDelete(submission)} title="Delete"><Trash2 size={16} />{mobile && "Delete"}</button>
    </div>
  );

  return (
    <div>
      <div className="admin-mobile-card-list">
        {submissions?.map((submission) => (
          <article className="admin-mobile-data-card" key={submission.id}>
            <div>
              <h3>{submission.title}</h3>
              <span className={`status-pill ${submission.status}`}>{submission.status}</span>
            </div>
            <p>{submission.institution}</p>
            <dl>
              <div><dt>Category</dt><dd>{submission.category}</dd></div>
              <div><dt>Track</dt><dd>{submission.track}</dd></div>
              <div><dt>Score</dt><dd>{submission.reviewScore ?? "Pending"}</dd></div>
              <div><dt>Award</dt><dd>{submission.awardNomination ? "Nominee" : "No"}</dd></div>
            </dl>
            {renderActions(submission, true)}
          </article>
        ))}
      </div>
      <div className="speaker-table-wrap">
        <table className="speaker-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Institution</th>
              <th>Category</th>
              <th>Track</th>
              <th>Status</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions?.map((submission) => (
              <tr key={submission.id}>
                <td>
                  <strong>{submission.title}</strong>
                  <small>{submission.presentingAuthor}</small>
                </td>
                <td>{submission.institution}</td>
                <td>{submission.category}</td>
                <td>{submission.track}</td>
                <td><span className={`status-pill ${submission.status}`}>{submission.status}</span></td>
                <td>{submission.reviewScore ?? "Pending"}</td>
                <td>{renderActions(submission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResearchTable;
