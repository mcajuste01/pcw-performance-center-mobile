import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { getRank } from "@/components/sc/dashboard/rankSystem";

export default function MiniLeaderboard({ trainees, currentUserId }) {
  const sorted = [...trainees].sort((a, b) => b.xp - a.xp).slice(0, 5);

  const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="p-4">
        <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" /> Top Performers
        </p>
        {sorted.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No rankings yet</p>
        ) : (
          <div className="space-y-1.5">
            {sorted.map((t, i) => {
              const rank = getRank(t.xp || 0);
              const isMe = t.id === currentUserId || t.auth_user_id === currentUserId;
              return (
                <div key={t.id || i} className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ background: isMe ? "rgba(139,61,255,0.08)" : "#0a0a0a", border: isMe ? "1px solid rgba(139,61,255,0.3)" : "1px solid transparent" }}>
                  <span className="w-6 text-center text-sm font-bold">
                    {medal(i) || `#${i + 1}`}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${rank.color}88, ${rank.color}44)` }}>
                    <span className="text-xs font-bold text-white">{(t.wrestling_name || t.full_name || "?")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {t.wrestling_name || t.full_name}
                      {isMe && <span className="text-purple-400 ml-1.5 text-[10px]">(You)</span>}
                    </p>
                    <p className="text-[10px]" style={{ color: rank.color }}>{rank.name}</p>
                  </div>
                  <span className="text-sm font-bold text-white shrink-0">{(t.xp || 0).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}