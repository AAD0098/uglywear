import { useEffect, useState } from "react";
import { ShoppingBag, Package, Users, DollarSign, TrendingUp, AlertTriangle, Clock } from "lucide-react";
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

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-28 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-64 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-gray-500">Unable to load dashboard.</p>;

  const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`৳${stats.totalRevenue.toLocaleString()}`} color="bg-green-500" subtitle={`Today: ৳${stats.revenueToday.toLocaleString()}`} />
        <StatCard icon={Package} label="Total Orders" value={stats.totalOrders} color="bg-blue-500" subtitle={`${stats.pendingOrders} pending`} />
        <StatCard icon={ShoppingBag} label="Total Products" value={stats.totalProducts} color="bg-purple-500" />
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-xl font-bold text-green-600">৳{stats.revenueToday.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-500">This Week</p>
          <p className="text-xl font-bold text-blue-600">৳{stats.revenueWeek.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-xl font-bold text-purple-600">৳{stats.revenueMonth.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Orders by Status
          </h3>
          <div className="space-y-3">
            {ORDER_STATUSES.map((status) => {
              const count = stats.ordersByStatus[status] || 0;
              const total = stats.totalOrders || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium w-28 text-center ${STATUS_COLORS[status]}`}>
                    {status}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-gray-800 rounded-full h-2" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag size={20} /> Top Selling Products
          </h3>
          {stats.topSellingProducts?.length === 0 ? (
            <p className="text-gray-500 text-sm">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topSellingProducts?.map((product, idx) => (
                <div key={product?.id || idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-5">#{idx + 1}</span>
                    <p className="text-sm font-medium text-gray-900">{product?.name || "Unknown"}</p>
                  </div>
                  <span className="text-sm text-gray-600">{product?.totalSold || 0} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" /> Low Stock Alerts
          </h3>
          {stats.lowStockProducts?.length === 0 ? (
            <p className="text-gray-500 text-sm">All products well stocked.</p>
          ) : (
            <div className="space-y-2">
              {stats.lowStockProducts?.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm text-gray-900">{p.name}</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.stock === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={20} /> Recent Orders
          </h3>
          {stats.recentOrders?.length === 0 ? (
            <p className="text-gray-500 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders?.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.user?.fullName || "N/A"}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">৳{Number(order.totalAmount).toFixed(0)}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
