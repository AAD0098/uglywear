import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "CARD", label: "Card" },
];

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [placing, setPlacing] = useState(false);

  const shippingCost = subtotal >= 1000 ? 0 : 60;
  const total = subtotal + shippingCost;

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }

    setPlacing(true);
    try {
      await api.post("/orders", {
        paymentMethod,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      });
      clearCart();
      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Your cart is empty</h2>
        <Link
          to="/products"
          className="inline-block mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-3xl">👕</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.slug}`} className="font-medium text-gray-900 hover:underline truncate block">
                  {item.name}
                </Link>
                <p className="text-gray-600 text-sm">৳{Number(item.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center border border-gray-300 rounded">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">
                  -
                </button>
                <span className="px-3 py-1 text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">
                  +
                </button>
              </div>
              <p className="font-medium text-gray-900 w-24 text-right">
                ৳{(Number(item.price) * item.quantity).toFixed(2)}
              </p>
              <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>{shippingCost === 0 ? "Free" : `৳${shippingCost.toFixed(2)}`}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCheckout}
            disabled={placing}
            className="w-full mt-4 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {placing ? "Placing Order..." : "Place Order"}
          </button>

          {subtotal < 1000 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Free shipping on orders over ৳1,000
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
