import { useState, useEffect } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { AlertTriangle, Plus, CalendarDays, MapPinned, CheckCircle2 } from "lucide-react";

// --- Draggable Session Item ---
function DraggableSession({ session, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    data: session,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999, opacity: 0.8 }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={{
        ...style,
        cursor: "grab",
        borderColor: session.track_color || "#e2e8f0",
        padding: "12px",
        margin: "0 0 10px 0",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.04)",
        borderLeft: `5px solid ${session.track_color || "#94a3b8"}`,
        borderTop: "1px solid #f1f5f9",
        borderRight: "1px solid #f1f5f9",
        borderBottom: "1px solid #f1f5f9",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      {...listeners}
      {...attributes}
      onDoubleClick={() => onClick(session)}
    >
      <strong style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "6px" }}>{session.title}</strong>
      {session.start_time && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "500", color: "#475569", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", marginBottom: "6px" }}>
          {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {session.end_time ? new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
        </span>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
        <small style={{ fontSize: "11px", color: session.speaker_name ? "#3b82f6" : "#ef4444", fontWeight: "500" }}>
          {session.speaker_name ? `@${session.speaker_name}` : <><AlertTriangle size={10} style={{ display: 'inline' }} /> Unassigned Speaker</>}
        </small>
        {session.track_name && <small style={{ fontSize: "11px", color: "#64748b", backgroundColor: "#f8fafc", padding: "1px 6px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>{session.track_name}</small>}
      </div>
    </article>
  );
}

// --- Droppable Hall Column ---
function DroppableHall({ hall, sessions, onSessionClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hall-${hall.id}`,
    data: hall,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: "1 0 320px",
        backgroundColor: isOver ? "#f0fdf4" : "#f8fafc",
        padding: "0",
        borderRadius: "12px",
        border: isOver ? "2px dashed #22c55e" : "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        overflow: "hidden"
      }}
    >
      <div style={{ padding: "1rem", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MapPinned size={16} className="text-blue-500" /> {hall.name}
        </h3>
        <span style={{ fontSize: "12px", color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", fontWeight: "500" }}>{sessions.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {sessions.map((session) => (
          <DraggableSession key={session.id} session={session} onClick={onSessionClick} />
        ))}
        {sessions.length === 0 && (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #cbd5e1", borderRadius: "8px", margin: "1rem", backgroundColor: "#ffffff" }}>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, fontWeight: "500" }}>Drop sessions here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Schedule Page ---
function Schedule({ api }) {
  const [activeTab, setActiveTab] = useState("timetable"); // timetable, halls
  const [sessions, setSessions] = useState([]);
  const [halls, setHalls] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [tracks, setTracks] = useState([]);
  
  const [sessionModal, setSessionModal] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [hallForm, setHallForm] = useState({});
  const [cmeRecords, setCmeRecords] = useState([]);
  const [cmeForm, setCmeForm] = useState({ sessionName: "", speakerId: "", creditHours: 0, creditPoints: 0, approved: false });

  const loadData = async () => {
    try {
      const [sessionRes, hallRes, speakerRes, trackRes, cmeRes] = await Promise.all([
        api.get("/api/speakers/sessions"),
        api.get("/api/speakers/halls"),
        api.get("/api/speakers?admin=1"),
        api.get("/api/speakers/tracks"),
        api.get("/api/speakers/cme"),
      ]);
      setSessions(sessionRes.data.sessions || []);
      setHalls(hallRes.data.halls || []);
      setSpeakers(speakerRes.data.speakers || []);
      setTracks(trackRes.data.tracks || []);
      setCmeRecords(cmeRes.data.records || []);
    } catch (e) {
      console.error("Failed to load schedule data", e);
    }
  };

  useEffect(() => { loadData(); }, [api]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const sessionId = active.id;
    const overId = String(over.id);
    let targetHallId = null;
    if (overId.startsWith("hall-")) targetHallId = overId.replace("hall-", "");

    const session = sessions.find((s) => s.id === sessionId);
    if (!session || String(session.hall_id) === String(targetHallId)) return;

    setSessionModal({ ...session, hall_id: targetHallId });
  };

  const saveSession = async (e) => {
    e.preventDefault();
    const payload = {
      title: sessionModal.title,
      description: sessionModal.description,
      speakerId: sessionModal.speaker_id,
      sessionType: sessionModal.session_type,
      hallId: sessionModal.hall_id,
      trackId: sessionModal.track_id,
      startTime: sessionModal.start_time ? String(sessionModal.start_time).replace("T", " ") : null,
      endTime: sessionModal.end_time ? String(sessionModal.end_time).replace("T", " ") : null,
      cmeCreditPoints: sessionModal.cme_credit_points || 0,
      status: sessionModal.status || "draft",
    };
    
    try {
      const res = sessionModal.id ? await api.put(`/api/speakers/sessions/${sessionModal.id}`, payload) : await api.post("/api/speakers/sessions", payload);
      setConflicts(res.data.conflicts || []);
      if (!res.data.conflicts || res.data.conflicts.length === 0) setSessionModal(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save session");
    }
  };

  const saveHall = async (e) => {
    e.preventDefault();
    if (hallForm.id) await api.put(`/api/speakers/halls/${hallForm.id}`, hallForm);
    else await api.post("/api/speakers/halls", hallForm);
    setHallForm({});
    loadData();
  };

  const saveCme = async (e) => {
    e.preventDefault();
    await api.post("/api/speakers/cme", cmeForm);
    setCmeForm({ sessionName: "", speakerId: "", creditHours: 0, creditPoints: 0, approved: false });
    loadData();
  };

  const unscheduled = sessions.filter(s => !s.hall_id);
  const scheduled = sessions.filter(s => s.hall_id);

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel" style={{ paddingBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
          <div>
            <p className="admin-eyebrow">Agenda</p>
            <h1>Master Schedule</h1>
            <p className="admin-muted">Drag and drop sessions into halls. Manage CME and Halls in one place.</p>
          </div>
          <button className="admin-primary-button" onClick={() => setSessionModal({ title: "", status: "draft" })}>
            <Plus size={18} /> New Session
          </button>
        </div>
        
        <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid #e2e8f0" }}>
          <button style={{ padding: "0.75rem 1rem", borderBottom: activeTab === "timetable" ? "2px solid #0284c7" : "2px solid transparent", color: activeTab === "timetable" ? "#0284c7" : "#64748b", fontWeight: 500 }} onClick={() => setActiveTab("timetable")}>Timetable</button>
          <button style={{ padding: "0.75rem 1rem", borderBottom: activeTab === "halls" ? "2px solid #0284c7" : "2px solid transparent", color: activeTab === "halls" ? "#0284c7" : "#64748b", fontWeight: 500 }} onClick={() => setActiveTab("halls")}>Halls Management</button>
        </div>
      </section>

      {activeTab === "timetable" && (
        <DndContext onDragEnd={handleDragEnd}>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.5rem", height: "calc(100vh - 250px)" }}>
            <div style={{ width: "320px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff", borderRadius: "12px 12px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CalendarDays size={18} className="text-blue-500" /> Unscheduled
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", fontWeight: "500" }}>{unscheduled.length}</span>
              </div>
              <div style={{ padding: "1rem", flex: 1, overflowY: "auto", backgroundColor: "#f8fafc" }}>
                {unscheduled.map(session => <DraggableSession key={session.id} session={session} onClick={setSessionModal} />)}
                {unscheduled.length === 0 && (
                  <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#dcfce7", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                      <CalendarDays size={24} />
                    </div>
                    <p style={{ fontSize: "14px", color: "#334155", fontWeight: "500", margin: 0 }}>All caught up!</p>
                    <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>No unscheduled sessions remaining.</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
              {halls.map(hall => {
                const hallSessions = scheduled.filter(s => String(s.hall_id) === String(hall.id)).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
                return <DroppableHall key={hall.id} hall={hall} sessions={hallSessions} onSessionClick={setSessionModal} />;
              })}
            </div>
          </div>
        </DndContext>
      )}

      {activeTab === "halls" && (
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "2rem", marginTop: "1.5rem" }}>
          <form className="admin-panel" onSubmit={saveHall} style={{ alignSelf: "start" }}>
            <h2>{hallForm.id ? "Edit Hall" : "Add Hall"}</h2>
            <div className="super-form-grid" style={{ marginTop: "1.5rem" }}>
              <label>Name<input value={hallForm.name || ""} onChange={(e) => setHallForm({...hallForm, name: e.target.value})} required /></label>
              <label>Capacity<input type="number" value={hallForm.capacity || ""} onChange={(e) => setHallForm({...hallForm, capacity: e.target.value})} /></label>
              <label>Location<input value={hallForm.location || ""} onChange={(e) => setHallForm({...hallForm, location: e.target.value})} /></label>
              <label>Type<select value={hallForm.hallType || "meeting_room"} onChange={(e) => setHallForm({...hallForm, hallType: e.target.value})}><option value="meeting_room">Meeting Room</option><option value="auditorium">Auditorium</option></select></label>
              <button className="admin-primary-button" type="submit">Save Hall</button>
            </div>
          </form>
          <div className="admin-panel">
            <table className="speaker-table">
              <thead><tr><th>Name</th><th>Capacity</th><th>Location</th><th>Type</th><th></th></tr></thead>
              <tbody>
                {halls.map(h => (
                  <tr key={h.id}>
                    <td>{h.name}</td>
                    <td>{h.capacity || "-"}</td>
                    <td>{h.location || "-"}</td>
                    <td>{h.hall_type === "auditorium" ? "Auditorium" : "Meeting Room"}</td>
                    <td><button className="admin-secondary-button" onClick={() => setHallForm({...h, hallType: h.hall_type})}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sessionModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <form className="admin-panel" style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onSubmit={saveSession}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600", color: "#0f172a" }}>{sessionModal.id ? "Edit Session" : "New Session"}</h2>
              <button type="button" onClick={() => setSessionModal(null)} style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}>&times;</button>
            </div>
            
            {conflicts.length > 0 && (
              <div className="admin-error" style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px" }}>
                <strong><AlertTriangle size={16} style={{ display: "inline", marginRight: "8px" }} /> Schedule Conflicts Detected</strong>
                <ul style={{ margin: "8px 0 0 24px" }}>{conflicts.map(c => <li key={c.id}>{c.title} ({c.conflict})</li>)}</ul>
              </div>
            )}

            <div className="super-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <label style={{ gridColumn: "1 / -1" }}>Title<input value={sessionModal.title || ""} onChange={(e) => setSessionModal({...sessionModal, title: e.target.value})} required /></label>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <h3 style={{ fontSize: "1.1rem", borderBottom: "1px solid #eee", paddingBottom: "0.5rem" }}>Scheduling</h3>
                <label>Hall<select value={sessionModal.hall_id || ""} onChange={(e) => setSessionModal({...sessionModal, hall_id: e.target.value})}><option value="">Unassigned</option>{halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
                <label>Start Time<input type="datetime-local" value={sessionModal.start_time ? String(sessionModal.start_time).slice(0,16) : ""} onChange={(e) => setSessionModal({...sessionModal, start_time: e.target.value})} /></label>
                <label>End Time<input type="datetime-local" value={sessionModal.end_time ? String(sessionModal.end_time).slice(0,16) : ""} onChange={(e) => setSessionModal({...sessionModal, end_time: e.target.value})} /></label>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <h3 style={{ fontSize: "1.1rem", borderBottom: "1px solid #eee", paddingBottom: "0.5rem" }}>Details & CME</h3>
                <label>Speaker<select value={sessionModal.speaker_id || ""} onChange={(e) => setSessionModal({...sessionModal, speaker_id: e.target.value})}><option value="">Unassigned</option>{speakers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                <label>CME Points<input type="number" value={sessionModal.cme_credit_points || 0} onChange={(e) => setSessionModal({...sessionModal, cme_credit_points: e.target.value})} /></label>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
              <button className="admin-primary-button" type="submit">Save Session</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Schedule;
