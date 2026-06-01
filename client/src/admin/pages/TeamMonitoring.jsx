import { Activity, Boxes, Clock, Users } from "lucide-react";
import { useEffect, useState } from "react";

function TeamMonitoring({ api }) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    api.get("/api/super-admin/teams")
      .then((response) => setTeams(response.data.teams || []))
      .catch(() => {});
  }, [api]);

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Monitoring</p>
        <h1>Team Monitoring</h1>
        <p className="admin-muted">Track team members, last activity, pending tasks and assigned CMS modules.</p>
      </section>

      <section className="admin-panel">
        <div className="speaker-table-wrap">
          <table className="speaker-table">
            <thead>
              <tr>
                <th>Team name</th>
                <th><Users size={14} /> Members</th>
                <th><Clock size={14} /> Last activity</th>
                <th><Activity size={14} /> Pending tasks</th>
                <th><Boxes size={14} /> Assigned modules</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td><strong>{team.name}</strong><small>{team.description}</small></td>
                  <td>{team.memberCount}</td>
                  <td>{team.lastActivity ? new Date(team.lastActivity).toLocaleString() : "No activity"}</td>
                  <td>{team.pendingTasks}</td>
                  <td>
                    <div className="admin-role-pills compact">
                      {(team.assignedModules || []).map((module) => <span key={module.id}>{module.label}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default TeamMonitoring;
