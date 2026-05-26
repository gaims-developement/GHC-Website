import { BadgeCheck, Check, Eye, QrCode, X } from "lucide-react";

function RegistrationTable({ onApprove, onCheckIn, onReject, onViewQr, registrations }) {
  const actions = (registration, mobile = false) => (
    <div className={mobile ? "speaker-actions mobile-actions" : "speaker-actions"}>
      <button onClick={() => onApprove(registration)} title="Approve"><Check size={16} />{mobile && "Approve"}</button>
      <button onClick={() => onReject(registration)} title="Reject"><X size={16} />{mobile && "Reject"}</button>
      <button onClick={() => onCheckIn(registration)} title="Check-in"><BadgeCheck size={16} />{mobile && "Check-in"}</button>
      <button onClick={() => onViewQr(registration)} title="View QR"><QrCode size={16} />{mobile && "QR"}</button>
    </div>
  );

  return (
    <div>
      <div className="admin-mobile-card-list">
        {registrations?.map((registration) => (
          <article className="admin-mobile-data-card" key={registration.id}>
            <div>
              <h3>{registration.fullName}</h3>
              <span className={`status-pill ${registration.registrationStatus}`}>{registration.registrationStatus}</span>
            </div>
            <p>{registration.institution}</p>
            <dl>
              <div><dt>Ticket</dt><dd>{registration.ticketName}</dd></div>
              <div><dt>Payment</dt><dd>{registration.paymentStatus}</dd></div>
              <div><dt>Attendance</dt><dd>{registration.attendance ? "Checked in" : "Pending"}</dd></div>
              <div><dt>ID</dt><dd>{registration.registrationId}</dd></div>
            </dl>
            {actions(registration, true)}
          </article>
        ))}
      </div>
      <div className="speaker-table-wrap">
        <table className="speaker-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Institution</th>
              <th>Ticket</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Attendance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations?.map((registration) => (
              <tr key={registration.id}>
                <td>
                  <strong>{registration.fullName}</strong>
                  <small>{registration.registrationId}</small>
                </td>
                <td>{registration.institution}</td>
                <td>{registration.ticketName}</td>
                <td><span className={`status-pill ${registration.registrationStatus}`}>{registration.registrationStatus}</span></td>
                <td>{registration.paymentStatus}</td>
                <td>{registration.attendance ? "Yes" : "No"}</td>
                <td>{actions(registration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!registrations?.length && <div className="admin-empty-state"><Eye size={18} /> No registrations found</div>}
    </div>
  );
}

export default RegistrationTable;
