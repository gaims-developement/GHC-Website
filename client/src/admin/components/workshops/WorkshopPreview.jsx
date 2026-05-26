const formatDate = (value) => {
  if (!value) return "Date to be announced";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

function WorkshopPreview({ workshop }) {
  const remaining = Math.max(Number(workshop.capacity || 0) - Number(workshop.registeredCount || 0), 0);

  return (
    <aside className="workshop-preview">
      <div className="workshop-preview-image">
        {workshop.imagePreview || workshop.imageUrl ? <img src={workshop.imagePreview || workshop.imageUrl} alt="" /> : "GHC"}
      </div>
      <p className="admin-eyebrow">Live preview</p>
      <h3>{workshop.title || "Workshop title"}</h3>
      <strong>{workshop.faculty || "Faculty"}</strong>
      <p>{workshop.description || "Workshop description will appear here for admin review before publishing."}</p>
      <div className="workshop-preview-meta">
        <span>{workshop.workshopType || "Workshop type"}</span>
        <span>{workshop.duration || "Duration"}</span>
        <span>{remaining} seats left</span>
        <span>{formatDate(workshop.date)}</span>
      </div>
    </aside>
  );
}

export default WorkshopPreview;
