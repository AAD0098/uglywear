import { useEffect, useState } from "react";
import { Plus, Warehouse, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

export default function InventoryTab() {
  const [logs, setLogs] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [form, setForm] = useState({ productId: "", warehouseId: "", type: "STOCK_IN", quantity: "", note: "" });
  const [warehouseForm, setWarehouseForm] = useState({ name: "", location: "" });

  const fetchData = async () => {
    try {
      const [logsRes, whRes, prodRes] = await Promise.all([
        api.get("/admin/inventory"),
        api.get("/admin/warehouses"),
        api.get("/products"),
      ]);
      setLogs(logsRes.data.data || logsRes.data || []);
      setWarehouses(whRes.data || []);
      setProducts(prodRes.data || []);
    } catch {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/inventory", form);
      toast.success("Inventory updated");
      setShowForm(false);
      setForm({ productId: "", warehouseId: "", type: "STOCK_IN", quantity: "", note: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update inventory");
    }
  };

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/warehouses", warehouseForm);
      toast.success("Warehouse created");
      setShowWarehouseForm(false);
      setWarehouseForm({ name: "", location: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create warehouse");
    }
  };

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Warehouse size={20} /> Inventory Management
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setShowWarehouseForm(!showWarehouseForm)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Plus size={14} /> Warehouse
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
            <Plus size={16} /> Stock Entry
          </button>
        </div>
      </div>

      {warehouses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {warehouses.map((wh) => (
            <div key={wh.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
              <Warehouse size={18} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{wh.name}</p>
                <p className="text-xs text-gray-500">{wh.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showWarehouseForm && (
        <form onSubmit={handleWarehouseSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h4 className="font-semibold">New Warehouse</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Warehouse name *" value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input placeholder="Location *" value={warehouseForm.location} onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm">Create</button>
            <button type="button" onClick={() => setShowWarehouseForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h4 className="font-semibold">Stock Entry</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Select product *</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
            <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">Select warehouse</option>
              {warehouses.map((wh) => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
            </select>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="RETURN">Return</option>
            </select>
            <input type="number" placeholder="Quantity *" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm col-span-2" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm">Submit</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Warehouse</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Quantity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Note</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{log.product?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{log.warehouse?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${log.type === "STOCK_IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {log.type === "STOCK_IN" ? <ArrowDownToLine size={12} /> : <ArrowUpFromLine size={12} />}
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">{log.quantity}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{log.note || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="text-center text-gray-500 py-8">No inventory logs yet.</p>}
        </div>
      </div>
    </div>
  );
}
