import { Edit3, Send, Star, Trash2 } from "lucide-react";

function SpeakerTable({ speakers, onEdit, onDelete, onPublish, onFeature }) {
  return (
    <div>
      <div className="admin-mobile-card-list">
        {speakers?.map((speaker) => (
          <article className="admin-mobile-data-card" key={speaker.id}>
            <div>
              <h3>{speaker.name}</h3>
              <span className={`status-pill ${speaker.status}`}>{speaker.status}</span>
            </div>
            <p>{speaker.designation}</p>
            <dl>
              <div><dt>Institution</dt><dd>{speaker.institution}</dd></div>
              <div><dt>Topic</dt><dd>{speaker.topic}</dd></div>
            </dl>
            <div className="speaker-actions mobile-actions">
              <button onClick={() => onEdit(speaker)} title="Edit"><Edit3 size={16} />Edit</button>
              <button onClick={() => onPublish(speaker)} title="Publish"><Send size={16} />Publish</button>
              <button onClick={() => onFeature(speaker)} title="Feature"><Star size={16} />Feature</button>
              <button onClick={() => onDelete(speaker)} title="Delete"><Trash2 size={16} />Delete</button>
            </div>
          </article>
        ))}
      </div>
      <div className="speaker-table-wrap">
        <table className="speaker-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Institution</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {speakers?.map((speaker) => (
              <tr key={speaker.id}>
                <td>
                  <span className="speaker-table-photo">
                    {speaker.photoUrl ? <img src={speaker.photoUrl} alt="" /> : speaker.name?.slice(0, 2).toUpperCase()}
                  </span>
                </td>
                <td>
                  <strong>{speaker.name}</strong>
                  <small>{speaker.designation}</small>
                </td>
                <td>{speaker.institution}</td>
                <td>{speaker.topic}</td>
                <td><span className={`status-pill ${speaker.status}`}>{speaker.status}</span></td>
                <td>
                  <div className="speaker-actions">
                    <button onClick={() => onEdit(speaker)} title="Edit"><Edit3 size={16} /></button>
                    <button onClick={() => onPublish(speaker)} title="Publish"><Send size={16} /></button>
                    <button onClick={() => onFeature(speaker)} title="Feature"><Star size={16} /></button>
                    <button onClick={() => onDelete(speaker)} title="Delete"><Trash2 size={16} /></button>
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
