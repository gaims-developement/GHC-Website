import { useState } from "react";
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

function SpeakerCard({ speaker, onEdit }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button className="cms-speaker-card" onClick={() => onEdit(speaker)}>
      <span className="cms-speaker-avatar">
        {speaker.photoUrl && !imgError ? (
          <img
            src={getImageUrl(speaker.photoUrl)}
            alt=""
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials(speaker.name)}</span>
        )}
      </span>
      <strong>{speaker.name}</strong>
      <small style={{ marginTop: "0.2rem" }}>
        {speaker.speakerType === "past"
          ? speaker.achievements || speaker.topic || "Legacy Speaker"
          : speaker.topic || speaker.designation || "No topic yet"}
      </small>
    </button>
  );
}

export default SpeakerCard;
