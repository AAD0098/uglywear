import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { api } from "../../lib/api";
import toast from "react-hot-toast";

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", price: "", discountPrice: "", stock: "",
    sku: "", brand: "", categoryId: "", metaTitle: "", metaDescription: "",
  });

  const fetchProducts = () => {
    api.get("/products")
      .then((res) => setProducts(res.data || []))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  };

  const fetchCategories = () => {
    api.get("/admin/categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        stock: Number(form.stock) || 0,
        sku: form.sku || undefined,
        brand: form.brand || undefined,
        categoryId: form.categoryId || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", discountPrice: "", stock: "", sku: "", brand: "", categoryId: "", metaTitle: "", metaDescription: "" });
    setEditingProduct(null);
    setShowForm(false);
  };

  const editProduct = (product) => {
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      discountPrice: product.discountPrice ? String(product.discountPrice) : "",
      stock: String(product.stock),
      sku: product.sku || "",
      brand: product.brand || "",
      categoryId: product.categoryId || "",
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const toggleActive = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { isActive: !product.isActive });
      fetchProducts();
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">{editingProduct ? "Edit Product" : "New Product"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Product name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" step="0.01" placeholder="Price *" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" step="0.01" placeholder="Discount price" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Meta Title (SEO)" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <input placeholder="Meta Description (SEO)" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
              {editingProduct ? "Update" : "Create"}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.sku || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">৳{Number(product.price).toFixed(0)}</span>
                    {product.discountPrice && (
                      <span className="ml-1 text-xs text-red-500 line-through">৳{Number(product.discountPrice).toFixed(0)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock <= 5 ? "text-red-600 font-bold" : "text-gray-700"}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(product)} className="flex items-center gap-1" title={product.isActive ? "Active" : "Inactive"}>
                      {product.isActive ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                      <span className={`text-xs ${product.isActive ? "text-green-600" : "text-gray-400"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => editProduct(product)} className="p-1 text-gray-500 hover:text-blue-600">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="p-1 text-gray-500 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8">No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
