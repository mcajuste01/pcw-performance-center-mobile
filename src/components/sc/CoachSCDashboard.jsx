import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Activity, Flame, TrendingUp, Users, Clock, AlertTriangle, Plus } from "lucide-react";
import StatCard from "./StatCard";
import WorkoutPlanModal from "./WorkoutPlanModal";
import TraineeSCDetail from "./TraineeSCDetail";
import BodyStatForm from "./BodyStatForm";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);
const INTENSITY_SCORE = { light: 1, moderate: 2, intense: 3, maximum: 4 };
const SC_TYPES = ["strength", "conditioning"];

export default function CoachSCDashboard({ user }) {
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planTrainee, setPlanTrainee] = useState(null);
  const [detailTrainee, setDetailTrainee] = useState(null);
  const [statsTrainee, setStatsTrainee] = useState(null);

  const { data: trainees = [] } = useQuery({
    queryKey: ["sc-coach-trainees"],
    queryFn: () => base44.entities.UserProfile.filter({ role: "trainee" }),
    initialData: [],
  });
  const { data: allPlans = [] } = useQuery({
    queryKey: ["sc-coach-plans"],
    queryFn: () => base44.entities.WorkoutPlan.list("-created_date"),
    initialData: [],
  });
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["sc-coach-logs"],
    queryFn: () => base44.entities.TrainingLog.list("-date", 100),
    initialData: [],
  });

  const scLogs = useMemo(
    () => toArray(recentLogs).filter((l) => SC_TYPES.includes(l.drill_type)),
    [recentLogs]
  );

  const roster = useMemo(() => {
    const tArr = toArray(trainees);
    return tArr.map((t) => {
      const tLogs = scLogs.filter((l) => l.trainee_id === t.auth_user_id);
      const activePlan = toArray(allPlans).find(
        (p) => p.trainee_id === t.auth_user_id && p.status === "active"
      );
      const lastLog = tLogs[0];
      const grades = tLogs.map((l) => l.self_grade || l.coach_grade).filter(Boolean);
      const avgGrade = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
      return {
        profile: t,
        sessions: tLogs.length,
        lastLog,
        activePlan,
        avgGrade,
      };
    }).sort((a, b) => b.sessions - a.sessions);
  }, [trainees, scLogs, allPlans]);

  const stats = useMemo(() => {
    const activePlans = toArray(allPlans).filter((p) => p.status === "active").length;
    const traineesWithPlans = roster.filter((r) => r.activePlan).length;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const thisWeek = scLogs.filter((l) => new Date(l.date) >= weekAgo).length;
    const scores = scLogs.map((l) => INTENSITY_SCORE[l.intensity] || 0).filter(Boolean);
    const avgIntensity = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { activePlans, traineesWithPlans, thisWeek, avgIntensity };
  }, [allPlans, scLogs, roster]);

  const volumeChart = useMemo(() => {
    const days = 14;
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const count = scLogs.filter((l) => (l.date || "").slice(0, 10) === key).length;
      out.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sessions: count,
      });
    }
    return out;
  }, [scLogs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Trainees with Plans" value={`${stats.traineesWithPlans}/${roster.length}`} sub="active programs" color="#8b3dff" />
        <StatCard icon={Dumbbell} label="Active Plans" value={stats.activePlans} sub="currently assigned" color="#dc2626" />
        <StatCard icon={Activity} label="Sessions This Week" value={stats.thisWeek} sub="logged by trainees" color="#10b981" />
        <StatCard icon={Flame} label="Avg Intensity" value={stats.avgIntensity ? (Math.round(stats.avgIntensity * 10) / 10) : "—"} sub="1=light, 4=max" color="#f59e0b" />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setPlanTrainee(null); setPlanModalOpen(true); }} style={{ background: "#8b3dff" }}>
          <Plus className="w-4 h-4 mr-1" /> Assign Routine
        </Button>
      </div>

      {/* Volume chart */}
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: "#8b3dff" }} />
            Team S&C Volume (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} interval={1} />
              <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#9ca3af" }} />
              <Bar dataKey="sessions" name="Sessions" fill="#8b3dff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Roster table */}
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "#8b3dff" }} />
            Trainee S&C Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {roster.length > 0 ? (
            <div className="space-y-2">
              {roster.map((r) => {
                const inactive = !r.activePlan && r.sessions === 0;
                return (
                  <div key={r.profile.id} onClick={() => setDetailTrainee(r.profile)} className="p-3 rounded-lg border border-gray-800 flex items-center justify-between gap-3 flex-wrap cursor-pointer hover:border-gray-700 transition" style={{ background: "#0a0a0a" }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm truncate">
                          {r.profile.wrestling_name || r.profile.full_name}
                        </p>
                        {r.profile.tier && (
                          <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-400">{r.profile.tier}</Badge>
                        )}
                        {inactive && (
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: "#f59e0b" }}>
                            <AlertTriangle className="w-3 h-3" /> No activity
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.sessions} session{r.sessions === 1 ? "" : "s"} logged
                        {r.lastLog && ` · last ${new Date(r.lastLog.date).toLocaleDateString()}`}
                        {r.avgGrade > 0 && ` · avg grade ${r.avgGrade.toFixed(1)}/10`}
                      </p>
                    </div>
                    <div className="text-right">
                      {r.activePlan ? (
                        <Badge className="bg-green-900 text-green-300">Active Plan</Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-700 text-gray-500">No Plan</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-sm text-center py-8">No trainees found.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent team sessions */}
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: "#8b3dff" }} />
            Recent Team S&C Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scLogs.length > 0 ? (
            <div className="space-y-2">
              {scLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-3 rounded-lg border border-gray-800 flex items-center justify-between" style={{ background: "#0a0a0a" }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm capitalize">{log.drill_type}</span>
                      <Badge variant="outline" className="text-[10px] capitalize border-gray-700 text-gray-400">{log.intensity}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(log.date).toLocaleDateString()} · {log.duration_minutes || 0} min
                      {(log.self_grade || log.coach_grade) && ` · grade ${log.self_grade || log.coach_grade}/10`}
                    </p>
                    {log.notes && <p className="text-xs text-gray-600 mt-1 truncate">{log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm text-center py-8">No S&C sessions logged by trainees yet.</p>
          )}
        </CardContent>
      </Card>

      <WorkoutPlanModal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        coachId={user.id}
        traineeId={planTrainee?.auth_user_id}
        traineeName={planTrainee?.wrestling_name || planTrainee?.full_name}
        trainees={trainees}
      />
      <TraineeSCDetail
        open={!!detailTrainee}
        onClose={() => setDetailTrainee(null)}
        trainee={detailTrainee}
        coachId={user.id}
        onAssignRoutine={(t) => { setDetailTrainee(null); setPlanTrainee(t); setPlanModalOpen(true); }}
        onLogStats={(t) => { setDetailTrainee(null); setStatsTrainee(t); }}
      />
      <BodyStatForm
        open={!!statsTrainee}
        onClose={() => setStatsTrainee(null)}
        traineeId={statsTrainee?.auth_user_id}
        traineeName={statsTrainee?.wrestling_name || statsTrainee?.full_name}
      />
    </div>
  );
}