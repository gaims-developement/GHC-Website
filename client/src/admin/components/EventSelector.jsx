import { CalendarDays, Globe2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function EventSelector({ api, user, selectedEventId, globalView, onChange }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .get("/api/events", { params: { admin: 1 } })
      .then((response) => {
        if (!active) return;
        setEvents(response.data.events || []);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api]);

  const value = globalView ? "global" : selectedEventId ? String(selectedEventId) : "";
  const selectedEvent = useMemo(
    () => events.find((event) => String(event.id) === String(selectedEventId)),
    [events, selectedEventId]
  );

  useEffect(() => {
    if (globalView || selectedEventId || events.length === 0) return;
    const published = events.find((event) => event.status === "published");
    const fallback = published || events[0];
    onChange({ eventId: fallback.id, eventSlug: fallback.slug, eventName: fallback.title, isGlobalView: false });
  }, [events, globalView, onChange, selectedEventId]);

  const handleChange = (event) => {
    if (event.target.value === "global") {
      onChange({ eventId: null, eventSlug: null, eventName: "Global View", isGlobalView: true });
      return;
    }

    const nextEvent = events.find((item) => String(item.id) === event.target.value);
    onChange({
      eventId: nextEvent?.id || null,
      eventSlug: nextEvent?.slug || null,
      eventName: nextEvent?.title || null,
      isGlobalView: false,
    });
  };

  return (
    <label className="admin-event-selector" title={globalView ? "Global event view" : selectedEvent?.title || "Select event"}>
      {globalView ? <Globe2 size={16} /> : <CalendarDays size={16} />}
      <select value={value} onChange={handleChange} disabled={loading || (!isSuperAdmin && events.length === 0)}>
        {!globalView && !selectedEventId && <option value="">Select Event</option>}
        {isSuperAdmin && <option value="global">Global View</option>}
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>
    </label>
  );
}

export default EventSelector;
