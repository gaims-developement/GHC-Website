import { CalendarClock, Save } from "lucide-react";
import { useEffect, useState } from "react";

// Deadlines are entered and shown in Indian Standard Time, whatever timezone the admin's browser is in.
const IST_OFFSET = "+05:30";

const toIstInputValue = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
};

const formatIst = (iso) =>
  `${new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} IST`;

function EarlyBird({ api }) {
  const [earlyBird, setEarlyBird] = useState(null);
  // Worked out when settings load, so rendering stays free of clock reads.
  const [expired, setExpired] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const applySettings = (next) => {
    setEarlyBird(next);
    setDeadlineInput(toIstInputValue(next.deadline));
    setExpired(new Date(next.deadline).getTime() <= Date.now());
  };

  useEffect(() => {
    api
      .get("/api/super-admin/early-bird")
      .then((response) => {
        applySettings(response.data.earlyBird);
      })
      .catch((error) => setMessage({ tone: "error", text: error.response?.data?.message || "Could not load early bird settings." }));
  }, [api]);

  const save = async (changes, successText) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await api.put("/api/super-admin/early-bird", changes);
      applySettings(response.data.earlyBird);
      setMessage({ tone: "success", text: successText });
    } catch (error) {
      setMessage({ tone: "error", text: error.response?.data?.message || "Could not save early bird settings." });
    } finally {
      setBusy(false);
    }
  };

  const saveDeadline = (event) => {
    event.preventDefault();
    if (!deadlineInput) return;
    // The minute picker has no seconds; end the minute at :59 so "11:59 PM" means the very end of the day.
    save({ deadline: `${deadlineInput}:59${IST_OFFSET}` }, "Early bird end date saved. The website countdown now uses it.");
  };

  const status = !earlyBird
    ? ""
    : earlyBird.manualOff
    ? "Turned off manually: regular rates are shown on the website."
    : expired
    ? "Ended: the end date has passed, so regular rates are shown."
    : `Active until ${formatIst(earlyBird.deadline)}.`;
  const active = earlyBird && !earlyBird.manualOff && !expired;

  return (
    <div className="admin-settings-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Registration</p>
            <h1>Early Bird</h1>
            <p className="admin-muted">Set when early bird registration ends. The countdown on the website's pricing section follows this date.</p>
          </div>
        </div>
        {message && <div className={message.tone === "success" ? "admin-success" : "admin-error"}>{message.text}</div>}
      </section>

      {earlyBird && (
        <form className="settings-form-grid" onSubmit={saveDeadline}>
          <section className="admin-panel settings-section">
            <p className="admin-eyebrow">Status</p>
            <strong style={{ fontSize: "1.05rem", color: active ? "#0d9488" : "#dc2626" }}>{status}</strong>
            <p className="admin-muted" style={{ margin: 0 }}>Current end date: <strong>{formatIst(earlyBird.deadline)}</strong></p>
            <div>
              <button
                type="button"
                disabled={busy}
                className={earlyBird.manualOff ? "admin-primary-button" : "admin-secondary-button"}
                onClick={() =>
                  save(
                    { manualOff: !earlyBird.manualOff },
                    earlyBird.manualOff ? "Early bird turned back on." : "Early bird turned off. Regular rates are now shown."
                  )
                }
              >
                {earlyBird.manualOff ? "Turn on Early Bird" : "Turn off Early Bird now"}
              </button>
            </div>
          </section>

          <section className="admin-panel settings-section">
            <p className="admin-eyebrow">End date</p>
            <label>
              Early bird ends on (IST)
              <input
                type="datetime-local"
                required
                value={deadlineInput}
                onChange={(event) => setDeadlineInput(event.target.value)}
              />
            </label>
            <button className="admin-primary-button" type="submit" disabled={busy || !deadlineInput}>
              {busy ? <CalendarClock size={18} /> : <Save size={18} />} Save end date
            </button>
          </section>
        </form>
      )}
    </div>
  );
}

export default EarlyBird;
