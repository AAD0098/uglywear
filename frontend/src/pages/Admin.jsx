import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Warehouse,
  Truck,
  Megaphone,
  BarChart3,
  Settings,
} from "lucide-react";
import DashboardTab from "./admin/DashboardTab";
import ProductsTab from "./admin/ProductsTab";
import OrdersTab from "./admin/OrdersTab";
import UsersTab from "./admin/UsersTab";
import CouponsTab from "./admin/CouponsTab";
import InventoryTab from "./admin/InventoryTab";
import ShippingTab from "./admin/ShippingTab";
import MarketingTab from "./admin/MarketingTab";
import ReportsTab from "./admin/ReportsTab";
import SettingsTab from "./admin/SettingsTab";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "users", label: "Users", icon: Users },
  { key: "coupons", label: "Coupons", icon: Tag },
  { key: "inventory", label: "Inventory", icon: Warehouse },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "products": return <ProductsTab />;
      case "orders": return <OrdersTab />;
      case "users": return <UsersTab />;
      case "coupons": return <CouponsTab />;
      case "inventory": return <InventoryTab />;
      case "shipping": return <ShippingTab />;
      case "marketing": return <MarketingTab />;
      case "reports": return <ReportsTab />;
      case "settings": return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto flex">
        <aside className="w-56 min-h-screen bg-white border-r border-gray-200 sticky top-0 hidden lg:block">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500">UGLYSTORE Management</p>
          </div>
          <nav className="p-3 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 overflow-x-auto">
          <div className="flex p-2 gap-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs font-medium ${
                  activeTab === tab.key
                    ? "bg-black text-white"
                    : "text-gray-500"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6 pb-24 lg:pb-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {TABS.find((t) => t.key === activeTab)?.label}
            </h1>
          </div>
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
