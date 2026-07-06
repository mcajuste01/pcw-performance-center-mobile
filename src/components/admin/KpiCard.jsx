import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KpiCard({ icon: Icon, label, value, sub, color, trend, trendLabel, onClick, urgent }) {
  const trendIcon =
    trend === "up" ? <TrendingUp className="w-3 h-3" /> :
    trend === "down" ? <TrendingDown className="w-3 h-3" /> :
    <Minus className="w-3 h-3" />;

  const trendColor =
    trend === "up" ? "#10b981" :
    trend === "down" ? "#dc2626" :
    "#6b7280";

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 ${urgent ? "ring-1 ring-red-600/50" : ""}`}
      style={{ background: urgent ? "rgba(220,38,38,0.08)" : "#0f0f0f", border: urgent ? "1px solid rgba(220,38,38,0.3)" : "1px solid rgba(255,255,255,0.07)" }}
      onClick={onClick}
    >
      {/* bg glow */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: color, opacity: 0.07, transform: "translate(40%,-40%)", filter: "blur(20px)" }} />

      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trendLabel && (
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
            {trendIcon}
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-white mb-0.5" style={{ fontFamily: "Rajdhani, sans-serif" }}>{value}</p>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      {sub && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
          {sub.map(({ key, val, color: sc }) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-gray-500">{key}</span>
              <span className="font-semibold" style={{ color: sc || "#fff" }}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}