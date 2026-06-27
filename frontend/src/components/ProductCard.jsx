import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        <span className="text-6xl text-gray-300 group-hover:scale-110 transition-transform">
          👕
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
          {product.description || "No description"}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-semibold text-gray-900">
            ৳{Number(product.price).toFixed(2)}
          </span>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
        {product.stock === 0 && (
          <p className="text-red-500 text-xs mt-1">Out of stock</p>
        )}
      </div>
    </Link>
  );
}
