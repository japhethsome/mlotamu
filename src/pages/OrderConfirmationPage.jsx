import { CheckCircle2, Download } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function OrderConfirmationPage() {
  const { state } = useLocation();
  const order = state?.order;

  if (!order) {
    return (
      <div className="card-surface p-8 text-center">
        No order details were found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card-surface p-8 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={42} />
          </div>
        </div>
        <h1 className="mt-4 text-4xl font-black text-emerald-600">
          Order Confirmed!
        </h1>
        <div className="mt-3 inline-block rounded-2xl bg-orange-100 dark:bg-orange-950 px-5 py-2.5 border border-orange-200 dark:border-orange-800">
          <span className="text-xs uppercase font-bold tracking-wider text-orange-800 dark:text-orange-300 block">
            Pickup Reference Code
          </span>
          <span className="text-2xl font-black font-mono text-savori-brown dark:text-savori-cream">
            #{order.order_number?.replace("ORD-", "") || order.id}
          </span>
        </div>
        <p className="mt-3 text-xs sm:text-sm text-slate-500">
          Order #{order.order_number} • Show this reference code or the QR code at the counter.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div className="card-surface p-5">
          <h2 className="text-xl font-bold">Order summary</h2>
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
                <span>
                  KSh {(Number(item.unit_price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface flex flex-col items-center justify-center p-5">
          <img
            src={order.qrCodeDataUrl}
            alt="Order QR"
            className="h-44 w-44 rounded-2xl border border-slate-200 bg-white p-2"
          />
          <button
            type="button"
            className="btn-secondary mt-4 w-full justify-center gap-2"
          >
            <Download size={15} /> Download receipt
          </button>
        </div>
      </div>
    </div>
  );
}
