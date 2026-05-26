const roles = ["SUPER_ADMIN", "ADMIN", "MEDIA", "RESEARCH", "VOLUNTEER"];

function Users({ user }) {
  return (
    <div className="admin-panel">
      <p className="admin-eyebrow">Users</p>
      <h1>Admin Users</h1>
      <p className="admin-muted">User management CRUD arrives in the CMS module phase. Current session shown below.</p>
      <div className="admin-user-table">
        <div><strong>Name</strong><span>{user.name}</span></div>
        <div><strong>Email</strong><span>{user.email}</span></div>
        <div><strong>Role</strong><span>{user.role}</span></div>
      </div>
      <div className="admin-role-pills">
        {roles.map((role) => <span key={role}>{role}</span>)}
      </div>
    </div>
  );
}

export default Users;
