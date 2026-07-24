import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dumbbell, User, ClipboardCheck, Calendar, HeartPulse,
  Gauge, Award, Bot, FlaskConical, CalendarDays, Flame,
  Apple, Activity, BarChart3, Trophy,
} from "lucide-react";
import FitnessProfileSection from "@/components/perflab/FitnessProfileSection";
import BaselineTestSection from "@/components/perflab/BaselineTestSection";
import WeeklyPlanSection from "@/components/perflab/WeeklyPlanSection";
import ReadinessCheckInSection from "@/components/perflab/ReadinessCheckInSection";
import WrestlingMetricsSection from "@/components/perflab/WrestlingMetricsSection";
import PromotionScoreSection from "@/components/perflab/PromotionScoreSection";
import ProgressLevelsSection from "@/components/perflab/ProgressLevelsSection";
import AICoachSection from "@/components/perflab/AICoachSection";
import { toArray } from "@/components/perflab/constants";
import StrengthConditioning from "@/pages/StrengthConditioning";
import WeeklyProgramming from "@/pages/WeeklyProgramming";
import WrestlingConditioning from "@/pages/WrestlingConditioning";
import RecoveryCenter from "@/pages/RecoveryCenter";
import NutritionCenter from "@/pages/NutritionCenter";
import PerformanceAnalytics from "@/pages/PerformanceAnalytics";
import GamificationCenter from "@/pages/GamificationCenter";

const PERFLAB_TABS = ["profile", "baseline", "plan", "readiness", "metrics", "score", "coach"];

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "baseline", label: "Baseline", icon: ClipboardCheck },
  { key: "sc", label: "Strength & Conditioning", icon: Dumbbell },
  { key: "weekly", label: "Weekly Programs", icon: CalendarDays },
  { key: "plan", label: "Weekly Plan", icon: Calendar },
  { key: "conditioning", label: "Conditioning Drills", icon: Flame },
  { key: "readiness", label: "Readiness", icon: HeartPulse },
  { key: "recovery", label: "Recovery", icon: Activity },
  { key: "nutrition", label: "Nutrition", icon: Apple },
  { key: "metrics", label: "Metrics", icon: Gauge },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "score", label: "Readiness Score", icon: Award },
  { key: "gamification", label: "Achievements", icon: Trophy },
  { key: "coach", label: "AI Coach", icon: Bot },
];

export default function PerformanceLab() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Admins/coaches are staff — they pick a trainee from the roster, not themselves
        const isStaff =
          currentUser?.role === "admin" ||
          currentUser?.roles?.includes("coach") ||
          currentUser?.roles?.includes("admin");
        if (!isStaff) {
          setSelectedTraineeId(currentUser.id);
        }
      } catch (err) {
        console.error("Error loading user:", err);
      }
    };
    loadUser();
  }, []);

  const hasRole = (role) =>
    user?.roles?.includes(role) || (role === "admin" && user?.role === "admin");
  const isCoachOrAdmin = hasRole("coach") || hasRole("admin");

  const { data: traineeProfiles = [] } = useQuery({
    queryKey: ["perf-trainees", user?.id],
    queryFn: () => base44.entities.UserProfile.filter({ role: "trainee" }),
    enabled: !!user && isCoachOrAdmin,
  });
  const traineeList = toArray(traineeProfiles);

  const selectedTrainee = traineeList.find((t) => t.auth_user_id === selectedTraineeId);
  const traineeName = isCoachOrAdmin
    ? selectedTrainee?.wrestling_name || selectedTrainee?.full_name || "Trainee"
    : user?.full_name;
  const traineeId = isCoachOrAdmin ? selectedTraineeId : user?.id;

  // Auto-select the first trainee for coaches/admins on initial load
  useEffect(() => {
    if (isCoachOrAdmin && !selectedTraineeId && traineeList.length > 0) {
      setSelectedTraineeId(traineeList[0].auth_user_id);
    }
  }, [isCoachOrAdmin, selectedTraineeId, traineeList]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }} />
      </div>
    );
  }

  const isPerflabTab = PERFLAB_TABS.includes(activeTab);

  const renderSection = () => {
    if (isPerflabTab && !traineeId) return null;
    switch (activeTab) {
      case "profile":
        return <FitnessProfileSection traineeId={traineeId} traineeName={traineeName} isCoach={isCoachOrAdmin} />;
      case "baseline":
        return <BaselineTestSection traineeId={traineeId} traineeName={traineeName} isCoach={isCoachOrAdmin} />;
      case "plan":
        return <WeeklyPlanSection traineeId={traineeId} traineeName={traineeName} />;
      case "readiness":
        return <ReadinessCheckInSection traineeId={traineeId} traineeName={traineeName} canSyncHealthConnect={!isCoachOrAdmin} />;
      case "metrics":
        return <WrestlingMetricsSection traineeId={traineeId} traineeName={traineeName} />;
      case "score":
        return <PromotionScoreSection traineeId={traineeId} />;
      case "coach":
        return <AICoachSection traineeId={traineeId} />;
      case "sc":
        return <StrengthConditioning />;
      case "weekly":
        return <WeeklyProgramming />;
      case "conditioning":
        return <WrestlingConditioning />;
      case "recovery":
        return <RecoveryCenter />;
      case "nutrition":
        return <NutritionCenter />;
      case "analytics":
        return <PerformanceAnalytics />;
      case "gamification":
        return <GamificationCenter />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <FlaskConical className="w-7 h-7" style={{ color: "#8b3dff" }} />
            PCW Performance Lab
          </h1>
          <p className="text-gray-400 text-sm">
            {isCoachOrAdmin
              ? "Complete athlete development platform — track, measure, and elevate performance."
              : "Your personalized training system — from baseline to showcase ready."}
          </p>
        </div>

        {/* Trainee selector (coaches only, perflab sections) */}
        {isCoachOrAdmin && isPerflabTab && (
          <div className="mb-4">
            <select
              value={selectedTraineeId || ""}
              onChange={(e) => setSelectedTraineeId(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-800 bg-[#0a0a0a] text-white px-3 py-2 text-sm"
            >
              <option value="">Select a trainee...</option>
              {traineeList.map((t) => (
                <option key={t.id} value={t.auth_user_id}>
                  {t.wrestling_name || t.full_name} {t.tier ? `(${t.tier})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Progress Levels (perflab sections only) */}
        {isPerflabTab && traineeId && (
          <div className="mb-4">
            <ProgressLevelsSection traineeId={traineeId} />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition`}
                style={{
                  background: active ? "rgba(139,61,255,0.15)" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                  border: active ? "1px solid rgba(139,61,255,0.3)" : "1px solid transparent",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Section */}
        <div className="embedded-section fade-in" key={activeTab + (traineeId || "self")}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}