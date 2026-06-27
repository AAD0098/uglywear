import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-100 h-8 rounded w-1/3" />
          <div className="bg-gray-100 h-40 rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
        <Link to="/orders" className="text-sm text-gray-600 mt-4 inline-block hover:underline">
          &larr; Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        <span className={`px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium text-gray-900">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Payment</p>
            <p className="font-medium text-gray-900">{order.paymentMethod.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-gray-500">Payment Status</p>
            <p className="font-medium text-gray-900">{order.paymentStatus}</p>
          </div>
          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-medium text-gray-900">৳{Number(order.totalAmount).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Price</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-900">{item.product.name}</td>
                <td className="px-4 py-3 text-right text-gray-600">৳{Number(item.unitPrice).toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">৳{Number(item.totalPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200">
            <tr>
              <td colSpan="3" className="px-4 py-2 text-right text-gray-600">Subtotal</td>
              <td className="px-4 py-2 text-right">৳{Number(order.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan="3" className="px-4 py-2 text-right text-gray-600">Shipping</td>
              <td className="px-4 py-2 text-right">
                {Number(order.shippingCost) === 0 ? "Free" : `৳${Number(order.shippingCost).toFixed(2)}`}
              </td>
            </tr>
            <tr className="font-semibold">
              <td colSpan="3" className="px-4 py-3 text-right">Total</td>
              <td className="px-4 py-3 text-right">৳{Number(order.totalAmount).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
