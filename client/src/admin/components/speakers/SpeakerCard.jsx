function SpeakerCard({ speaker, onEdit }) {
  return (
    <button className="cms-speaker-card" onClick={() => onEdit(speaker)}>
      <span className="cms-speaker-avatar">
        {speaker.photoUrl ? <img src={speaker.photoUrl} alt="" /> : speaker.name?.slice(0, 2).toUpperCase()}
      </span>
      <strong>{speaker.name}</strong>
      <small>{speaker.topic || "No topic yet"}</small>
    </button>
  );
}

export default SpeakerCard;
