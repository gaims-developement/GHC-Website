function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SP";
}

function SpeakerPreview({ speaker }) {
  const previewUrl = speaker.photoPreview || speaker.photoUrl;

  return (
    <aside className="speaker-preview">
      <p className="admin-eyebrow">Live preview</p>
      <div className="speaker-preview-photo">
        {previewUrl ? <img src={previewUrl} alt="" /> : <span>{initials(speaker.name)}</span>}
      </div>
      <h3>{speaker.name || "Speaker name"}</h3>
      <p>{speaker.designation || "Designation"}</p>
      <strong>{speaker.institution || "Institution"}</strong>
      <div className="speaker-preview-topic">{speaker.topic || "Talk topic"}</div>
      <div className="speaker-preview-flags">
        {speaker.featured && <span>Featured</span>}
        {speaker.keynote && <span>Keynote</span>}
        <span>{speaker.status || "draft"}</span>
      </div>
    </aside>
  );
}

export default SpeakerPreview;
