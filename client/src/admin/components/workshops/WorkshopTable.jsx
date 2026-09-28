import { Edit3, ExternalLink, Lock, Send, Star, Trash2 } from "lucide-react";

function WorkshopTable({ workshops, onClose, onDelete, onEdit, onFeature, onPublish }) {
  return (
    <div>
      <div className="admin-mobile-card-list">
        {workshops?.map((workshop) => {
          const remaining = Math.max(Number(workshop.capacity || 0) - Number(workshop.registeredCount || 0), 0);
          const slug = workshop.slug || workshop.id;
          return (
            <article className="admin-mobile-data-card" key={workshop.id}>
              <div>
                <h3>{workshop.title}</h3>
                <span className={`status-pill ${workshop.status}`}>{workshop.status}</span>
              </div>
              <p>{workshop.faculty}</p>
              <dl>
                <div><dt>Type</dt><dd>{workshop.workshopType || "Workshop"}</dd></div>
                <div><dt>Seats left</dt><dd>{remaining} / {workshop.capacity}</dd></div>
              </dl>
              <div className="speaker-actions mobile-actions">
                <a href={`/workshops/${slug}`} target="_blank" rel="noopener noreferrer" title="View Public Page" className="admin-action-btn"><ExternalLink size={16} />View Page</a>
                <button onClick={() => onEdit(workshop)} title="Edit"><Edit3 size={16} />Edit</button>
                <button onClick={() => onPublish(workshop)} title="Publish"><Send size={16} />Publish</button>
                <button onClick={() => onClose(workshop)} title="Close"><Lock size={16} />Close</button>
                <button onClick={() => onFeature(workshop)} title="Feature"><Star size={16} />Feature</button>
                <button onClick={() => onDelete(workshop)} title="Delete"><Trash2 size={16} />Delete</button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="speaker-table-wrap">
        <table className="speaker-table">
          <thead>
            <tr>
              <th>Workshop</th>
              <th>Faculty</th>
              <th>Type</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workshops?.map((workshop) => {
              const remaining = Math.max(Number(workshop.capacity || 0) - Number(workshop.registeredCount || 0), 0);
              const slug = workshop.slug || workshop.id;
              return (
                <tr key={workshop.id}>
                  <td>
                    <strong>{workshop.title}</strong>
                    <small>{workshop.venue}</small>
                  </td>
                  <td>{workshop.faculty}</td>
                  <td>{workshop.workshopType}</td>
                  <td>{remaining} / {workshop.capacity}</td>
                  <td><span className={`status-pill ${workshop.status}`}>{workshop.status}</span></td>
                  <td>
                    <div className="speaker-actions">
                      <a href={`/workshops/${slug}`} target="_blank" rel="noopener noreferrer" title="View Public Page" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#173B8F', textDecoration: 'none' }}><ExternalLink size={15} /></a>
                      <button onClick={() => onEdit(workshop)} title="Edit"><Edit3 size={16} /></button>
                      <button onClick={() => onPublish(workshop)} title="Publish"><Send size={16} /></button>
                      <button onClick={() => onClose(workshop)} title="Close"><Lock size={16} /></button>
                      <button onClick={() => onFeature(workshop)} title="Feature"><Star size={16} /></button>
                      <button onClick={() => onDelete(workshop)} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkshopTable;
