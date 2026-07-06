import React from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, LogOut } from "lucide-react";

export default function PaymentReminder({ user }) {
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
    } catch (e) {
      window.location.href = "/";
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#0a0a0a" }}
    >
      <div className="max-w-md w-full">
        <div
          className="rounded-2xl border border-red-900/40 p-8 text-center"
          style={{ background: "#111" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(220,38,38,0.15)" }}
          >
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            Account On Hold
          </h1>
          <p className="text-gray-400 text-sm mb-1">
            Hi {user?.full_name?.split(" ")[0] || "there"},
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Your monthly dues for {monthLabel} haven't been verified. Please reach out to your coach
            or the PCW admin to settle your payment and restore access to the Performance Center.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            style={{
              background: "rgba(139,61,255,0.15)",
              color: "#8b3dff",
              border: "1px solid rgba(139,61,255,0.3)",
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-4">
          Platinum Championship Wrestling · Performance Center
        </p>
      </div>
    </div>
  );
}