import React from "react";
import { X, TrendingUp } from "lucide-react";

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function StatRow({ label, a, b, format = (v) => v, higherIsBetter = true }) {
  const aVal = typeof a === "number" ? a : 0;
  const bVal = typeof b === "number" ? b : 0;
  const max  = Math.max(aVal, bVal, 1);
  const aWins = higherIsBetter ? aVal >= bVal : aVal <= bVal;
  const tie   = aVal === bVal;

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-bold ${!tie && aWins ? "text-white" : "text-gray-400"}`}
              style={{ fontFamily: "Rajdhani, sans-serif" }}>
              {format(aVal)}
            </span>
            {!tie && aWins && <TrendingUp className="w-3 h-3 text-green-400" />}
          </div>
          <Bar value={aVal} max={max} color={!tie && aWins ? "#8b3dff" : "#374151"} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-bold ${!tie && !aWins ? "text-white" : "text-gray-400"}`}
              style={{ fontFamily: "Rajdhani, sans-serif" }}>
              {format(bVal)}
            </span>
            {!tie && !aWins && <TrendingUp className="w-3 h-3 text-green-400" />}
          </div>
          <Bar value={bVal} max={max} color={!tie && !aWins ? "#dc2626" : "#374151"} />
        </div>
      </div>
    </div>
  );
}

export default function TraineeCompareModal({ trainees, metricsMap, onClose }) {
  const [a, b] = trainees.slice(0, 2);
  const ma = metricsMap[a?.id] || {};
  const mb = metricsMap[b?.id] || {};

  if (!a || !b) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)" }}>

        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(139,61,255,0.06)" }}>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Trainee Comparison
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {[{ t: a, color: "#8b3dff" }, { t: b, color: "#dc2626" }].map(({ t, color }) => (
            <div key={t.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${color}, #0a0a0a)` }}>
                {(t.wrestling_name || t.full_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{t.wrestling_name || t.full_name}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded tier-${(t.tier || "t1").toLowerCase()}`}>
                    {t.tier || "T1"}
                  </span>
                  <span className="text-xs text-gray-500">Lv.{t.level || 1}</span>
                  {t.streak_count > 0 && <span className="text-xs text-gray-500">🔥{t.streak_count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <StatRow label="Avg Performance (30d)" a={ma.avgPerformance} b={mb.avgPerformance}
            format={v => v > 0 ? `${v.toFixed(1)}/10` : "N/A"} />
          <StatRow label="Training Sessions (30d)" a={ma.totalTrainingSessions} b={mb.totalTrainingSessions} />
          <StatRow label="Total Training Hours (30d)" a={ma.totalHours} b={mb.totalHours}
            format={v => `${v.toFixed(1)}h`} />
          <StatRow label="Coach Grade Avg" a={ma.avgCoachGrade} b={mb.avgCoachGrade}
            format={v => v > 0 ? `${v.toFixed(1)}/10` : "N/A"} />
          <StatRow label="Videos Submitted" a={ma.videosSubmitted} b={mb.videosSubmitted} />
          <StatRow label="Pending Assignments" a={ma.pendingAssignments} b={mb.pendingAssignments}
            higherIsBetter={false} />
          <StatRow label="Days Since Last Activity" a={ma.daysSinceActivity} b={mb.daysSinceActivity}
            higherIsBetter={false} format={v => v === 999 ? "Never" : `${v}d`} />
          <StatRow label="Streak" a={a.streak_count || 0} b={b.streak_count || 0} />
          <StatRow label="Level" a={a.level || 1} b={b.level || 1} />
          <StatRow label="XP" a={a.xp || 0} b={b.xp || 0} />
        </div>

        <div className="px-6 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose}
            className="w-full py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}