import React from "react";
import { HeartPulse, Flame, Trophy, CalendarCheck } from "lucide-react";
import StatCard from "../StatCard";

export default function HeroVitals({ recoveryScore, streak, xp, rank, rankProgress, attendancePct }) {
  const rc = recoveryScore;
  const rcColor = rc == null ? "#6b7280" : rc >= 70 ? "#10b981" : rc >= 50 ? "#f59e0b" : "#dc2626";
  const rcSub = rc == null ? "no check-in" : rc >= 70 ? "ready to train" : rc >= 50 ? "moderate" : "needs rest";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={HeartPulse} label="Recovery Score" value={rc ?? "—"} sub={rcSub} color={rcColor} />
      <StatCard icon={Flame} label="Current Streak" value={streak} sub="day streak" color="#f59e0b" />
      <StatCard icon={Trophy} label="Performance XP" value={xp} sub={`${rank.name} · ${rankProgress.pct}% to next`} color="#8b3dff" />
      <StatCard icon={CalendarCheck} label="Attendance" value={`${attendancePct}%`} sub="this month" color="#10b981" />
    </div>
  );
}