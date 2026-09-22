import { useState } from "react";
import EventDirectory from "./EventDirectory";

function HospitalityCMS({ api, user }) {
  const [activeTab, setActiveTab] = useState("venues");

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <p className="admin-eyebrow">Hospitality CMS</p>
          <h1>Hospitality & Recommendations</h1>
        </div>
      </div>
      
      <p className="admin-muted mb-6">
        Manage logistics venues, recommended cafes, and stay options for attendees.
      </p>

      <div className="admin-tabs">
        <button
          className={activeTab === "venues" ? "active" : ""}
          onClick={() => setActiveTab("venues")}
        >
          Venues
        </button>
        <button
          className={activeTab === "cafes" ? "active" : ""}
          onClick={() => setActiveTab("cafes")}
        >
          Cafes
        </button>
        <button
          className={activeTab === "stays" ? "active" : ""}
          onClick={() => setActiveTab("stays")}
        >
          Stays
        </button>
      </div>

      <div className="mt-6">
        <EventDirectory api={api} type={activeTab} hideHeader={true} />
      </div>
    </div>
  );
}

export default HospitalityCMS;
