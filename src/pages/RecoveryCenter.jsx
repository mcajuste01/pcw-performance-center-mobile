import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { HeartPulse, Plus, AlertTriangle, Clock, ListChecks, TrendingUp, ChevronRight } from "lucide-react";
import RecoveryOverview from "@/components/recovery/RecoveryOverview";
import RecoveryTrends from "@/components/recovery/RecoveryTrends";
import RecoverySessionModal from "@/components/recovery/RecoverySessionModal";
import InjuryLogModal from "@/components/recovery/InjuryLogModal";
import { toArray } from "@/components/perflab/constants";
import { getCategory, getIntensity, getEffect } from "@/components/recovery/recoveryConstants";

const TABS = [
  { key: "overview", label: "Overview", icon: HeartPulse },
  { key: "log", label: "Recovery Log", icon: ListChecks },
  { key: "injuries", label: "Injuries", icon: AlertTriangle },
  { key: "trends", label: "Trends", icon: TrendingUp },
];

const INJURY_STATUSES = [
  { key: "active", label: "Active", color: "#dc2626" },
  { key: "recovering", label: "Recovering", color: "#f59e0b" },
  { key: "resolved", label: "Resolved", color: "#10b981" },
];

export default function RecoveryCenter() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTraineeId, setSelectedTraineeId] = useState("");
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [injuryModalOpen, setInjuryModalOpen] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const isCoach = user?.role === "coach" || user?.role === "admin";
  const traineeId = isCoach ? selectedTraineeId : user?.id;

  const { data: trainees = [] } = useQuery({
    queryKey: ["recovery-trainees"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" });
      return toArray(res);
    },
    enabled: isCoach,
  });

  useEffect(() => {
    if (isCoach && !selectedTraineeId && trainees.length > 0) {
      setSelectedTraineeId(trainees[0].auth_user_id);
    }
  }, [isCoach, selectedTraineeId, trainees]);

  const { data: readinessChecks = [] } = useQuery({
    queryKey: ["recovery-readiness", traineeId],
    queryFn: async () => {
      const res = await base44.entities.ReadinessCheckIn.filter({ trainee_id: traineeId }, "-check_in_date", 30);
      return toArray(res);
    },
    enabled: !!traineeId,
  });

  const { data: injuries = [] } = useQuery({
    queryKey: ["recovery-injuries", traineeId],
    queryFn: async () => {
      const res = await base44.entities.InjuryCheckIn.filter({ trainee_id: traineeId }, "-check_in_date", 50);
      return toArray(res);
    },
    enabled: !!traineeId,
  });

  const { data: recoverySessions = [] } = useQuery({
    queryKey: ["recovery-sessions", traineeId],
    queryFn: async () => {
      const res = await base44.entities.RecoverySession.filter({ trainee_id: traineeId }, "-session_date", 50);
      return toArray(res);
    },
    enabled: !!traineeId,
  });

  const selectedTrainee = trainees.find((t) => t.auth_user_id === selectedTraineeId);
  const traineeName = isCoach
    ? selectedTrainee?.wrestling_name || selectedTrainee?.full_name || ""
    : user?.full_name || "";

  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <HeartPulse className="w-8 h-8 text-green-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-500 uppercase tracking-widest">Recovery Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Recovery
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track readiness, log recovery, and monitor injuries</p>
        </div>

        {/* Coach trainee selector */}
        {isCoach && (
          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-xs text-gray-500 uppercase">Viewing:</span>
              <select value={selectedTraineeId} onChange={(e) => setSelectedTraineeId(e.target.value)}
                className="flex-1 rounded-md border border-gray-800 bg-[#0a0a0a] text-white px-3 py-1.5 text-sm">
                {trainees.map((t) => (
                  <option key={t.id} value={t.auth_user_id}>{t.wrestling_name || t.full_name}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border"
                style={activeTab === tab.key
                  ? { background: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.4)", color: "#10b981" }
                  : { background: "#1a1a1a", borderColor: "#2a2a2a", color: "#9ca3af" }}
              >
                <TabIcon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {traineeId ? (
          <>
            {activeTab === "overview" && (
              <RecoveryOverview
                readinessChecks={readinessChecks} injuries={injuries} recoverySessions={recoverySessions}
                traineeId={traineeId} traineeName={traineeName}
                onLogSession={() => setSessionModalOpen(true)} onLogInjury={() => setInjuryModalOpen(true)}
              />
            )}
            {activeTab === "log" && (
              <RecoveryLog sessions={recoverySessions} onLogSession={() => setSessionModalOpen(true)} />
            )}
            {activeTab === "injuries" && (
              <InjuryList injuries={injuries} traineeId={traineeId} onLogInjury={() => setInjuryModalOpen(true)} />
            )}
            {activeTab === "trends" && (
              <RecoveryTrends readinessChecks={readinessChecks} recoverySessions={recoverySessions} />
            )}
          </>
        ) : (
          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardContent className="py-10 text-center">
              <HeartPulse className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Select a trainee to view their recovery data</p>
            </CardContent>
          </Card>
        )}
      </div>

      {sessionModalOpen && (
        <RecoverySessionModal open={sessionModalOpen} onClose={() => setSessionModalOpen(false)}
          traineeId={traineeId} traineeName={traineeName} />
      )}
      {injuryModalOpen && (
        <InjuryLogModal open={injuryModalOpen} onClose={() => setInjuryModalOpen(false)}
          traineeId={traineeId} traineeName={traineeName} />
      )}
    </div>
  );
}

function RecoveryLog({ sessions, onLogSession }) {
  if (sessions.length === 0) {
    return (
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="py-10 text-center">
          <ListChecks className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-400 text-sm mb-3">No recovery sessions logged yet</p>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={onLogSession}>
            <Plus className="w-4 h-4 mr-1" /> Log Session
          </Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={onLogSession}>
          <Plus className="w-4 h-4 mr-1" /> Log Session
        </Button>
      </div>
      {sessions.map((s) => {
        const cat = getCategory(s.category);
        const intensity = getIntensity(s.intensity);
        const effect = getEffect(s.perceived_effect);
        return (
          <Card key={s.id} className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}15` }}>
                <HeartPulse className="w-4 h-4" style={{ color: cat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium truncate">{s.activity_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: `${intensity.color}15`, color: intensity.color }}>{intensity.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_minutes}m</span>
                  <span>{s.session_date}</span>
                  {s.perceived_effect && (
                    <span style={{ color: effect.color }}>Felt: {effect.label}</span>
                  )}
                </div>
                {s.notes && <p className="text-xs text-gray-500 mt-1 truncate">{s.notes}</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function InjuryList({ injuries, traineeId, onLogInjury }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.InjuryCheckIn.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recovery-injuries", traineeId] });
      toast({ title: "Status updated" });
    },
  });

  if (injuries.length === 0) {
    return (
      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="py-10 text-center">
          <AlertTriangle className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No injuries logged — stay healthy!</p>
          <Button size="sm" variant="outline" className="border-red-800 text-red-400 hover:bg-red-900/20 mt-3" onClick={onLogInjury}>
            <Plus className="w-4 h-4 mr-1" /> Log Injury
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="border-red-800 text-red-400 hover:bg-red-900/20" onClick={onLogInjury}>
          <Plus className="w-4 h-4 mr-1" /> Log Injury
        </Button>
      </div>
      {injuries.map((inj) => {
        const status = INJURY_STATUSES.find((s) => s.key === inj.status) || INJURY_STATUSES[0];
        const sevColor = inj.severity === "severe" ? "#dc2626" : inj.severity === "moderate" ? "#f59e0b" : "#10b981";
        return (
          <Card key={inj.id} className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{inj.body_area}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${sevColor}15`, color: sevColor }}>{inj.severity}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{inj.injury_type}</p>
                  {inj.description && <p className="text-xs text-gray-500 mt-1">{inj.description}</p>}
                  <p className="text-[10px] text-gray-600 mt-1">Since {inj.check_in_date}</p>
                </div>
                <select
                  value={inj.status}
                  onChange={(e) => statusMutation.mutate({ id: inj.id, status: e.target.value })}
                  className="rounded-md border border-gray-800 bg-[#0a0a0a] text-xs px-2 py-1 shrink-0"
                  style={{ color: status.color }}
                >
                  {INJURY_STATUSES.map((s) => (
                    <option key={s.key} value={s.key} className="text-white">{s.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}