import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold tracking-tight text-gray-900">
            UGLYSTORE
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            <Link to="/products" className="text-gray-600 hover:text-gray-900 transition-colors">
              Shop
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative text-gray-600 hover:text-gray-900 transition-colors">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    title="Admin"
                  >
                    <LayoutDashboard size={22} />
                  </Link>
                )}
                <Link to="/orders" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Orders
                </Link>
                <span className="text-sm text-gray-500 hidden sm:inline">{user.fullName}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <User size={20} />
                <span className="text-sm hidden sm:inline">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
