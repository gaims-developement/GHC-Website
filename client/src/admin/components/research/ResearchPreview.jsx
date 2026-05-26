function ResearchPreview({ submission }) {
  return (
    <aside className="workshop-preview research-preview">
      <p className="admin-eyebrow">Preview</p>
      <h3>{submission.title || "Research title"}</h3>
      <strong>{submission.institution || "Institution"}</strong>
      <p>{submission.abstractText || "Abstract text preview appears here while drafting the submission."}</p>
      <div className="workshop-preview-meta">
        <span>{submission.category || "poster"}</span>
        <span>{submission.track || "Track"}</span>
        <span>{submission.status || "draft"}</span>
        {submission.awardNomination && <span>Award nominee</span>}
      </div>
    </aside>
  );
}

export default ResearchPreview;
