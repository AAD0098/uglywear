import { useEffect, useState } from "react";
import { Search, CheckCircle } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

const ROLES = ["CUSTOMER", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER", "MARKETING_MANAGER", "FINANCE_MANAGER", "SUPPORT_AGENT"];

const ROLE_COLORS = {
  ADMIN: "bg-red-100 text-red-700",
  CUSTOMER: "bg-gray-100 text-gray-700",
  PRODUCT_MANAGER: "bg-blue-100 text-blue-700",
  ORDER_MANAGER: "bg-purple-100 text-purple-700",
  MARKETING_MANAGER: "bg-pink-100 text-pink-700",
  FINANCE_MANAGER: "bg-green-100 text-green-700",
  SUPPORT_AGENT: "bg-yellow-100 text-yellow-700",
};

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterRole) params.set("role", filterRole);
    params.set("page", String(page));
    params.set("limit", "20");

    api.get(`/admin/users?${params}`)
      .then((res) => {
        setUsers(res.data.data || res.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search, filterRole, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success(`Role updated to ${role}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change role");
    }
  };

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setFilterRole(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filterRole ? "bg-black text-white" : "bg-gray-100 text-gray-700"}`}>
            All
          </button>
          {ROLES.map((role) => (
            <button key={role} onClick={() => { setFilterRole(role); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterRole === role ? "bg-black text-white" : `${ROLE_COLORS[role]} hover:opacity-80`}`}>
              {role.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Points</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Verified</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{user.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{user._count?.orders || 0}</td>
                  <td className="px-4 py-3 text-gray-700">{user.loyaltyPoints || 0}</td>
                  <td className="px-4 py-3">
                    {user.isVerified ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${ROLE_COLORS[user.role] || "bg-gray-100"}`}>
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-gray-500 py-8">No users found.</p>
          )}
        </div>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50">
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
