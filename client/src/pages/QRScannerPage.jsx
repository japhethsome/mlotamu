import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";

export default function QRScannerPage() {
  const scannerRef = useRef(null);
  const { token } = useAuth();
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");

  const handleCollect = async () => {
    if (!result) return;
    try {
      await apiRequest(
        "/orders/collect",
        {
          method: "POST",
          body: JSON.stringify({ token: result.qr_token || manualCode }),
        },
        token,
      );
      setResult((current) => ({ ...current, status: "collected" }));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to mark order as collected.");
    }
  };

  useEffect(() => {
    if (!token) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );
    scanner.render(
      async (decodedText) => {
        try {
          const response = await apiRequest(
            "/orders/verify-qr",
            { method: "POST", body: JSON.stringify({ token: decodedText }) },
            token,
          );
          setResult(response.order);
        } catch (err) {
          setError(err.message || "Invalid QR code");
        }
      },
      (err) => {
        console.debug(err);
      },
    );

    scannerRef.current = scanner;

    return () => scanner.clear();
  }, [token]);

  const handleManualSubmit = async () => {
    if (!manualCode) return;
    try {
      const response = await apiRequest(
        "/orders/verify-qr",
        { method: "POST", body: JSON.stringify({ token: manualCode }) },
        token,
      );
      setResult(response.order);
      setError("");
    } catch (err) {
      setError(err.message || "Invalid manual code");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-surface p-5">
        <h1 className="text-3xl font-bold">QR scanner</h1>
        <div
          id="reader"
          className="mt-4 min-h-[320px] rounded-3xl bg-slate-100"
        />
        <div className="mt-4 flex gap-2">
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Or enter order token manually"
          />
          <button
            type="button"
            onClick={handleManualSubmit}
            className="btn-primary"
          >
            Verify
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="card-surface p-5">
        <h2 className="text-2xl font-bold">Order details</h2>
        {result ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>
              <strong>Order #:</strong> {result.order_number}
            </p>
            <p>
              <strong>Status:</strong> {result.status}
            </p>
            <p>
              <strong>Payment:</strong> {result.payment_status}
            </p>
            <div>
              <strong>Items:</strong>
              <ul className="mt-2 list-disc pl-5">
                {result.items?.map((item) => (
                  <li key={item.id}>
                    {item.menu_name} x {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={handleCollect}
              className="btn-primary mt-4"
            >
              Mark as collected
            </button>
          </div>
        ) : (
          <p className="mt-4 text-slate-500">
            Scan or enter a valid order QR code to view order details.
          </p>
        )}
      </div>
    </div>
  );
}
