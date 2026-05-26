function WorkshopCard({ workshop }) {
  const remaining = Math.max(Number(workshop.capacity || 0) - Number(workshop.registeredCount || 0), 0);

  return (
    <article className="cms-workshop-card">
      <span className={`status-pill ${workshop.status}`}>{workshop.status}</span>
      <strong>{workshop.title}</strong>
      <small>{workshop.faculty}</small>
      <div>
        <span>{workshop.workshopType || "Workshop"}</span>
        <span>{remaining} seats left</span>
      </div>
    </article>
  );
}

export default WorkshopCard;
