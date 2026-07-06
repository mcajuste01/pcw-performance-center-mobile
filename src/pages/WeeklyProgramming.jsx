import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  CalendarDays, Plus, Dumbbell, Moon, CheckCircle2, Trash2, Clock, ChevronRight,
} from "lucide-react";
import WeeklyProgramModal from "@/components/weekly/WeeklyProgramModal";
import { PROGRESS_LEVELS, getLevelInfo } from "@/components/perflab/constants";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);
const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyProgramming() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeLevel, setActiveLevel] = useState("foundation");
  const [modalOpen, setModalOpen] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: traineeProfiles = [] } = useQuery({
    queryKey: ["weekly-roster"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" });
      return toArray(res);
    },
  });

  const { data: fitnessProfiles = [] } = useQuery({
    queryKey: ["weekly-fitness-profiles"],
    queryFn: async () => {
      const res = await base44.entities.FitnessProfile.filter({});
      return toArray(res);
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["weekly-programs"],
    queryFn: async () => {
      const res = await base44.entities.WorkoutPlan.filter({}, "-created_date");
      return toArray(res);
    },
  });

  const isCoach = user?.role === "coach" || user?.role === "admin";

  const traineesByLevel = useMemo(() => {
    const map = {};
    PROGRESS_LEVELS.forEach((l) => (map[l.key] = []));
    traineeProfiles.forEach((tp) => {
      const fp = fitnessProfiles.find((f) => f.trainee_id === tp.auth_user_id);
      const lvl = fp?.current_level || "foundation";
      if (map[lvl]) map[lvl].push({ profile: tp, fitness: fp });
    });
    return map;
  }, [traineeProfiles, fitnessProfiles]);

  const programsByLevel = useMemo(() => {
    const map = {};
    PROGRESS_LEVELS.forEach((l) => (map[l.key] = []));
    programs.forEach((p) => {
      if (map[p.level]) map[p.level].push(p);
    });
    return map;
  }, [programs]);

  const traineeName = (traineeId) => {
    const tp = traineeProfiles.find((t) => t.auth_user_id === traineeId);
    return tp?.wrestling_name || tp?.full_name || "Trainee";
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-programs"] });
      toast({ title: "Program deleted" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (plan) =>
      base44.entities.WorkoutPlan.update(plan.id, {
        completion_status: "completed",
        completed_date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      toast({ title: "Program marked complete! 💪" });
      queryClient.invalidateQueries({ queryKey: ["weekly-programs"] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Dumbbell className="w-8 h-8 text-purple-500 animate-pulse" />
      </div>
    );
  }

  // ---------- TRAINEE VIEW ----------
  if (!isCoach) {
    const myPrograms = programs.filter(
      (p) => p.trainee_id === user.id && p.status === "active" && p.completion_status !== "completed"
    );
    const myCompleted = programs.filter((p) => p.trainee_id === user.id && p.completion_status === "completed");

    return (
      <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5" style={{ color: "#8b3dff" }} />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Weekly Programming</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              My Training Week
            </h1>
            <p className="text-gray-500 text-sm mt-1">Your assigned weekly program, day by day</p>
          </div>

          {myPrograms.length === 0 ? (
            <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardContent className="py-12 text-center">
                <CalendarDays className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No active weekly program assigned</p>
                <p className="text-gray-600 text-sm mt-1">Your coach will assign one based on your level</p>
              </CardContent>
            </Card>
          ) : (
            myPrograms.map((plan) => {
              const lvl = getLevelInfo(plan.level);
              const schedule = (plan.weekly_schedule || []).slice().sort(
                (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
              );
              return (
                <Card key={plan.id} className="border-gray-800" style={{ background: "#0f0f0f" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Dumbbell className="w-4 h-4" style={{ color: lvl.color }} />
                        {plan.title}
                      </CardTitle>
                      <div className="flex gap-1.5">
                        <Badge className="capitalize" style={{ background: `${lvl.color}22`, color: lvl.color, border: `1px solid ${lvl.color}55` }}>
                          {lvl.name}
                        </Badge>
                        {plan.frequency && (
                          <Badge variant="outline" className="border-gray-700 text-gray-400">{plan.frequency}</Badge>
                        )}
                      </div>
                    </div>
                    {plan.description && <p className="text-sm text-gray-400 mt-1">{plan.description}</p>}
                  </CardHeader>
                  <CardContent>
                    {schedule.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {schedule.map((day, i) => (
                          <DayCard key={i} day={day} levelColor={lvl.color} />
                        ))}
                      </div>
                    ) : plan.exercises?.length > 0 ? (
                      <div className="space-y-1.5">
                        {plan.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "#0a0a0a" }}>
                            <span className="text-white text-sm font-medium">{ex.name}</span>
                            <span className="text-gray-400 text-xs">{ex.sets} sets × {ex.reps}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No exercises scheduled</p>
                    )}
                    <Button
                      onClick={() => completeMutation.mutate(plan)}
                      disabled={completeMutation.isPending}
                      variant="outline"
                      className="w-full mt-4 border-green-800 text-green-400 hover:bg-green-900/20"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Program Complete
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}

          {myCompleted.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed Programs ({myCompleted.length})
              </p>
              <div className="space-y-1.5">
                {myCompleted.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                    <span className="text-gray-300 text-sm">{plan.title}</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- COACH VIEW ----------
  const levelPrograms = programsByLevel[activeLevel] || [];
  const levelTrainees = traineesByLevel[activeLevel] || [];

  return (
    <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5" style={{ color: "#8b3dff" }} />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Weekly Programming</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Program Builder
            </h1>
            <p className="text-gray-500 text-sm mt-1">Structured weekly programs across 5 progression levels</p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="text-white font-semibold px-6"
            style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}
          >
            <Plus className="w-4 h-4 mr-2" /> New Program
          </Button>
        </div>

        {/* Level Tabs */}
        <div className="flex flex-wrap gap-2">
          {PROGRESS_LEVELS.map((l) => {
            const count = (programsByLevel[l.key] || []).length;
            return (
              <button
                key={l.key}
                onClick={() => setActiveLevel(l.key)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all border flex items-center gap-2"
                style={
                  activeLevel === l.key
                    ? { background: `${l.color}22`, borderColor: `${l.color}66`, color: l.color }
                    : { background: "#1a1a1a", borderColor: "#2a2a2a", color: "#9ca3af" }
                }
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                {l.name}
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Level description */}
        <div className="rounded-lg p-3 border" style={{ background: `${getLevelInfo(activeLevel).color}0d`, borderColor: `${getLevelInfo(activeLevel).color}33` }}>
          <p className="text-sm" style={{ color: getLevelInfo(activeLevel).color }}>{getLevelInfo(activeLevel).description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {getLevelInfo(activeLevel).focus.map((f) => (
              <span key={f} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#9ca3af" }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Trainees at this level */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Trainees at this level ({levelTrainees.length})</h3>
          {levelTrainees.length === 0 ? (
            <p className="text-gray-600 text-sm">No trainees currently at this level</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {levelTrainees.map(({ profile }) => (
                <span key={profile.id} className="px-3 py-1 rounded-full text-xs border border-gray-800 text-gray-300" style={{ background: "#0f0f0f" }}>
                  {profile.wrestling_name || profile.full_name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Programs at this level */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Programs ({levelPrograms.length})</h3>
          {levelPrograms.length === 0 ? (
            <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardContent className="py-10 text-center">
                <CalendarDays className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No programs built for this level yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {levelPrograms.map((plan) => {
                const lvl = getLevelInfo(plan.level);
                const schedule = plan.weekly_schedule || [];
                const trainingDays = schedule.filter((d) => !d.is_rest_day).length;
                return (
                  <Card key={plan.id} className="border-gray-800" style={{ background: "#0f0f0f" }}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-white text-base">{plan.title}</CardTitle>
                          <p className="text-xs text-gray-500 mt-0.5">{traineeName(plan.trainee_id)}</p>
                        </div>
                        {plan.completion_status === "completed" && (
                          <Badge className="bg-green-600/20 text-green-300 border border-green-600/30">Completed</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {plan.description && <p className="text-xs text-gray-400">{plan.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" style={{ color: lvl.color }} />{trainingDays} training days</span>
                        {plan.frequency && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.frequency}</span>}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {plan.completion_status !== "completed" && (
                          <Button size="sm" variant="outline" className="border-green-800 text-green-400 hover:bg-green-900/20 h-7 text-xs" onClick={() => completeMutation.mutate(plan)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-gray-500 hover:text-red-400 h-7 text-xs px-2" onClick={() => deleteMutation.mutate(plan.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <WeeklyProgramModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        coachId={user.id}
        trainees={traineeProfiles}
        level={activeLevel}
        onSaved={() => {}}
      />
    </div>
  );
}

function DayCard({ day, levelColor }) {
  if (day.is_rest_day) {
    return (
      <div className="rounded-lg p-3 border" style={{ background: "#0a0a0a", borderColor: "#1f1f1f" }}>
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm font-medium">{day.day}</span>
          <Moon className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <p className="text-xs text-gray-600 italic mt-1">Rest / Recovery</p>
      </div>
    );
  }
  const exercises = day.exercises || [];
  return (
    <div className="rounded-lg p-3 border" style={{ background: "#0a0a0a", borderColor: `${levelColor}33` }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-white text-sm font-semibold">{day.day}</span>
        {day.focus && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${levelColor}22`, color: levelColor }}>{day.focus}</span>}
      </div>
      {exercises.length > 0 ? (
        <div className="space-y-1">
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{ex.name}</span>
              <span className="text-gray-500">{ex.sets}×{ex.reps}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600">No exercises</p>
      )}
    </div>
  );
}