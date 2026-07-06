import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Activity, Dumbbell, ClipboardCheck, HeartPulse, Flame, ClipboardList, TrendingUp, Apple, Scale } from "lucide-react";

const ICON_MAP = {
  CalendarCheck, Activity, Dumbbell, ClipboardCheck, HeartPulse,
  Flame, ClipboardList, TrendingUp, Apple, Scale,
};

export default function XPBreakdown({ breakdown }) {
  const sorted = [...breakdown].filter((b) => b.count > 0).sort((a, b) => b.xp - a.xp);
  const totalXp = sorted.reduce((s, b) => s + b.xp, 0);

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="p-4">
        <p className="text-white text-sm font-semibold mb-3">How You Earned XP</p>
        {sorted.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No XP earned yet — start training!</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((b, i) => {
              const Icon = ICON_MAP[b.icon] || Activity;
              const pct = totalXp > 0 ? Math.round((b.xp / totalXp) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${b.color}22` }}>
                    <Icon className="w-4 h-4" style={{ color: b.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-white font-medium">{b.label}</span>
                      <span className="text-xs text-gray-500">×{b.count}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#0a0a0a" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                      </div>
                      <span className="text-xs font-semibold text-white shrink-0" style={{ color: b.color }}>+{b.xp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}