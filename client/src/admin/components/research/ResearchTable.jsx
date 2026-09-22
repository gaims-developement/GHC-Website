import { Award, Edit3, Eye, Trash2, UserCheck, X, ShieldAlert, Star, Send, CheckCircle, FileX, RotateCcw } from "lucide-react";

function ResearchTable({ onAssignReviewer, onAward, onDelete, onEdit, onReject, onReview, onIntegrity, onScore, onRevisionRequest, onApprove, onPreview, submissions, registeredEmails }) {
  const isRegistered = (email) => registeredEmails && registeredEmails.includes(email.toLowerCase());

  const renderActions = (submission, mobile = false) => {
    const isFinal = submission.status === 'accepted' || submission.status === 'rejected';

    return (
      <div className={mobile ? "speaker-actions mobile-actions" : "speaker-actions"}>
        <button onClick={() => onPreview(submission)} title="Preview"><Eye size={16} />{mobile && "Preview"}</button>
        <button onClick={() => onScore(submission)} title="Scoring"><Star size={16} />{mobile && "Scoring"}</button>
        {!isFinal && (
          <>
            <button onClick={() => onApprove(submission)} title="Approve" style={{color: 'green'}}><CheckCircle size={16} />{mobile && "Approve"}</button>
            <button onClick={() => onReject(submission)} title="Reject" style={{color: 'red'}}><FileX size={16} />{mobile && "Reject"}</button>
            <button onClick={() => onRevisionRequest(submission)} title="Request Revision"><RotateCcw size={16} />{mobile && "Revision"}</button>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="admin-mobile-card-list">
        {submissions?.map((submission) => (
          <article className="admin-mobile-data-card" key={submission.id}>
            <div>
              <h3>{submission.title}</h3>
              <span className={`status-pill ${submission.status}`}>{submission.status}</span>
            </div>
            <p>{submission.presentingAuthor}</p>
            <dl>
              <div><dt>Institution</dt><dd>{submission.institution || "Not provided"}</dd></div>
              <div><dt>Category</dt><dd>{submission.category || "Not provided"}</dd></div>
              <div><dt>UG / PG</dt><dd>{submission.yearOfStudy || "Not provided"}</dd></div>
              <div><dt>AI Plag</dt><dd>{submission.aiPercentage !== null ? `${submission.aiPercentage}%` : "Not scored"}</dd></div>
              <div><dt>Plag</dt><dd>{submission.plagiarismPercentage !== null ? `${submission.plagiarismPercentage}%` : "Not scored"}</dd></div>
            </dl>
            {renderActions(submission, true)}
          </article>
        ))}
      </div>
      <div className="speaker-table-wrap">
        <table className="speaker-table">
          <thead>
            <tr>
              <th>TITLE OF THE RESEARCH</th>
              <th>NAME</th>
              <th>INSTITUTION</th>
              <th>CATEGORY</th>
              <th>UG / PG</th>
              <th>STATUS</th>
              <th>AI PLAGIARISM</th>
              <th>PLAGIARISM</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {submissions?.map((submission) => (
              <tr key={submission.id}>
                <td>
                  <strong title={submission.title} style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>{submission.title}</strong>
                  {submission.versions?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                      <strong style={{ color: '#666' }}>Prior versions:</strong>
                      {submission.versions.map((v) => (
                        <a key={v.id} href={v.pdfUrl || v.pdf_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', margin: '0 4px', color: '#0056b3' }}>
                          v{v.version_number || v.versionNumber}
                        </a>
                      ))}
                    </div>
                  )}
                </td>
                <td>{submission.presentingAuthor || "Not provided"}</td>
                <td>{submission.institution || "Not provided"}</td>
                <td>{submission.category || "Not provided"}</td>
                <td>{submission.yearOfStudy || "Not provided"}</td>
                <td>
                  <span className={`status-pill ${submission.status}`}>{submission.status}</span>
                </td>
                <td>{submission.aiPercentage !== null ? `${submission.aiPercentage}%` : "Not scored"}</td>
                <td>{submission.plagiarismPercentage !== null ? `${submission.plagiarismPercentage}%` : "Not scored"}</td>
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

