import { useEffect, useState } from "react";
import { Save, Settings } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

const SETTING_GROUPS = [
  {
    key: "general",
    label: "Store Settings",
    fields: [
      { key: "store_name", label: "Store Name", type: "text" },
      { key: "store_email", label: "Store Email", type: "email" },
      { key: "store_phone", label: "Store Phone", type: "text" },
      { key: "store_address", label: "Store Address", type: "text" },
      { key: "store_logo", label: "Logo URL", type: "text" },
      { key: "store_description", label: "Store Description", type: "textarea" },
    ],
  },
  {
    key: "currency",
    label: "Currency & Tax",
    fields: [
      { key: "currency_code", label: "Currency Code", type: "text", placeholder: "BDT" },
      { key: "currency_symbol", label: "Currency Symbol", type: "text", placeholder: "৳" },
      { key: "tax_rate", label: "Tax Rate (%)", type: "number", placeholder: "0" },
      { key: "tax_included", label: "Tax Included in Price", type: "select", options: ["true", "false"] },
    ],
  },
  {
    key: "payment",
    label: "Payment Gateways",
    fields: [
      { key: "payment_cod_enabled", label: "Cash on Delivery", type: "select", options: ["true", "false"] },
      { key: "payment_bkash_enabled", label: "bKash", type: "select", options: ["true", "false"] },
      { key: "payment_nagad_enabled", label: "Nagad", type: "select", options: ["true", "false"] },
      { key: "payment_stripe_enabled", label: "Stripe", type: "select", options: ["true", "false"] },
      { key: "payment_paypal_enabled", label: "PayPal", type: "select", options: ["true", "false"] },
    ],
  },
  {
    key: "shipping",
    label: "Shipping Settings",
    fields: [
      { key: "shipping_default_rate", label: "Default Shipping Rate", type: "number" },
      { key: "shipping_free_above", label: "Free Shipping Above", type: "number" },
      { key: "shipping_processing_days", label: "Processing Days", type: "number" },
    ],
  },
  {
    key: "notifications",
    label: "Notification Settings",
    fields: [
      { key: "notify_order_email", label: "Email on New Order", type: "select", options: ["true", "false"] },
      { key: "notify_low_stock", label: "Low Stock Alert", type: "select", options: ["true", "false"] },
      { key: "low_stock_threshold", label: "Low Stock Threshold", type: "number", placeholder: "5" },
    ],
  },
];

export default function SettingsTab() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState("general");

  useEffect(() => {
    api.get("/admin/settings")
      .then((res) => setValues(res.data || {}))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", { settings: values, group: activeGroup });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  const group = SETTING_GROUPS.find((g) => g.key === activeGroup);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        {SETTING_GROUPS.map((g) => (
          <button key={g.key} onClick={() => setActiveGroup(g.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeGroup === g.key ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            {g.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Settings size={20} /> {group?.label}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {group?.fields.map((field) => (
            <div key={field.key} className={field.type === "textarea" ? "col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder={field.placeholder}
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.key] || field.options?.[0] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  value={values[field.key] || ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
          <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
