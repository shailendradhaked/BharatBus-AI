import React, { useState } from 'react';

export default function X402Payment({ routeId, fareAmount, passengerName }) {
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState(null);

  const handleX402Payment = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sample testnet wallet address simulation for hackathon demonstration
      const mockWalletAddress = "ALGORAND_TESTNET_USER_WALLET_ADDRESS_XYZ123";

      const response = await fetch("http://localhost:8000/api/x402/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: mockWalletAddress,
          fare_amount: fareAmount || 5000000, // microAlgos
          route_id: routeId || "JAIPUR-MAIN-ROUTE",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentResult(data);
      } else {
        setError(data.detail || "Payment verification failed.");
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Failed to connect to backend x402 service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md mx-auto mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">x402 Smart Ticketing</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
          Algorand Testnet
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Passenger: <span className="font-semibold text-gray-800">{passengerName || "Guest"}</span><br />
        Route: <span className="font-semibold text-gray-800">{routeId || "General Route"}</span>
      </p>

      <button
        onClick={handleX402Payment}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-2.5 rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
      >
        {loading ? "Processing x402 Flow..." : "Pay via GoPlausible (x402)"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {paymentResult && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm">
          <p className="font-semibold text-green-800 mb-1">✓ x402 Payment Successful!</p>
          <p className="text-gray-600 text-xs mb-2">{paymentResult.message}</p>
          <a
            href={paymentResult.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-medium text-blue-600 underline hover:text-blue-800"
          >
            View Live Transaction on LoRA Explorer →
          </a>
        </div>
      )}
    </div>
  );
}