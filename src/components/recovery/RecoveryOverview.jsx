import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { HeartPulse, AlertTriangle, Plus, Lightbulb, Bed, Activity } from "lucide-react";
import { calculateDailyReadiness, shouldFlag, getReadinessLevel } from "@/components/perflab/readinessScore";
import { getRecoveryRecommendations, getActivity, getCategory } from "./recoveryConstants";

const todayStr = () => new Date().toISOString().slice(0, 10);
const PRIORITY_COLORS = { high: "#dc2626", medium: "#f59e0b", low: "#10b981" };

function ReadinessRing({ score }) {
  const size = 130, radius = (size - 18) / 2, circ = 2 * Math.PI * radius;
  const offset = circ - (Math.max(0, Math.min(100, score)) / 100) * circ;
  const level = getReadinessLevel(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1a1a1a" strokeWidth="9" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={level.color} strokeWidth="9" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black" style={{ color: level.color, fontFamily: "Rajdhani, sans-serif" }}>{score}</span>
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">{level.label}</span>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange, color }) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: "#1a1a1a", accentColor: color }} />
    </div>
  );
}

export default function RecoveryOverview({ readinessChecks, injuries, recoverySessions, traineeId, traineeName, onLogSession, onLogInjury }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = todayStr();
  const todayCheckIn = readinessChecks.find((c) => c.check_in_date === today);
  const latest = todayCheckIn || readinessChecks[0];
  const activeInjuries = injuries.filter((i) => i.status === "active");
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const sessionsThisWeek = recoverySessions.filter((s) => s.session_date >= weekAgo);

  const [form, setForm] = useState({ sleep: 3, energy: 3, soreness: 3, stress: 3, pain: 0, water_intake: "", nutrition: "good", notes: "" });
  const [showCheckIn, setShowCheckIn] = useState(!todayCheckIn);

  const checkInMutation = useMutation({
    mutationFn: (data) => base44.entities.ReadinessCheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-readiness", traineeId] });
      toast({ title: "Check-in logged!" });
      setShowCheckIn(false);
    },
  });

  const handleSubmit = () => {
    const score = calculateDailyReadiness(form);
    const flagged = shouldFlag(score, form.pain);
    checkInMutation.mutate({
      trainee_id: traineeId, trainee_name: traineeName, check_in_date: today,
      ...form, readiness_score: score, flagged,
    });
  };

  const recommendations = latest
    ? getRecoveryRecommendations({
        readinessScore: latest.readiness_score || 0, sleep: latest.sleep, soreness: latest.soreness,
        stress: latest.stress, pain: latest.pain, activeInjuries: activeInjuries.length,
      })
    : [{ priority: "low", title: "Check In", message: "Log your first readiness check-in to get personalized recommendations.", activities: [] }];

  const score = latest?.readiness_score || 0;

  return (
    <div className="space-y-4">
      {/* Readiness + Quick Check-in */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-5 flex flex-col items-center text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5" /> {todayCheckIn ? "Today's Readiness" : "Latest Readiness"}
            </p>
            {latest ? (
              <>
                <ReadinessRing score={score} />
                <p className="text-xs text-gray-500 mt-2">
                  {latest.check_in_date === today ? "Checked in today" : `Last: ${latest.check_in_date}`}
                </p>
                {latest.flagged && (
                  <span className="mt-2 px-2 py-0.5 rounded-full text-[10px] bg-red-600/20 text-red-400 border border-red-600/30">
                    ⚠ Flagged for lighter session
                  </span>
                )}
                {!todayCheckIn && (
                  <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 mt-3 text-xs"
                    onClick={() => setShowCheckIn(true)}>
                    Check In Now
                  </Button>
                )}
              </>
            ) : (
              <div className="py-6">
                <Bed className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 text-sm mb-3">No check-ins yet</p>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => setShowCheckIn(true)}>
                  Start First Check-In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: activeInjuries.length > 0 ? "rgba(220,38,38,0.15)" : "rgba(16,185,129,0.15)" }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: activeInjuries.length > 0 ? "#dc2626" : "#10b981" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activeInjuries.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Active Injuries</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,61,255,0.15)" }}>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{sessionsThisWeek.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Sessions This Week</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Quick Actions</p>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs justify-start" onClick={onLogSession}>
                <Plus className="w-3.5 h-3.5 mr-2" /> Log Recovery Session
              </Button>
              <Button size="sm" variant="outline" className="w-full border-red-800 text-red-400 hover:bg-red-900/20 text-xs justify-start" onClick={onLogInjury}>
                <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Log Injury
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick check-in form */}
      {showCheckIn && (
        <Card className="border-gray-700" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-green-500" /> Daily Readiness Check-In
              </p>
              {todayCheckIn && (
                <button onClick={() => setShowCheckIn(false)} className="text-xs text-gray-500 hover:text-gray-300">Hide</button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
              <SliderRow label="Sleep Quality" value={form.sleep} min={1} max={5} onChange={(v) => setForm({ ...form, sleep: v })} color="#8b3dff" />
              <SliderRow label="Energy Level" value={form.energy} min={1} max={5} onChange={(v) => setForm({ ...form, energy: v })} color="#10b981" />
              <SliderRow label="Soreness" value={form.soreness} min={1} max={5} onChange={(v) => setForm({ ...form, soreness: v })} color="#f59e0b" />
              <SliderRow label="Stress" value={form.stress} min={1} max={5} onChange={(v) => setForm({ ...form, stress: v })} color="#ec4899" />
              <SliderRow label="Pain (0-10)" value={form.pain} min={0} max={10} onChange={(v) => setForm({ ...form, pain: v })} color="#dc2626" />
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Nutrition</span>
                <select value={form.nutrition} onChange={(e) => setForm({ ...form, nutrition: e.target.value })}
                  className="w-full rounded-md border border-gray-800 bg-[#0a0a0a] text-white px-2 py-1.5 text-xs">
                  <option value="poor">Poor</option><option value="fair">Fair</option>
                  <option value="good">Good</option><option value="excellent">Excellent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmit} disabled={checkInMutation.isPending}>
                {checkInMutation.isPending ? "Saving..." : "Submit Check-In"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <div>
        <p className="text-white text-sm font-semibold mb-2 flex items-center gap-1">
          <Lightbulb className="w-4 h-4 text-yellow-500" /> Recovery Recommendations
        </p>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <Card key={i} className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardContent className="p-3 flex items-start gap-3">
                <span className="mt-0.5 w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[rec.priority] }} />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{rec.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{rec.message}</p>
                  {rec.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {rec.activities.map((aKey) => {
                        const act = getActivity(aKey);
                        const cat = getCategory(act?.category);
                        return (
                          <span key={aKey} className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: `${cat.color}15`, color: cat.color }}>
                            {act?.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}