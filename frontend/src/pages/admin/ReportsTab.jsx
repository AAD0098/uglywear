import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

export default function ReportsTab() {
  const [salesData, setSalesData] = useState(null);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  const fetchReports = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        api.get(`/admin/reports/sales?period=${period}`),
        api.get("/admin/reports/products"),
      ]);
      setSalesData(salesRes.data || null);
      setProductData(productsRes.data || []);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  const dailySales = salesData?.dailySales ? Object.entries(salesData.dailySales) : [];
  const maxSale = dailySales.length > 0 ? Math.max(...dailySales.map(([, v]) => v)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 size={20} /> Reports & Analytics
        </h3>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-500">Total Revenue ({period}d)</p>
          <p className="text-2xl font-bold text-green-600">৳{(salesData?.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-blue-600">{salesData?.totalOrders || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-500">Avg Order Value</p>
          <p className="text-2xl font-bold text-purple-600">
            ৳{salesData?.totalOrders ? Math.round(salesData.totalRevenue / salesData.totalOrders).toLocaleString() : 0}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} /> Daily Sales
        </h4>
        {dailySales.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No sales data for this period.</p>
        ) : (
          <div className="space-y-1">
            <div className="flex items-end gap-1 h-48 border-b border-gray-200 pb-2">
              {dailySales.map(([date, value]) => {
                const height = maxSale > 0 ? (value / maxSale) * 100 : 0;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {date}: ৳{value.toLocaleString()}
                    </div>
                    <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors" style={{ height: `${Math.max(height, 2)}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>{dailySales[0]?.[0]}</span>
              <span>{dailySales[dailySales.length - 1]?.[0]}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Top Performing Products</h4>
        {productData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No product data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Units Sold</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productData.map((product, idx) => (
                  <tr key={product?.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-bold">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{product?.name || "Unknown"}</td>
                    <td className="px-4 py-3 text-gray-700">{product?.totalSold || 0}</td>
                    <td className="px-4 py-3 text-gray-700">৳{(product?.totalRevenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
