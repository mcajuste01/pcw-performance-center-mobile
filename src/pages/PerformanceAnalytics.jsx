import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { BarChart3, TrendingUp, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import AnalyticsOverview from "@/components/analytics/AnalyticsOverview";
import BaselineComparison from "@/components/analytics/BaselineComparison";
import ReportGeneratorModal from "@/components/analytics/ReportGeneratorModal";
import ReportsList from "@/components/analytics/ReportsList";
import { toArray } from "@/components/perflab/constants";
import { PROGRESS_LEVELS } from "@/components/perflab/constants";

const toArrayLocal = (v) => Array.isArray(v) ? v : v?.items || [];

export default function PerformanceAnalytics() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [coachTraineeId, setCoachTraineeId] = useState("");

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const isStaff = user?.role === "coach" || user?.role === "admin";
  const traineeId = isStaff ? coachTraineeId : user?.id;

  // Trainee roster for coaches
  const { data: trainees = [] } = useQuery({
    queryKey: ["analytics-trainees"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" });
      return toArrayLocal(res);
    },
    enabled: isStaff,
  });

  useEffect(() => {
    if (isStaff && !coachTraineeId && trainees.length > 0) {
      setCoachTraineeId(trainees[0].auth_user_id);
    }
  }, [isStaff, coachTraineeId, trainees]);

  const activeTrainee = isStaff
    ? trainees.find((t) => t.auth_user_id === coachTraineeId)
    : null;
  const traineeName = isStaff
    ? activeTrainee?.wrestling_name || activeTrainee?.full_name || ""
    : user?.full_name || "";

  // Fetch all performance data for the active trainee
  const { data: readinessCheckIns = [] } = useQuery({
    queryKey: ["analytics-readiness", traineeId],
    queryFn: async () => {
      const res = await base44.entities.ReadinessCheckIn.filter({ trainee_id: traineeId }, "-check_in_date", 30);
      return toArrayLocal(res);
    },
    enabled: !!traineeId,
  });

  const { data: baselineTests = [] } = useQuery({
    queryKey: ["analytics-baselines", traineeId],
    queryFn: async () => {
      const res = await base44.entities.BaselineTest.filter({ trainee_id: traineeId }, "-test_date", 20);
      return toArrayLocal(res);
    },
    enabled: !!traineeId,
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ["analytics-workouts", traineeId],
    queryFn: async () => {
      const res = await base44.entities.WorkoutPlan.filter({ trainee_id: traineeId }, "-created_date", 50);
      return toArrayLocal(res);
    },
    enabled: !!traineeId,
  });

  const { data: recoverySessions = [] } = useQuery({
    queryKey: ["analytics-recovery", traineeId],
    queryFn: async () => {
      const res = await base44.entities.RecoverySession.filter({ trainee_id: traineeId }, "-session_date", 50);
      return toArrayLocal(res);
    },
    enabled: !!traineeId,
  });

  const { data: wrestlingMetrics = [] } = useQuery({
    queryKey: ["analytics-metrics", traineeId],
    queryFn: async () => {
      const res = await base44.entities.WrestlingMetric.filter({ trainee_id: traineeId }, "-test_date", 50);
      return toArrayLocal(res);
    },
    enabled: !!traineeId,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["performance-reports", traineeId],
    queryFn: async () => {
      const res = await base44.entities.PerformanceReport.filter({ trainee_id: traineeId }, "-report_month", 20);
      return toArrayLocal(res);
    },
    enabled: !!traineeId,
  });

  // Aggregate summary data for report generation
  const summaryData = useMemo(() => {
    const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const monthCheckIns = readinessCheckIns.filter((c) => (c.check_in_date || "") >= thirtyAgo);
    const avgReadiness = monthCheckIns.length > 0
      ? Math.round(monthCheckIns.reduce((s, c) => s + (c.readiness_score || 0), 0) / monthCheckIns.length)
      : null;
    const completedWorkouts = workouts.filter((w) => w.completion_status === "completed").length;
    const workoutPct = workouts.length > 0 ? Math.round((completedWorkouts / workouts.length) * 100) : 0;
    const recoveryCount = recoverySessions.filter((r) => (r.session_date || "") >= thirtyAgo).length;

    // Category scores from wrestling metrics
    const condMetrics = wrestlingMetrics.filter((m) => m.category === "conditioning");
    const strMetrics = wrestlingMetrics.filter((m) => m.category === "strength");
    const conditioningScore = condMetrics.length > 0
      ? Math.round(condMetrics.reduce((s, m) => s + Math.min(100, m.value), 0) / condMetrics.length) : null;
    const strengthScore = strMetrics.length > 0
      ? Math.round(strMetrics.reduce((s, m) => s + Math.min(100, m.value), 0) / strMetrics.length) : null;

    return {
      avgReadiness,
      attendancePct: Math.min(100, monthCheckIns.length * 4),
      completedWorkouts,
      totalWorkouts: workouts.length,
      workoutPct,
      recoveryCount,
      baselineCount: baselineTests.length,
      conditioningScore,
      strengthScore,
      activeInjuries: 0,
    };
  }, [readinessCheckIns, workouts, recoverySessions, wrestlingMetrics, baselineTests]);

  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <BarChart3 className="w-8 h-8 text-purple-500 animate-pulse" />
      </div>
    );
  }

  if (!traineeId) {
    return (
      <div className="min-h-full flex items-center justify-center p-4" style={{ background: "#0a0a0a" }}>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const TABS = [
    { key: "overview", label: "Overview", icon: TrendingUp },
    { key: "baselines", label: "Baseline Progress", icon: BarChart3 },
    { key: "reports", label: "Reports", icon: FileText },
  ];

  const data = { readinessCheckIns, baselineTests, workouts, recoverySessions };

  return (
    <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Analytics</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Performance Analytics
            </h1>
            <p className="text-gray-500 text-sm mt-1">Track progress, compare baselines, and generate reports</p>
          </div>
          {isStaff && (
            <Button onClick={() => setReportModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 self-start">
              <FileText className="w-4 h-4 mr-2" /> New Report
            </Button>
          )}
        </div>

        {/* Coach trainee selector */}
        {isStaff && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-800" style={{ background: "#0f0f0f" }}>
            <span className="text-xs text-gray-500 uppercase">Viewing:</span>
            <select value={coachTraineeId} onChange={(e) => setCoachTraineeId(e.target.value)}
              className="flex-1 rounded-md border border-gray-800 bg-[#0a0a0a] text-white px-3 py-1.5 text-sm">
              {trainees.map((t) => (
                <option key={t.id} value={t.auth_user_id}>{t.wrestling_name || t.full_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition border"
                style={activeTab === tab.key
                  ? { background: "rgba(139,61,255,0.15)", borderColor: "rgba(139,61,255,0.4)", color: "#8b3dff" }
                  : { background: "#1a1a1a", borderColor: "#2a2a2a", color: "#9ca3af" }}
              >
                <TabIcon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <AnalyticsOverview data={data} />}

        {activeTab === "baselines" && <BaselineComparison baselineTests={baselineTests} />}

        {activeTab === "reports" && (
          <ReportsList
            reports={reports}
            traineeName={traineeName}
            canGenerate={isStaff}
            onGenerate={() => setReportModalOpen(true)}
          />
        )}
      </div>

      {reportModalOpen && (
        <ReportGeneratorModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          trainee={activeTrainee || { auth_user_id: user.id, full_name: user.full_name }}
          summaryData={summaryData}
        />
      )}
    </div>
  );
}