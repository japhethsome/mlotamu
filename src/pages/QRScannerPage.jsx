import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, SwitchCamera, QrCode, Search, CheckCircle2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";
import OfficialReceiptModal from "../components/OfficialReceiptModal.jsx";

export default function QRScannerPage() {
  const html5QrCodeRef = useRef(null);
  const { token } = useAuth();
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");

  const handleCollect = async (orderId, tokenOrRef) => {
    try {
      await apiRequest(
        "/orders/collect",
        {
          method: "POST",
          body: JSON.stringify({ orderId, token: tokenOrRef || result?.qr_token || manualCode }),
        },
        token,
      );
      setResult((current) => (current ? { ...current, status: "collected" } : null));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to mark order as collected.");
    }
  };

  const verifyTokenOrRef = async (code) => {
    const q = (code || manualCode).trim();
    if (!q) return;
    setError("");
    try {
      const response = await apiRequest(
        "/orders/verify-qr",
        { method: "POST", body: JSON.stringify({ token: q }) },
        token,
      );
      setResult(response.order);
    } catch (err) {
      setError(err.message || "Invalid QR code or Reference Code.");
      setResult(null);
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (e) {
      console.debug(e);
    } finally {
      setCameraActive(false);
    }
  };

  const startCamera = async (facing = cameraFacing) => {
    setError("");
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
      const el = document.getElementById("device-qr-reader");
      if (!el) return;

      const qrCode = new Html5Qrcode("device-qr-reader");
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: facing },
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        async (decodedText) => {
          await verifyTokenOrRef(decodedText);
        },
        () => {},
      );
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      setCameraActive(false);
      setError(
        err?.message || "Unable to access device camera. Please grant camera permission or use the manual code input.",
      );
    }
  };

  const toggleFacing = async () => {
    const next = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(next);
    if (cameraActive) {
      await startCamera(next);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      startCamera();
    }, 300);

    return () => {
      clearTimeout(t);
      stopCamera();
    };
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-surface p-6 shadow-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-savori-brown dark:text-savori-cream flex items-center gap-2">
              <Camera size={24} className="text-savori-orange" /> Device Camera QR Scanner
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Point your camera at the customer's phone QR code to view their official receipt.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cameraActive ? (
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600 transition-colors"
              >
                <CameraOff size={14} /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startCamera()}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <Camera size={14} /> Start Camera
              </button>
            )}
            <button
              type="button"
              onClick={toggleFacing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <SwitchCamera size={14} /> Flip
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-black border-2 border-slate-800 aspect-square max-h-[340px] w-full mx-auto flex items-center justify-center">
          <div id="device-qr-reader" className="w-full h-full object-cover" />
          {cameraActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-60 w-60 rounded-3xl border-2 border-dashed border-savori-orange/80 shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-savori-orange bg-black/70 px-2 py-0.5 rounded-full">
                  Align QR Code
                </span>
              </div>
            </div>
          )}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900/90">
              <Camera size={44} className="mb-2 text-slate-500 opacity-60" />
              <p className="text-sm font-bold text-slate-200">Camera Inactive</p>
              <button
                type="button"
                onClick={() => startCamera()}
                className="mt-3 flex items-center gap-1.5 rounded-xl bg-savori-orange px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-savori-green transition-colors"
              >
                <Camera size={14} /> Turn On Camera
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Manual 8-digit Reference Code:
          </label>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyTokenOrRef()}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-mono dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-savori-orange/30"
              placeholder="e.g. 84920194 or token"
            />
            <button
              type="button"
              onClick={() => verifyTokenOrRef()}
              className="btn-primary px-5 py-2.5 text-xs font-bold"
            >
              Verify
            </button>
          </div>
        </div>
      </div>

      <div className="card-surface p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Scanned Order Receipt</h2>
          {result ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-300 dark:border-emerald-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block">
                  Payment Status
                </span>
                <p className="text-base font-black text-emerald-800 dark:text-emerald-200">
                  ✓ PAID VIA PHONE (M-PESA)
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Ref Code: #{result.order_number?.replace("ORD-", "") || result.id} • Order #{result.order_number}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Items to Hand Over ({result.items?.length || 0}):
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  {result.items?.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {item.quantity}× {item.menu_name}
                      </span>
                      <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">
                        KSh {(Number(item.unit_price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-base font-black">
                <span>Total Amount Paid</span>
                <span className="text-savori-orange font-mono">KSh {Number(result.total).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <QrCode size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">No Ticket Scanned Yet</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">
                Scan customer's phone QR code or enter their 8-digit reference code to display their official receipt.
              </p>
            </div>
          )}
        </div>

        {result && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            {result.status !== "collected" ? (
              <button
                type="button"
                onClick={() => handleCollect(result.id, result.qr_token)}
                className="btn-primary flex-1 py-3 text-sm font-black flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 size={18} /> Mark as Handed Over / Collected
              </button>
            ) : (
              <div className="w-full text-center py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                ✓ Order has already been collected
              </div>
            )}
          </div>
        )}
      </div>

      {result && (
        <OfficialReceiptModal
          order={result}
          onClose={() => setResult(null)}
          onMarkCollected={handleCollect}
          isStaff={true}
        />
      )}
    </div>
  );
}
