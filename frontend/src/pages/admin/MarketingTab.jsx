import { useEffect, useState } from "react";
import { Plus, Image, Megaphone, Zap, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

export default function MarketingTab() {
  const [banners, setBanners] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("banners");
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showFlashForm, setShowFlashForm] = useState(false);
  const [bannerForm, setBannerForm] = useState({ title: "", image: "", link: "", position: "HERO" });
  const [campaignForm, setCampaignForm] = useState({ name: "", type: "EMAIL", subject: "", content: "" });
  const [flashForm, setFlashForm] = useState({ name: "", discount: "", startDate: "", endDate: "" });

  const fetchData = async () => {
    try {
      const [bannersRes, campaignsRes, flashRes] = await Promise.all([
        api.get("/admin/banners"),
        api.get("/admin/campaigns"),
        api.get("/admin/flash-sales"),
      ]);
      setBanners(bannersRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setFlashSales(flashRes.data || []);
    } catch {
      toast.error("Failed to load marketing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/banners", bannerForm);
      toast.success("Banner created");
      setShowBannerForm(false);
      setBannerForm({ title: "", image: "", link: "", position: "HERO" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create banner");
    }
  };

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/campaigns", campaignForm);
      toast.success("Campaign created");
      setShowCampaignForm(false);
      setCampaignForm({ name: "", type: "EMAIL", subject: "", content: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create campaign");
    }
  };

  const handleFlashSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/flash-sales", flashForm);
      toast.success("Flash sale created");
      setShowFlashForm(false);
      setFlashForm({ name: "", discount: "", startDate: "", endDate: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create flash sale");
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      toast.success("Banner deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  const toggleBanner = async (banner) => {
    try {
      await api.put(`/admin/banners/${banner.id}`, { isActive: !banner.isActive });
      fetchData();
    } catch {
      toast.error("Failed to toggle banner");
    }
  };

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  const sections = [
    { key: "banners", label: "Banners", icon: Image, count: banners.length },
    { key: "campaigns", label: "Campaigns", icon: Megaphone, count: campaigns.length },
    { key: "flash-sales", label: "Flash Sales", icon: Zap, count: flashSales.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {sections.map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${activeSection === s.key ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            <s.icon size={16} /> {s.label} ({s.count})
          </button>
        ))}
      </div>

      {activeSection === "banners" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowBannerForm(!showBannerForm)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
              <Plus size={16} /> New Banner
            </button>
          </div>

          {showBannerForm && (
            <form onSubmit={handleBannerSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Title *" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Image URL *" value={bannerForm.image} onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Link URL" value={bannerForm.link} onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <select value={bannerForm.position} onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="HERO">Hero</option>
                  <option value="SIDEBAR">Sidebar</option>
                  <option value="POPUP">Popup</option>
                  <option value="FOOTER">Footer</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm">Create</button>
                <button type="button" onClick={() => setShowBannerForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{banner.title}</p>
                    <p className="text-xs text-gray-500">{banner.position}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleBanner(banner)} className={`text-xs px-2 py-0.5 rounded ${banner.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => deleteBanner(banner.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {banner.image && <img src={banner.image} alt={banner.title} className="w-full h-24 object-cover rounded-lg bg-gray-100" />}
              </div>
            ))}
            {banners.length === 0 && <p className="text-gray-500 text-sm col-span-2 text-center py-8">No banners yet.</p>}
          </div>
        </div>
      )}

      {activeSection === "campaigns" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCampaignForm(!showCampaignForm)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
              <Plus size={16} /> New Campaign
            </button>
          </div>

          {showCampaignForm && (
            <form onSubmit={handleCampaignSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Campaign name *" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <select value={campaignForm.type} onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PUSH_NOTIFICATION">Push Notification</option>
                </select>
                <input placeholder="Subject" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <textarea placeholder="Content" value={campaignForm.content} onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm">Create</button>
                <button type="button" onClick={() => setShowCampaignForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : c.status === "DRAFT" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && <p className="text-center text-gray-500 py-8">No campaigns yet.</p>}
          </div>
        </div>
      )}

      {activeSection === "flash-sales" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowFlashForm(!showFlashForm)} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
              <Plus size={16} /> New Flash Sale
            </button>
          </div>

          {showFlashForm && (
            <form onSubmit={handleFlashSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Sale name *" value={flashForm.name} onChange={(e) => setFlashForm({ ...flashForm, name: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input type="number" step="0.01" placeholder="Discount % *" value={flashForm.discount} onChange={(e) => setFlashForm({ ...flashForm, discount: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input type="datetime-local" value={flashForm.startDate} onChange={(e) => setFlashForm({ ...flashForm, startDate: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input type="datetime-local" value={flashForm.endDate} onChange={(e) => setFlashForm({ ...flashForm, endDate: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm">Create</button>
                <button type="button" onClick={() => setShowFlashForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashSales.map((sale) => (
              <div key={sale.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Zap size={14} className="text-yellow-500" /> {sale.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{Number(sale.discount)}% off</p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.startDate).toLocaleDateString()} — {new Date(sale.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${sale.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {sale.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
            {flashSales.length === 0 && <p className="text-gray-500 text-sm col-span-2 text-center py-8">No flash sales yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
