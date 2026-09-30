import { useRef } from "react";
import { CheckCircle2, Printer, X, Smartphone, ShieldCheck, Clock, Hash, User } from "lucide-react";

export default function OfficialReceiptModal({ order, onClose, onMarkCollected, isStaff = false }) {
  const receiptRef = useRef(null);
  if (!order) return null;

  const refCode = order.order_number?.replace("ORD-", "") || String(order.id);
  const receiptNo = `REC-${refCode}`;
  const isPaid = order.payment_status === "paid";
  const isCollected = order.status === "collected";

  const handlePrint = () => {
    window.print();
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Top Action Header (Non-printable) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Official Digital Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <Printer size={14} /> Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* RECEIPT CONTENT AREA */}
        <div ref={receiptRef} className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          {/* Header & Logo */}
          <div className="text-center space-y-2 border-b border-dashed border-slate-300 dark:border-slate-700 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-savori-brown text-white shadow-md overflow-hidden">
              <img src="/logo.png" alt="Savori" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-savori-brown dark:text-savori-cream">
              SAVORI CAFETERIA
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Quality Meals • Fast Fulfillment • Official Customer Receipt
            </p>

            {/* Official PAID Badge Stamp */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 px-4 py-1 text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500/40 shadow-sm">
                <CheckCircle2 size={14} /> PAID VIA PHONE (M-PESA)
              </span>
            </div>
          </div>

          {/* Reference & Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700/60 font-mono">
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Reference Code</span>
              <strong className="text-base font-black text-savori-orange">#{refCode}</strong>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Receipt Number</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{receiptNo}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Order ID</span>
              <span className="text-slate-700 dark:text-slate-300">{order.order_number}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Date & Time</span>
              <span className="text-slate-700 dark:text-slate-300">{formattedDate}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400 uppercase text-[10px] block font-sans font-bold">Customer</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {order.customer_name || "Valued Customer"} • {order.payment_method || "Phone (M-Pesa)"}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>Item & Description</span>
              <span className="text-right">Total (KSh)</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items?.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-start text-sm">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {item.quantity}× {item.menu_name}
                    </span>
                    <p className="text-xs text-slate-400 font-mono">
                      @ KSh {Number(item.unit_price).toFixed(2)} each
                    </p>
                    {item.notes ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                        Note: {item.notes}
                      </p>
                    ) : null}
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-right">
                    {(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Calculation */}
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
              <span className="text-savori-orange text-lg">
                KSh {Number(order.total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Fulfillment Status Banner */}
          <div className="rounded-2xl p-4 border text-center font-sans space-y-1 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Pickup & Fulfillment Status
            </span>
            <span
              className={`inline-block font-black text-sm uppercase px-3 py-1 rounded-full ${
                isCollected
                  ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  : order.status === "ready"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {isCollected ? "✓ Order Collected" : order.status === "ready" ? "● Ready for Collection" : `● ${order.status}`}
            </span>
            <p className="text-[11px] text-slate-500">
              {isCollected
                ? "This ticket has already been claimed and handed over."
                : "Present this receipt or reference code at the counter for pickup."}
            </p>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-slate-400 space-y-1">
            <p>Thank you for choosing Savori Cafeteria!</p>
            <p>Customer Support: support@savori.co • Powered by Savori Express</p>
          </div>
        </div>

        {/* Staff Handover Action Bar (Non-printable) */}
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
