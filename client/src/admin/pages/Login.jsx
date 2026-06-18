import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

function Login({ api, onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let csrfToken = "";
      try {
        const csrfResponse = await api.get("/api/auth/csrf-token");
        csrfToken = csrfResponse.data.csrfToken;
      } catch (csrfError) {
        console.error("CSRF token fetch failed:", csrfError);
      }

      const response = await api.post("/api/auth/login", form, {
        headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
      });
      onLogin(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.error || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-mark"><ShieldCheck /></div>
        <p className="admin-eyebrow">GHC 2026 CMS</p>
        <h1>Admin Access</h1>
        <p>Sign in to manage the Global Healthcare Conclave CMS shell.</p>

        <label>
          Email
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>

        {error && <div className="admin-error">{error}</div>}

        <button disabled={loading}>
          {loading ? "Signing in..." : "Login"}
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}

export default Login;
