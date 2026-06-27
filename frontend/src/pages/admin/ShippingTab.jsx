import { useEffect, useState } from "react";
import { Plus, Truck, MapPin } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

export default function ShippingTab() {
  const [zones, setZones] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: "", type: "DOMESTIC", regions: "", rate: "", freeAbove: "" });
  const [courierForm, setCourierForm] = useState({ name: "", trackingUrl: "" });

  const fetchData = async () => {
    try {
      const [zonesRes, couriersRes] = await Promise.all([
        api.get("/admin/shipping/zones"),
        api.get("/admin/shipping/couriers"),
      ]);
      setZones(zonesRes.data || []);
      setCouriers(couriersRes.data || []);
    } catch {
      toast.error("Failed to load shipping data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleZoneSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/shipping/zones", {
        ...zoneForm,
        regions: zoneForm.regions.split(",").map((r) => r.trim()).filter(Boolean),
        rate: Number(zoneForm.rate),
        freeAbove: zoneForm.freeAbove ? Number(zoneForm.freeAbove) : null,
      });
      toast.success("Shipping zone created");
      setShowZoneForm(false);
      setZoneForm({ name: "", type: "DOMESTIC", regions: "", rate: "", freeAbove: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create zone");
    }
  };

  const handleCourierSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/shipping/couriers", courierForm);
      toast.success("Courier added");
      setShowCourierForm(false);
      setCourierForm({ name: "", trackingUrl: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add courier");
    }
  };

  const toggleZone = async (zone) => {
    try {
      await api.put(`/admin/shipping/zones/${zone.id}`, { isActive: !zone.isActive });
      fetchData();
    } catch {
      toast.error("Failed to update zone");
    }
  };

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Truck size={20} /> Shipping & Delivery
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setShowCourierForm(!showCourierForm)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Plus size={14} /> Courier
          </button>
          <button onClick={() => setShowZoneForm(!showZoneForm)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
            <Plus size={16} /> Zone
          </button>
        </div>
      </div>

      {showZoneForm && (
        <form onSubmit={handleZoneSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h4 className="font-semibold">New Shipping Zone</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Zone name *" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select value={zoneForm.type} onChange={(e) => setZoneForm({ ...zoneForm, type: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="DOMESTIC">Domestic</option>
              <option value="INTERNATIONAL">International</option>
            </select>
            <input placeholder="Regions (comma separated)" value={zoneForm.regions} onChange={(e) => setZoneForm({ ...zoneForm, regions: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" step="0.01" placeholder="Rate *" value={zoneForm.rate} onChange={(e) => setZoneForm({ ...zoneForm, rate: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" step="0.01" placeholder="Free above (order value)" value={zoneForm.freeAbove} onChange={(e) => setZoneForm({ ...zoneForm, freeAbove: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm">Create Zone</button>
            <button type="button" onClick={() => setShowZoneForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {showCourierForm && (
        <form onSubmit={handleCourierSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h4 className="font-semibold">New Courier</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Courier name *" value={courierForm.name} onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input placeholder="Tracking URL (use {tracking} placeholder)" value={courierForm.trackingUrl} onChange={(e) => setCourierForm({ ...courierForm, trackingUrl: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm">Add Courier</button>
            <button type="button" onClick={() => setShowCourierForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={18} /> Shipping Zones
          </h4>
          {zones.length === 0 ? (
            <p className="text-gray-500 text-sm">No shipping zones configured.</p>
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{zone.name}</p>
                    <p className="text-xs text-gray-500">{zone.type} • Regions: {zone.regions?.join(", ") || "All"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">৳{Number(zone.rate)}</p>
                    {zone.freeAbove && <p className="text-xs text-green-600">Free above ৳{Number(zone.freeAbove)}</p>}
                    <button onClick={() => toggleZone(zone)} className={`mt-1 text-xs px-2 py-0.5 rounded ${zone.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {zone.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={18} /> Couriers
          </h4>
          {couriers.length === 0 ? (
            <p className="text-gray-500 text-sm">No couriers configured.</p>
          ) : (
            <div className="space-y-3">
              {couriers.map((courier) => (
                <div key={courier.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{courier.name}</p>
                    {courier.trackingUrl && <p className="text-xs text-gray-500">{courier.trackingUrl}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${courier.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {courier.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
