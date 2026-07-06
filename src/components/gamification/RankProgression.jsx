import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RANKS } from "@/components/sc/dashboard/rankSystem";

function RankBadge({ rank, active }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-1 border-2 transition"
        style={{
          borderColor: rank.color,
          background: active ? `${rank.color}22` : "#0a0a0a",
          boxShadow: active ? `0 0 12px ${rank.color}44` : "none",
        }}
      >
        <span className="text-lg font-bold" style={{ color: rank.color }}>{rank.name[0]}</span>
      </div>
      <span className="text-[10px] font-medium" style={{ color: active ? rank.color : "#6b7280" }}>{rank.name}</span>
      <span className="text-[8px] text-gray-600">{rank.min} XP</span>
    </div>
  );
}

export default function RankProgression({ xp, rank, rankProgress }) {
  const pct = rankProgress.pct;

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Current Rank</p>
            <p className="text-2xl font-bold" style={{ color: rank.color, fontFamily: "Rajdhani, sans-serif" }}>{rank.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{xp.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total XP</p>
          </div>
        </div>

        {/* Progress bar to next rank */}
        {rankProgress.next ? (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Progress to <span style={{ color: rankProgress.next.color }}>{rankProgress.next.name}</span></span>
              <span className="text-gray-500">{rankProgress.into}/{rankProgress.needed} XP</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "#0a0a0a" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${rank.color}, ${rankProgress.next.color})`,
                }}
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-1 text-right">{rankProgress.next.min - xp} XP to go</p>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-lg text-center" style={{ background: `${rank.color}11` }}>
            <p className="text-sm font-semibold" style={{ color: rank.color }}>★ Max Rank Achieved ★</p>
          </div>
        )}

        {/* Rank ladder */}
        <div className="flex items-center justify-between gap-1 pt-3 border-t border-gray-800">
          {RANKS.map((r) => (
            <RankBadge key={r.key} rank={r} active={r.key === rank.key} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}