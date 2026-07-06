import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useRole } from "@/hooks/useRole";
import {
  Trophy, Video, ClipboardList, TrendingUp, Calendar, Zap,
  Flame, Target, ArrowRight, Activity, Settings2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PerformanceChart from "@/components/analytics/PerformanceChart";
import { CardSkeleton } from "@/components/ui/skeleton";
import WeeklyCalendar from "@/components/calendar/WeeklyCalendar";
import CoachPanel from "@/components/coach/CoachPanel";
import WidgetGrid from "@/components/dashboard/WidgetGrid";
import WidgetCustomizer from "@/components/dashboard/WidgetCustomizer";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

// ─── Storage helpers ────────────────────────────────────────────────────────
const STORAGE_KEY = (userId, role) => `pcw_widgets_${role}_${userId}`;

const DEFAULT_WIDGETS = {
  admin:   ["stats", "coachPanel", "weeklyCalendar", "quickActions", "events", "performanceChart", "recentSessions"],
  coach:   ["stats", "coachPanel", "weeklyCalendar", "quickActions", "events", "performanceChart", "recentSessions"],
  trainee: ["stats", "weeklyCalendar", "quickActions", "events", "performanceChart", "recentSessions"],
};

// ─── Sub-widgets (render functions injected via context) ─────────────────────

function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div className="stat-card pcw-card-hover rounded-xl p-5 relative overflow-hidden"
      style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: color, opacity: 0.06, transform: "translate(40%, -40%)", filter: "blur(20px)" }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{value}</p>
          {subtext && <p className="text-xs text-gray-300 mt-1">{subtext}</p>}
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isAdmin, isCoach, isTrainee } = useRole(user);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(console.error);
  }, []);

  const roleKey = isAdmin ? "admin" : isCoach ? "coach" : "trainee";
  const storageKey = user ? STORAGE_KEY(user.id, roleKey) : null;

  const [activeWidgets, setActiveWidgets] = useState(null);

  // Load persisted widget config
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      setActiveWidgets(saved ? JSON.parse(saved) : DEFAULT_WIDGETS[roleKey]);
    } catch {
      setActiveWidgets(DEFAULT_WIDGETS[roleKey]);
    }
  }, [storageKey, roleKey]);

  const saveWidgets = (widgets) => {
    setActiveWidgets(widgets);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(widgets));
  };

  const toggleWidget = (id) => {
    const next = activeWidgets.includes(id)
      ? activeWidgets.filter(w => w !== id)
      : [...activeWidgets, id];
    saveWidgets(next);
  };

  // ── Pull to refresh ──
  const handleRefresh = useCallback(() => queryClient.invalidateQueries(), [queryClient]);
  const { containerRef, isRefreshing, pullDistance, handlers } = usePullToRefresh(handleRefresh);

  // ── Deferred data load ──
  const [deferredLoaded, setDeferredLoaded] = useState(false);
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => setDeferredLoaded(true), 800);
    return () => clearTimeout(t);
  }, [user]);

  // ── Data queries ──
  const { data: trainingLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["trainingLogs", user?.id],
    queryFn: async () => toArray(await base44.entities.TrainingLog.filter({ trainee_id: user.id }, "-date", 30)),
    enabled: !!user && deferredLoaded,
    initialData: [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", user?.id],
    queryFn: async () => toArray(await base44.entities.Assignment.filter({ trainee_id: user.id }, "-created_date", 5)),
    enabled: !!user && !isAdmin,
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos", user?.id],
    queryFn: async () => toArray(await base44.entities.Video.filter({ trainee_id: user.id }, "-created_date", 5)),
    enabled: !!user && deferredLoaded,
    initialData: [],
  });

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["upcomingEvents"],
    queryFn: async () => {
      const all = toArray(await base44.entities.Event.filter({ status: "upcoming" }, "event_date"));
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const getNext = (ev) => {
        const [y, m, d] = ev.event_date.split('-').map(Number);
        let date = new Date(y, m - 1, d);
        if (ev.is_recurring && ev.recurrence_pattern) {
          while (date < today) {
            if (ev.recurrence_pattern === 'daily')    date.setDate(date.getDate() + 1);
            else if (ev.recurrence_pattern === 'weekly')   date.setDate(date.getDate() + 7);
            else if (ev.recurrence_pattern === 'biweekly') date.setDate(date.getDate() + 14);
            else if (ev.recurrence_pattern === 'monthly')  date.setMonth(date.getMonth() + 1);
            else break;
          }
        }
        return date;
      };
      return all.map(ev => ({ ...ev, _nextDate: getNext(ev) }))
        .filter(ev => ev._nextDate >= today)
        .sort((a, b) => a._nextDate - b._nextDate)
        .slice(0, 3);
    },
    initialData: [],
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["myCheckIns", user?.id],
    queryFn: async () => toArray(await base44.entities.CheckIn.filter({ trainee_id: user.id }, "-check_in_date", 30)),
    enabled: !!user && deferredLoaded,
    initialData: [],
  });

  const { data: myProfile } = useQuery({
    queryKey: ["myProfileDash", user?.id],
    queryFn: async () => {
      const arr = toArray(await base44.entities.UserProfile.filter({ auth_user_id: user.id }));
      return arr[0] || null;
    },
    enabled: !!user,
    initialData: null,
  });

  // ── Derived metrics ──
  const pendingAssignments = assignments.filter(a => a.status === "assigned").length;
  const totalTrainingHours = trainingLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0) / 60;
  const avgScore = trainingLogs.length > 0
    ? trainingLogs.reduce((s, l) => s + (l.self_grade || 0), 0) / trainingLogs.length : 0;

  const performanceData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split("T")[0];
      const dayLogs = trainingLogs.filter(l => l.date === key);
      return {
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        score: dayLogs.length > 0 ? parseFloat((dayLogs.reduce((s, l) => s + (l.self_grade || 0), 0) / dayLogs.length).toFixed(1)) : 0,
      };
    });
  }, [trainingLogs]);

  const displayName = user?.wrestling_name || user?.full_name || "Wrestler";

  // ── Widget definitions per role ──────────────────────────────────────────
  const ALL_WIDGETS = useMemo(() => {
    const base = [
      {
        id: "stats",
        label: "Stats Overview",
        description: "Training hours, performance score, videos & tasks",
        icon: Trophy,
        render: () => (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Trophy}       label="Training Hours"  value={totalTrainingHours.toFixed(1)} color="#8b3dff" subtext="Last 30 days" />
            <StatCard icon={Target}       label="Avg Performance" value={`${avgScore.toFixed(1)}/10`}   color="#dc2626" />
            <StatCard icon={Video}        label="Videos Uploaded" value={videos.length}                  color="#c0c0c0" />
            <StatCard icon={ClipboardList} label="Pending Tasks"  value={pendingAssignments}             color="#8b3dff"
              subtext={pendingAssignments > 0 ? "Need attention" : "All caught up!"} />
          </div>
        ),
      },
      {
        id: "weeklyCalendar",
        label: "Weekly Attendance",
        description: "Your attendance streak and weekly calendar",
        icon: Calendar,
        render: () => <WeeklyCalendar checkIns={checkIns} streak={user?.streak_count || 0} />,
      },
      {
        id: "quickActions",
        label: "Quick Actions",
        description: "Shortcuts to common actions",
        icon: Zap,
        render: () => (
          <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4" style={{ color: "#8b3dff" }} />
              <h2 className="font-semibold text-white text-base" style={{ fontFamily: "Rajdhani, sans-serif" }}>Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: "Notebook",        label: "Notebook",      color: "#8b3dff", icon: Zap },
                { to: "SkillTracking",   label: "Log Training",  color: "#dc2626", icon: Trophy },
                { to: "VideoAnalysis",   label: "Upload Video",  color: "#c0c0c0", icon: Video },
                { to: "ShowcaseFeedback",label: "Showcase",      color: "#8b3dff", icon: TrendingUp },
              ].map(({ to, label, color, icon: Icon }) => (
                <Link key={to} to={createPageUrl(to)}>
                  <button className="w-full flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium transition-all group"
                    style={{ background: `${color}10`, border: `1px solid ${color}25`, color }}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "events",
        label: "Upcoming Events",
        description: "Next 3 upcoming PCW events",
        icon: Calendar,
        render: () => (
          <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-white text-base" style={{ fontFamily: "Rajdhani, sans-serif" }}>Upcoming Events</h2>
              </div>
              <Link to={createPageUrl("Events")}>
                <span className="text-xs text-purple-400 hover:text-purple-300 transition-colors">View all →</span>
              </Link>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-1 h-10 rounded-full" style={{ background: "linear-gradient(180deg, #8b3dff, #dc2626)" }} />
                    <div>
                      <p className="text-sm font-medium text-white">{ev.event_name}</p>
                      <p className="text-xs text-gray-500">
                        {(ev._nextDate || new Date(ev.event_date)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                <Calendar className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "performanceChart",
        label: "Performance Chart",
        description: "7-day performance trend line chart",
        icon: TrendingUp,
        render: () => logsLoading ? <CardSkeleton /> : (
          <PerformanceChart data={performanceData} type="line"
            title="Performance Trend — Last 7 Days" dataKey="score" color="#8b3dff" />
        ),
      },
      {
        id: "recentSessions",
        label: "Recent Sessions",
        description: "Your last 5 training sessions",
        icon: Activity,
        render: () => (
          <div className="rounded-xl" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Activity className="w-4 h-4" style={{ color: "#8b3dff" }} />
              <h2 className="font-semibold text-white text-base" style={{ fontFamily: "Rajdhani, sans-serif" }}>Recent Training Sessions</h2>
            </div>
            <div className="p-5">
              {trainingLogs.length > 0 ? (
                <div className="space-y-2">
                  {trainingLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg pcw-card-hover"
                      style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {log.drill_type?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500">{log.duration_minutes} min • {new Date(log.date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-lg font-bold" style={{ fontFamily: "Rajdhani, sans-serif",
                        color: log.self_grade >= 7 ? "#8b3dff" : log.self_grade >= 5 ? "#f59e0b" : "#dc2626" }}>
                        {log.self_grade}<span className="text-xs text-gray-600">/10</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                  <Activity className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No training logs yet.</p>
                </div>
              )}
            </div>
          </div>
        ),
      },
    ];

    // Coach/admin only widget
    if (isCoach) {
      base.splice(1, 0, {
        id: "coachPanel",
        label: "Coach Overview Panel",
        description: "Trainee summary, pending reviews, check-ins",
        icon: Trophy,
        render: () => <CoachPanel user={user} />,
      });
    }

    return base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isCoach, trainingLogs, assignments, videos, checkIns, upcomingEvents, logsLoading, performanceData, pendingAssignments, totalTrainingHours, avgScore]);

  // Build component map for WidgetGrid
  const widgetComponents = useMemo(() => {
    const map = {};
    ALL_WIDGETS.forEach(w => { map[w.id] = w.render; });
    return map;
  }, [ALL_WIDGETS]);

  if (!user || !activeWidgets) return null;

  return (
    <div ref={containerRef} {...handlers} className="min-h-full p-5 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
      {/* Pull-to-refresh indicator */}
      <div className="ptr-indicator" style={{ height: pullDistance > 0 ? pullDistance / 2 : 0 }}>
        {isRefreshing
          ? <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          : pullDistance > 40 && <div className="text-xs text-gray-500">Release to refresh</div>}
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-red-500" />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Performance Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Welcome back, <span className="gradient-text">{displayName}</span>
            </h1>
            <p className="text-gray-500 mt-1">Ready to dominate the ring today?</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.streak_count > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}>
                <Flame className="w-5 h-5 text-red-400" />
                <span className="text-white font-bold">{user.streak_count}</span>
                <span className="text-gray-400 text-sm">day streak</span>
              </div>
            )}
            <button
              onClick={() => setCustomizerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all hover:border-purple-500/50"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#9ca3af" }}
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Customize</span>
            </button>
          </div>
        </div>

        {/* Coach request pending banner */}
        {myProfile?.coach_request && (
          <div className="rounded-xl border border-yellow-700/40 bg-yellow-900/10 p-4 flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="text-yellow-300 font-semibold text-sm">Coach Verification Pending</p>
              <p className="text-yellow-200/60 text-xs mt-0.5">
                Your coach request has been received and is awaiting admin approval.
              </p>
            </div>
          </div>
        )}

        {/* Widget grid */}
        <WidgetGrid
          widgets={activeWidgets.filter(id => widgetComponents[id])}
          widgetComponents={widgetComponents}
          onReorder={saveWidgets}
        />
      </div>

      {/* Customizer modal */}
      {customizerOpen && (
        <WidgetCustomizer
          allWidgets={ALL_WIDGETS}
          activeWidgets={activeWidgets}
          onToggle={toggleWidget}
          onClose={() => setCustomizerOpen(false)}
        />
      )}
    </div>
  );
}