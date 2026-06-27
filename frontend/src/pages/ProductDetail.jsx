import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse grid md:grid-cols-2 gap-8">
          <div className="bg-gray-100 aspect-square rounded-lg" />
          <div className="space-y-4">
            <div className="bg-gray-100 h-8 rounded w-3/4" />
            <div className="bg-gray-100 h-6 rounded w-1/4" />
            <div className="bg-gray-100 h-20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link to="/products" className="text-sm text-gray-600 mt-4 inline-block hover:underline">
          &larr; Back to products
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    addItem(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> Back to products
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-100 aspect-square rounded-lg flex items-center justify-center">
          <span className="text-9xl text-gray-300">👕</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            ৳{Number(product.price).toFixed(2)}
          </p>

          <p className="text-gray-600 mt-4">
            {product.description || "No description available."}
          </p>

          <p className={`text-sm mt-3 ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.stock > 0 && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
