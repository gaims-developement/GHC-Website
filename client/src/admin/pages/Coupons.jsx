import { BadgePercent, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const emptyCoupon = { code: "", discountType: "percentage", value: 0, usageLimit: 0, expiryDate: "", isActive: true };

function Coupons({ api }) {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyCoupon);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get("/api/register/coupons").then((response) => setCoupons(response.data.coupons || []));

  useEffect(() => {
    load().catch(() => {});
  }, [api]);

  const save = async (event) => {
    event.preventDefault();
    if (editingId) await api.put(`/api/register/coupons/${editingId}`, form);
    else await api.post("/api/register/coupons", form);
    setForm(emptyCoupon);
    setEditingId(null);
    load();
  };

  const edit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discount_type,
      value: coupon.value,
      usageLimit: coupon.usage_limit,
      expiryDate: coupon.expiry_date ? String(coupon.expiry_date).slice(0, 10) : "",
      isActive: coupon.is_active !== false,
    });
  };

  const deactivate = async (coupon) => {
    await api.patch(`/api/register/coupons/${coupon.id}/deactivate`);
    load();
  };

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Discount & Coupons</p>
        <h1>Coupons</h1>
        <p className="admin-muted">Create, edit, deactivate and track usage for registration discounts.</p>
      </section>
      <section className="admin-panel">
        <form className="super-form-grid" onSubmit={save}>
          <label>Code<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label>
          <label>Type<select value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></label>
          <label>Value<input type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} /></label>
          <label>Usage Limit<input type="number" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} /></label>
          <label>Expiry Date<input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} /></label>
          <button className="admin-primary-button" type="submit"><Plus size={18} /> {editingId ? "Save Coupon" : "Create Coupon"}</button>
        </form>
      </section>
      <section className="admin-panel">
        <div className="speaker-table-wrap">
          <table className="speaker-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Usage</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td><strong>{coupon.code}</strong></td>
                  <td>{coupon.discount_type}</td>
                  <td>{coupon.value}</td>
                  <td>{coupon.used_count}/{coupon.usage_limit || "∞"}</td>
                  <td>{coupon.expiry_date ? String(coupon.expiry_date).slice(0, 10) : "-"}</td>
                  <td><span className={coupon.is_active ? "status-pill accepted" : "status-pill rejected"}>{coupon.is_active ? "Active" : "Inactive"}</span></td>
                  <td><button className="admin-secondary-button" type="button" onClick={() => edit(coupon)}>Edit</button> <button className="admin-danger-button" type="button" onClick={() => deactivate(coupon)}>Deactivate</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!coupons.length && <div className="admin-empty-state"><BadgePercent size={18} /> No coupons yet</div>}
      </section>
    </div>
  );
}

export default Coupons;
