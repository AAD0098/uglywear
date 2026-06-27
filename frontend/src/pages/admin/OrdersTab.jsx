import { useEffect, useState } from "react";
import { FileText, RotateCcw } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RETURNED: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [timeline, setTimeline] = useState({});
  const [refundModal, setRefundModal] = useState(null);
  const [refundForm, setRefundForm] = useState({ amount: "", reason: "" });

  const fetchOrders = () => {
    api.get("/orders")
      .then((res) => setOrders(res.data || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const fetchTimeline = async (orderId) => {
    if (timeline[orderId]) {
      setTimeline((prev) => ({ ...prev, [orderId]: null }));
      return;
    }
    try {
      const res = await api.get(`/admin/orders/${orderId}/timeline`);
      setTimeline((prev) => ({ ...prev, [orderId]: res.data || [] }));
    } catch {
      toast.error("Failed to load timeline");
    }
  };

  const generateInvoice = async (orderId) => {
    try {
      await api.post(`/admin/invoices/${orderId}`);
      toast.success("Invoice generated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate invoice");
    }
  };

  const submitRefund = async () => {
    if (!refundModal) return;
    try {
      await api.post(`/admin/orders/${refundModal}/refund`, {
        amount: Number(refundForm.amount),
        reason: refundForm.reason,
      });
      toast.success("Refund processed");
      setRefundModal(null);
      setRefundForm({ amount: "", reason: "" });
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process refund");
    }
  };

  const filtered = filterStatus
    ? orders.filter((o) => o.status === filterStatus)
    : orders;

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilterStatus("")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filterStatus ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            All ({orders.length})
          </button>
          {STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            if (count === 0) return null;
            return (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterStatus === s ? "bg-black text-white" : `${STATUS_COLORS[s]} hover:opacity-80`}`}>
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => (
                <>
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{order.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.user?.fullName || "N/A"}</p>
                      <p className="text-xs text-gray-500">{order.user?.email || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.items?.length || 0}</td>
                    <td className="px-4 py-3 font-medium">৳{Number(order.totalAmount).toFixed(0)}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{order.paymentMethod?.replace("_", " ")}</p>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[order.status]}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => fetchTimeline(order.id)} className="p-1 text-gray-500 hover:text-blue-600" title="Timeline">
                          <FileText size={15} />
                        </button>
                        <button onClick={() => generateInvoice(order.id)} className="p-1 text-gray-500 hover:text-green-600" title="Generate Invoice">
                          <FileText size={15} />
                        </button>
                        <button onClick={() => setRefundModal(order.id)} className="p-1 text-gray-500 hover:text-red-600" title="Refund">
                          <RotateCcw size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {timeline[order.id] && (
                    <tr key={`${order.id}-timeline`}>
                      <td colSpan={8} className="px-4 py-3 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Order Timeline</p>
                        {timeline[order.id].length === 0 ? (
                          <p className="text-xs text-gray-500">No timeline events yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {timeline[order.id].map((t) => (
                              <div key={t.id} className="flex items-center gap-2 text-xs">
                                <span className={`px-2 py-0.5 rounded ${STATUS_COLORS[t.status] || "bg-gray-100 text-gray-700"}`}>{t.status}</span>
                                <span className="text-gray-500">{new Date(t.createdAt).toLocaleString()}</span>
                                {t.note && <span className="text-gray-600">— {t.note}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8">No orders found.</p>
          )}
        </div>
      </div>

      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Process Refund</h3>
            <input type="number" step="0.01" placeholder="Refund amount *" value={refundForm.amount}
              onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <textarea placeholder="Reason" value={refundForm.reason}
              onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <div className="flex gap-3">
              <button onClick={submitRefund} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                Process Refund
              </button>
              <button onClick={() => setRefundModal(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
