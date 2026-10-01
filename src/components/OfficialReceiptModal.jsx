import { useRef, useState } from "react";
import { CheckCircle2, Printer, X, QrCode, Minus, Maximize2 } from "lucide-react";

export default function OfficialReceiptModal({ order, onClose, onMarkCollected, isStaff = false }) {
  const receiptRef = useRef(null);
  const [minimized, setMinimized] = useState(false);

  if (!order) return null;

  // Extract the clean 6-char ref code from "ORD-XXXXXX" -> "XXXXXX"
  const refCode =
    (order.order_number?.startsWith("ORD-")
      ? order.order_number.replace("ORD-", "")
      : order.qr_token) ||
    String(order.id);

  const receiptNo = `REC-${refCode}`;
  const isCollected = order.status === "collected";

  const handlePrint = () => window.print();

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString();

  // ── MINIMIZED FLOATING WIDGET ──────────────────────────────────────────────
  if (minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 print:hidden">
        <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-savori-brown/20 dark:border-savori-cream/20 shadow-2xl px-4 py-3 animate-in slide-in-from-bottom-4 duration-200">
          {/* Green pulse indicator */}
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />

          {/* Mini code tiles */}
          <div className="flex items-center gap-1">
            {refCode.split("").map((char, i) => (
              <span
                key={i}
                className="flex h-7 w-6 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-950 border border-orange-300 dark:border-orange-700 text-sm font-black text-savori-brown dark:text-savori-cream font-mono"
              >
                {char}
              </span>
            ))}
          </div>

          <span className="text-xs font-bold text-slate-500 hidden sm:block">Receipt</span>

          {/* Expand button */}
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-savori-brown dark:hover:bg-slate-800 dark:hover:text-savori-cream transition-colors"
            aria-label="Expand receipt"
            title="Expand receipt"
          >
            <Maximize2 size={15} />
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40 transition-colors"
            aria-label="Close receipt"
            title="Close receipt"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── FULL RECEIPT MODAL ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">

        {/* Top Action Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Digital Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <Printer size={14} /> Print Receipt
            </button>

            {/* Minimise */}
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              aria-label="Minimise receipt"
              title="Minimise"
            >
              <Minus size={18} />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close receipt"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* RECEIPT CONTENT */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">

          {/* Header */}
          <div className="text-center space-y-2 border-b border-dashed border-slate-300 dark:border-slate-700 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-savori-brown text-white shadow-md overflow-hidden">
              <img src="/logo.png" alt="Savori" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-savori-brown dark:text-savori-cream">SAVORI CAFETERIA</h2>
            <p className="text-xs font-medium text-slate-500">Quality Meals &bull; Fast Fulfillment &bull; Official Customer Receipt</p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 px-4 py-1 text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500/40 shadow-sm">
                <CheckCircle2 size={14} /> PAID VIA PHONE (M-PESA)
              </span>
            </div>
          </div>

          {/* QR CODE + REFERENCE CODE */}
          <div className="rounded-2xl border-2 border-savori-brown/20 dark:border-savori-cream/20 bg-amber-50/60 dark:bg-slate-800/60 p-5 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <QrCode size={11} /> Scan to Verify
              </span>
              {order.qrCodeDataUrl ? (
                <img
                  src={order.qrCodeDataUrl}
                  alt="Order QR Code"
                  className="w-44 h-44 rounded-xl border-4 border-white dark:border-slate-700 shadow-md"
                />
              ) : (
                <div className="w-44 h-44 rounded-xl border-4 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-400 gap-2">
                  <QrCode size={36} />
                  <span className="text-[10px] text-center font-medium px-4">QR code is in your email confirmation</span>
                </div>
              )}
            </div>

            <div className="flex items-center w-full gap-3">
              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">or use code</span>
              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
            </div>

            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Reference Code</p>
              <div className="flex items-center justify-center gap-1.5">
                {refCode.split("").map((char, i) => (
                  <span
                    key={i}
                    className="flex h-10 w-9 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border-2 border-savori-brown/30 dark:border-savori-cream/20 text-xl font-black text-savori-brown dark:text-savori-cream shadow-sm font-mono tracking-tight"
                  >
                    {char}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Present this code or QR at the counter</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700/60 font-mono">
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Order Number</span>
              <strong className="text-base font-black text-savori-orange">{order.order_number}</strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Receipt Number</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{receiptNo}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Date &amp; Time</span>
              <span className="text-slate-700 dark:text-slate-300">{formattedDate}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Customer</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {order.customer_name || "Valued Customer"} &bull; {order.payment_method || "Phone (M-Pesa)"}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>Item &amp; Description</span>
              <span className="text-right">Total (KSh)</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items?.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-start text-sm">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.quantity}&times; {item.menu_name}</span>
                    <p className="text-xs text-slate-400 font-mono">@ KSh {Number(item.unit_price).toFixed(2)} each</p>
                    {item.notes && <p className="text-xs text-amber-600 dark:text-amber-400 italic">Note: {item.notes}</p>}
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-right">
                    {(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-700 pt-4 space-y-2 text-sm font-mono">
            <div className="flex justify-between text-slate-500">
              <span className="font-sans">Subtotal</span>
              <span>KSh {Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span className="font-sans">Tax (10% VAT Included)</span>
              <span>KSh {Number(order.tax || 0).toFixed(2)}</span>
            </div>
            {Number(order.tip || 0) > 0 && (
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Optional Tip</span>
                <span>KSh {Number(order.tip).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-base font-black text-slate-900 dark:text-slate-100">
              <span className="font-sans">TOTAL AMOUNT PAID</span>
              <span className="text-savori-orange text-lg">KSh {Number(order.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Fulfillment Status */}
          <div className="rounded-2xl p-4 border text-center font-sans space-y-1 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pickup &amp; Fulfillment Status</span>
            <span className={`inline-block font-black text-sm uppercase px-3 py-1 rounded-full ${
              isCollected
                ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                : order.status === "ready"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
            }`}>
              {isCollected ? "Collected" : order.status === "ready" ? "Ready for Collection" : order.status}
            </span>
            <p className="text-[11px] text-slate-500">
              {isCollected
                ? "This ticket has already been claimed and handed over."
                : "Present this receipt or reference code at the counter for pickup."}
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-400 space-y-1">
            <p>Thank you for choosing Savori Cafeteria!</p>
            <p>Customer Support: support@savori.co &bull; Powered by Savori Express</p>
          </div>
        </div>

        {/* Staff Action Bar */}
        {isStaff && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between gap-3 print:hidden">
            <div>
              <span className="text-xs font-bold text-slate-500">Staff Verification Action:</span>
              <p className="text-[11px] text-slate-400">Confirm items before handing meal to customer</p>
            </div>
            {!isCollected ? (
              <button
                type="button"
                onClick={() => onMarkCollected && onMarkCollected(order.id, order.qr_token || refCode)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-sm text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 size={16} /> Mark as Collected
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={16} /> Already Collected
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
