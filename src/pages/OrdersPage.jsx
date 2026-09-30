import { useEffect, useState, useRef } from "react";
import { Download, CheckCircle2, Clock, ShoppingBag, QrCode, FileText } from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";
import OfficialReceiptModal from "../components/OfficialReceiptModal.jsx";

const STATUS_CONFIG = {
  received:  { label: "Received",          color: "text-amber-600",   bg: "bg-amber-50  border-amber-200  dark:bg-amber-950/40 dark:border-amber-800" },
  preparing: { label: "Being Prepared",    color: "text-blue-600",    bg: "bg-blue-50   border-blue-200   dark:bg-blue-950/40  dark:border-blue-800"  },
  ready:     { label: "Ready for Pickup!", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800" },
  collected: { label: "Collected",         color: "text-slate-500",   bg: "bg-slate-50  border-slate-200  dark:bg-slate-800    dark:border-slate-700"  },
  cancelled: { label: "Cancelled",         color: "text-rose-600",    bg: "bg-rose-50   border-rose-200   dark:bg-rose-950/40  dark:border-rose-800"   },
};

/** Generates a QR code data-URL from a string token. */
async function buildQR(text) {
  if (!text) return null;
  try {
    return await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: { dark: "#3b1a0e", light: "#fff9f5" },
    });
  } catch {
    return null;
  }
}

/** Single order card with QR code + reference code. */
function OrderCard({ order, onViewReceipt }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [showQr, setShowQr] = useState(false);

  const refCode = order.order_number?.replace("ORD-", "") || String(order.id);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
  const isPaid = order.payment_status === "paid" || order.payment_status === "completed" || order.payment_status === "success";
  const isCollected = order.status === "collected";

  useEffect(() => {
    if (order.qr_token) {
      buildQR(order.qr_token).then(setQrDataUrl);
    }
  }, [order.qr_token]);

  return (
    <div className={`card-surface overflow-hidden border-2 ${cfg.bg} shadow-md`}>
      {/* Status ribbon */}
      <div className={`flex items-center justify-between px-5 py-3 border-b ${cfg.bg}`}>
        <div className="flex items-center gap-2">
          {isCollected
            ? <CheckCircle2 size={16} className={cfg.color} />
            : <Clock size={16} className={cfg.color} />}
          <span className={`text-sm font-extrabold uppercase tracking-wide ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {new Date(order.created_at).toLocaleString()}
        </span>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Left — order info */}
          <div className="flex-1 space-y-4">
            {/* REF + Order number */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-savori-orange px-3 py-1.5 font-mono text-sm font-black text-white shadow-md shadow-savori-orange/30 tracking-widest">
                REF: #{refCode}
              </span>
              <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-500">
                {order.order_number}
              </span>
              {isPaid && (
                <span className="rounded-lg bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  ✓ Paid via Phone
                </span>
              )}
            </div>

            {/* Items */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Items Ordered
              </p>
              {order.items?.map((item) => (
                <div
                  key={`${order.id}-${item.id}`}
                  className="flex justify-between text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="font-medium">
                    {item.menu_name}
                    <span className="ml-1.5 text-slate-400">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold">
                    KSh {(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-700 pt-3">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total</span>
              <span className="text-lg font-black text-savori-brown dark:text-savori-cream">
                KSh {Number(order.total).toFixed(2)}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {/* QR toggle — only for paid uncollected orders */}
              {order.qr_token && !isCollected && (
                <button
                  type="button"
                  onClick={() => setShowQr((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl bg-savori-brown text-white px-4 py-2 text-xs font-bold shadow-md hover:bg-savori-orange transition-colors"
                >
                  <QrCode size={14} />
                  {showQr ? "Hide QR Code" : "Show QR Code"}
                </button>
              )}
              <button
                type="button"
                onClick={() => onViewReceipt(order)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <FileText size={14} className="text-savori-orange" /> View Official Receipt
              </button>
            </div>
          </div>

          {/* Right — QR Code panel (always visible when order is paid & not collected) */}
          {order.qr_token && !isCollected && (showQr || order.status === "ready") && qrDataUrl && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-savori-orange/40 bg-white dark:bg-slate-900 px-6 py-4 shadow-inner min-w-[170px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-savori-orange">
                Scan to Collect
              </p>
              <img
                src={qrDataUrl}
                alt="Order QR Code"
                className="h-[140px] w-[140px] rounded-xl shadow-md"
              />
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Reference Code</p>
                <p className="font-mono text-lg font-black tracking-widest text-savori-brown dark:text-savori-cream">
                  #{refCode}
                </p>
              </div>
              <p className="text-center text-[10px] text-slate-400 leading-tight">
                Show this QR or reference code to staff when collecting your order.
              </p>
            </div>
          )}

          {/* Collected state — show checkmark instead */}
          {isCollected && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 px-6 py-4 min-w-[140px]">
              <CheckCircle2 size={36} className="text-emerald-500" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">
                Order Collected
              </p>
              <p className="font-mono text-sm font-black text-slate-400">#{refCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  useEffect(() => {
    if (!token) return;
    apiRequest("/orders/my", {}, token)
      .then((data) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card-surface p-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-savori-orange to-amber-500 text-white shadow-md">
          <ShoppingBag size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-savori-brown dark:text-savori-cream">My Orders</h1>
          <p className="text-xs text-slate-500">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
        </div>
      </div>

      {loading ? (
        <div className="card-surface p-12 text-center text-slate-400 animate-pulse">
          Loading your orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-base font-semibold text-slate-500">No orders yet.</p>
          <p className="mt-1 text-sm text-slate-400">Head to the menu and place your first order!</p>
        </div>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewReceipt={(ord) => setSelectedReceiptOrder(ord)}
          />
        ))
      )}

      {/* Official Receipt Modal */}
      {selectedReceiptOrder && (
        <OfficialReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          isStaff={false}
        />
      )}
    </div>
  );
}
