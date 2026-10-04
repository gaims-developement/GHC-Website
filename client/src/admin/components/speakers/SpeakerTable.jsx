import { useState } from "react";
import { Edit3, Send, Star, Trash2 } from "lucide-react";
import { getImageUrl } from "../../../config/api";

function initials(name = "") {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SP"
  );
}

function TableAvatar({ photoUrl, name }) {
  const [imgError, setImgError] = useState(false);

  return (
    <span className="speaker-table-photo">
      {photoUrl && !imgError ? (
        <img src={getImageUrl(photoUrl)} alt="" onError={() => setImgError(true)} />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}

function SpeakerTable({ speakers, onEdit, onDelete, onPublish, onFeature }) {
  return (
    <div>
      <div className="admin-mobile-card-list">
        {speakers?.map((speaker) => (
          <article className="admin-mobile-data-card" key={speaker.id}>
            <div>
              <h3>{speaker.name}</h3>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "2px 6px",
                    borderRadius: "999px",
                    background: speaker.speakerType === "past" ? "#ede9fe" : "#e0f2fe",
                    color: speaker.speakerType === "past" ? "#6d28d9" : "#0369a1",
                  }}
                >
                  {speaker.speakerType === "past" ? "Past" : "Current"}
                </span>
                <span className={`status-pill ${speaker.status}`}>{speaker.status}</span>
              </div>
            </div>
            <p>{speaker.designation}</p>
            <dl>
              <div>
                <dt>Institution</dt>
                <dd>{speaker.institution || "—"}</dd>
              </div>
              <div>
                <dt>{speaker.speakerType === "past" ? "Achievements" : "Topic"}</dt>
                <dd>
                  {speaker.speakerType === "past"
                    ? speaker.achievements || speaker.topic || "—"
                    : speaker.topic || "—"}
                </dd>
              </div>
            </dl>
            <div className="speaker-actions mobile-actions">
              <button onClick={() => onEdit(speaker)} title="Edit">
                <Edit3 size={16} />Edit
              </button>
              <button onClick={() => onPublish(speaker)} title="Publish">
                <Send size={16} />Publish
              </button>
              <button onClick={() => onFeature(speaker)} title="Feature">
                <Star size={16} />Feature
              </button>
              <button onClick={() => onDelete(speaker)} title="Delete">
                <Trash2 size={16} />Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="speaker-table-wrap">
        <table className="speaker-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name & Type</th>
              <th>Institution</th>
              <th>Topic / Achievements</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {speakers?.map((speaker) => (
              <tr key={speaker.id}>
                <td>
                  <TableAvatar photoUrl={speaker.photoUrl} name={speaker.name} />
                </td>
                <td>
                  <strong>{speaker.name}</strong>
                  <small>{speaker.designation}</small>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "4px",
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: speaker.speakerType === "past" ? "#ede9fe" : "#e0f2fe",
                      color: speaker.speakerType === "past" ? "#6d28d9" : "#0369a1",
                    }}
                  >
                    {speaker.speakerType === "past" ? "Past Speaker" : "Current Speaker"}
                  </span>
                </td>
                <td>{speaker.institution || "—"}</td>
                <td style={{ maxWidth: "280px", lineHeight: "1.45" }}>
                  {speaker.speakerType === "past"
                    ? speaker.achievements || speaker.topic || "—"
                    : speaker.topic || "—"}
                </td>
                <td>
                  <span className={`status-pill ${speaker.status}`}>{speaker.status}</span>
                </td>
                <td>
                  <div className="speaker-actions">
                    <button onClick={() => onEdit(speaker)} title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => onPublish(speaker)} title="Publish">
                      <Send size={16} />
                    </button>
                    <button
                      onClick={() => onFeature(speaker)}
                      title="Feature"
                      style={{ color: speaker.featured ? "#EAB308" : undefined }}
                    >
                      <Star size={16} fill={speaker.featured ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => onDelete(speaker)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SpeakerTable;
