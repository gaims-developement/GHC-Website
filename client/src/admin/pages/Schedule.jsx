import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function Schedule({ api }) {
  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    api.get("/api/speakers/sessions").then((response) => setSessions(response.data.sessions || [])).catch(() => {});
  }, [api]);

  const grouped = useMemo(() => sessions.reduce((acc, session) => {
    const day = session.start_time ? new Date(session.start_time).toLocaleDateString() : "Unscheduled";
    acc[day] = [...(acc[day] || []), session];
    return acc;
  }, {}), [sessions]);

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel"><p className="admin-eyebrow">Agenda</p><h1>Visual Schedule</h1><p className="admin-muted">Live timetable grouped by conference day. Use Sessions to edit time slots and resolve conflicts.</p></section>
      {Object.entries(grouped).map(([day, items]) => (
        <section className="admin-panel" key={day}>
          <h2>{day}</h2>
          <div className="schedule-board">
            {items.map((session) => (
              <article key={session.id} style={{ borderColor: session.track_color || "rgba(255,255,255,.12)" }}>
                <strong>{session.title}</strong>
                <span>{session.start_time ? new Date(session.start_time).toLocaleTimeString() : "No time"} - {session.end_time ? new Date(session.end_time).toLocaleTimeString() : ""}</span>
                <small>{session.speaker_name || <><AlertTriangle size={12} /> Missing speaker</>} · {session.hall_name || "No hall"} · {session.track_name || "No track"}</small>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default Schedule;
