import { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

const COUPON_TYPES = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING", "BUY_X_GET_Y"];
const SCOPES = ["ALL", "CATEGORY", "PRODUCT", "CUSTOMER", "FIRST_ORDER"];

export default function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "PERCENTAGE", scope: "ALL", value: "",
    minOrderValue: "", maxDiscount: "", usageLimit: "",
    usageLimitPerCustomer: "1", startDate: "", endDate: "",
  });

  const fetchCoupons = () => {
    api.get("/admin/coupons")
      .then((res) => setCoupons(res.data.data || res.data || []))
      .catch(() => toast.error("Failed to load coupons"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/coupons", form);
      toast.success("Coupon created");
      setShowForm(false);
      setForm({ code: "", type: "PERCENTAGE", scope: "ALL", value: "", minOrderValue: "", maxDiscount: "", usageLimit: "", usageLimitPerCustomer: "1", startDate: "", endDate: "" });
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    }
  };

  const toggleCoupon = async (coupon) => {
    try {
      await api.put(`/admin/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch {
      toast.error("Failed to toggle coupon");
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Tag size={20} /> Coupons & Discounts
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Coupon code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              {COUPON_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
            <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              {SCOPES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Value *" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" step="0.01" placeholder="Min order value" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" step="0.01" placeholder="Max discount" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" placeholder="Usage limit (total)" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" placeholder="Per customer limit" value={form.usageLimitPerCustomer} onChange={(e) => setForm({ ...form, usageLimitPerCustomer: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <div />
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">Create Coupon</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Scope</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Valid Until</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{coupon.code}</td>
                  <td className="px-4 py-3 text-gray-700">{coupon.type.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {coupon.type === "PERCENTAGE" ? `${Number(coupon.value)}%` : `৳${Number(coupon.value)}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{coupon.scope}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {coupon.usedCount || 0}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(coupon.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleCoupon(coupon)} className={`px-2 py-1 rounded text-xs font-medium ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteCoupon(coupon.id)} className="p-1 text-gray-500 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && <p className="text-center text-gray-500 py-8">No coupons yet.</p>}
        </div>
      </div>
    </div>
  );
}
