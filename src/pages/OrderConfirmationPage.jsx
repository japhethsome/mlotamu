import { useState } from "react";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import OfficialReceiptModal from "../components/OfficialReceiptModal.jsx";

export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;
  const [showReceipt, setShowReceipt] = useState(false);

  if (!order) {
    return (
      <div className="card-surface p-8 text-center">
        No order details were found.
      </div>
    );
  }

  const refCode = order.order_number?.replace("ORD-", "") || String(order.id);

  const handleDownload = () => {
    setShowReceipt(true);
    setTimeout(() => window.print(), 700);
  };

  return (
    <>
      {showReceipt && (
        <OfficialReceiptModal
          order={order}
          onClose={() => setShowReceipt(false)}
          isStaff={false}
        />
      )}

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="card-surface p-8 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={42} />
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-black text-emerald-600">Payment Confirmed!</h1>
          <p className="mt-1 text-sm text-slate-500">Your order has been received and is being prepared.</p>

          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Reference Code</span>
            <div className="flex items-center justify-center gap-1.5">
              {refCode.split("").map((char, i) => (
                <span
                  key={i}
                  className="flex h-11 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950 border-2 border-orange-300 dark:border-orange-700 text-2xl font-black text-savori-brown dark:text-savori-cream shadow font-mono"
                >
                  {char}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Order {order.order_number} &bull; Show this code or QR at the counter
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_220px]">
          <div className="card-surface p-5">
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="mt-4 space-y-3">
              {order.items?.map((item) => (
                <div
                  key={`${item.menu_item_id}-${item.menu_name}`}
                  className="flex justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div>
                    <p className="font-medium">{item.menu_name}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <span>KSh {(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface flex flex-col items-center justify-center p-5 gap-3">
            {order.qrCodeDataUrl ? (
              <img
                src={order.qrCodeDataUrl}
                alt="Order QR Code"
                className="h-44 w-44 rounded-2xl border-4 border-white shadow-md"
              />
            ) : (
              <div className="h-44 w-44 rounded-2xl border-4 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs text-center px-4">
                QR code sent to your email
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              className="btn-secondary w-full flex justify-center items-center gap-2"
            >
              <FileText size={15} /> View Full Receipt
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary w-full flex justify-center items-center gap-2"
            >
              <Download size={15} /> Download Receipt (PDF)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
