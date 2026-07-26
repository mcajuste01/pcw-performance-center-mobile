import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Users, Flame, Target, HeartPulse, Dumbbell, TrendingUp,
  Loader2, MessageSquare, Calendar, Zap, Award, Activity,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import AccountabilityPartnersCard from "@/components/accountability/AccountabilityPartnersCard";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

const LEVEL_LABELS = {
  foundation: "Foundation",
  ring_ready: "Ring Ready",
  match_conditioning: "Match Conditioning",
  performance_athlete: "Performance Athlete",
  showcase_ready: "Showcase Ready",
};

const LEVEL_COLORS = {
  foundation: "#8b3dff",
  ring_ready: "#dc2626",
  match_conditioning: "#f59e0b",
  performance_athlete: "#10b981",
  showcase_ready: "#c0c0c0",
};

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide leading-none">{label}</p>
        <p className="text-xs font-semibold text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

function PartnerActivityCard({ partner }) {
  const levelColor = LEVEL_COLORS[partner.current_level] || "#8b3dff";

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
          {partner.avatar_url ? (
            <img src={partner.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-white">
              {partner.athlete_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-white truncate">{partner.athlete_name}</p>
            {partner.streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-orange-400 flex-shrink-0">
                <Flame className="w-3.5 h-3.5" />
                {partner.streak} day streak
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${levelColor}20`, color: levelColor }}>
              {LEVEL_LABELS[partner.current_level] || partner.current_level}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(139,61,255,0.15)", color: "#8b3dff" }}>
              {partner.tier}
            </span>
          </div>
        </div>
        <Link
          to={`${createPageUrl("Chat")}?partner=${partner.athlete_id}`}
          className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-colors"
          style={{ background: "rgba(139,61,255,0.1)", color: "#8b3dff" }}
        >
          <MessageSquare className="w-4 h-4" />
        </Link>
      </div>

      {/* Shared Goals */}
      {partner.goals && (
        <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5" style={{ color: "#8b3dff" }} />
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Shared Goals</p>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{partner.goals}</p>
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-2 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <StatPill icon={Dumbbell} label="Sessions" value={`${partner.training_sessions_30d}/30d`} color="#8b3dff" />
        <StatPill
          icon={HeartPulse}
          label="Readiness"
          value={partner.latest_readiness_score != null ? `${partner.latest_readiness_score}` : "—"}
          color="#dc2626"
        />
        <StatPill icon={TrendingUp} label="Streak" value={`${partner.streak}d`} color="#f59e0b" />
      </div>

      {/* Baseline highlights */}
      {partner.latest_baseline && (
        <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Award className="w-3.5 h-3.5" style={{ color: "#c0c0c0" }} />
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Latest Baseline</p>
            <span className="text-[10px] text-gray-600 ml-auto">{partner.latest_baseline.test_date}</span>
          </div>
          <div className="flex gap-3 text-xs">
            {partner.latest_baseline.pushups != null && (
              <div><span className="text-gray-500">Pushups:</span> <span className="text-white font-medium">{partner.latest_baseline.pushups}</span></div>
            )}
            {partner.latest_baseline.squats != null && (
              <div><span className="text-gray-500">Squats:</span> <span className="text-white font-medium">{partner.latest_baseline.squats}</span></div>
            )}
            {partner.latest_baseline.plank_seconds != null && (
              <div><span className="text-gray-500">Plank:</span> <span className="text-white font-medium">{partner.latest_baseline.plank_seconds}s</span></div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {partner.recent_activity && partner.recent_activity.length > 0 ? (
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Recent Activity</p>
          </div>
          <div className="space-y-2">
            {partner.recent_activity.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#10b981" }} />
                <span className="text-gray-400 flex-1 truncate">{log.type}</span>
                {log.duration && <span className="text-gray-500">{log.duration}m</span>}
                <span className="text-gray-600 flex-shrink-0">{log.date?.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Recent Activity</p>
          </div>
          <p className="text-xs text-gray-600">No recent training logged</p>
        </div>
      )}
    </div>
  );
}

export default function AccountabilityDashboardSection({ user }) {
  const { data: partnerData, isLoading } = useQuery({
    queryKey: ["accountabilityPartners", user?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("getAccountabilityPartnerData", {});
      return res?.data ?? res;
    },
    enabled: !!user?.id,
    initialData: { partners: [], groups: [] },
  });

  const partners = partnerData?.partners || [];
  const groups = partnerData?.groups || [];

  // Combined stats
  const totalSessions = partners.reduce((sum, p) => sum + (p.training_sessions_30d || 0), 0);
  const avgReadiness = partners.length > 0
    ? Math.round(partners.reduce((sum, p) => sum + (p.latest_readiness_score || 0), 0) / partners.length)
    : 0;
  const bestStreak = partners.reduce((max, p) => Math.max(max, p.streak || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "#8b3dff" }} />
            Accountability Dashboard
          </h2>
          <p className="text-sm text-gray-400">Partner up to stay motivated and track shared progress.</p>
        </div>
        <AccountabilityPartnersCard user={user} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Users className="w-5 h-5 md:w-6 md:h-6" style={{ color: "#8b3dff" }} />
          Accountability Dashboard
        </h2>
        <p className="text-sm text-gray-400">
          {groups.length > 0 && (
            <span>{groups.length} active {groups.length === 1 ? "group" : "groups"} • </span>
          )}
          {partners.length} {partners.length === 1 ? "partner" : "partners"} keeping you on track
        </p>
      </div>

      {/* Group Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-4 h-4" style={{ color: "#8b3dff" }} />
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Combined Sessions</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
          <p className="text-[10px] text-gray-600">last 30 days</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-4 h-4" style={{ color: "#dc2626" }} />
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Avg Readiness</p>
          </div>
          <p className="text-2xl font-bold text-white">{avgReadiness || "—"}</p>
          <p className="text-[10px] text-gray-600">across partners</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Best Streak</p>
          </div>
          <p className="text-2xl font-bold text-white">{bestStreak}d</p>
          <p className="text-[10px] text-gray-600">current</p>
        </div>
      </div>

      {/* Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {partners.map((partner) => (
          <PartnerActivityCard key={partner.athlete_id} partner={partner} />
        ))}
      </div>

      {/* Manage partners */}
      <AccountabilityPartnersCard user={user} />
    </div>
  );
}