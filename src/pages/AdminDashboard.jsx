import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Users, CheckCircle, ClipboardList, Video, DollarSign,
  AlertTriangle, UserPlus, Calendar, TrendingUp, Award,
  Activity, BarChart3, Download, Edit, Search, Filter,
} from "lucide-react";
import { createPageUrl } from "@/utils";

import KpiCard from "@/components/admin/KpiCard";
import QuickLinks from "@/components/admin/QuickLinks";
import CoachApprovalWidget from "@/components/admin/CoachApprovalWidget";
import UpcomingEventsWidget from "@/components/admin/UpcomingEventsWidget";
import ActivityFeed from "@/components/admin/ActivityFeed";
import RiskAlertsBanner from "@/components/admin/RiskAlertsBanner";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (!u?.roles?.includes("admin") && u?.role !== "admin") {
        navigate(createPageUrl("Dashboard"));
      }
    }).catch(console.error);
  }, [navigate]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const [profilesRes, authRes] = await Promise.all([
        base44.entities.UserProfile.list("full_name", 500),
        base44.entities.User.list("full_name", 500),
      ]);
      const profiles = toArray(profilesRes);
      const authUsers = toArray(authRes);
      const profileByAuthId = {};
      profiles.forEach(p => { if (p.auth_user_id) profileByAuthId[p.auth_user_id] = p; });
      return authUsers.map(au => {
        const p = profileByAuthId[au.id];
        return p
          ? { ...p, _profile_id: p.id, id: au.id, full_name: p.full_name || au.full_name, email: p.email || au.email, roles: p.roles || (p.role ? [p.role] : ["trainee"]) }
          : { id: au.id, full_name: au.full_name || au.email, email: au.email, role: au.role || "trainee", roles: au.roles || [au.role || "trainee"], _profile_id: null };
      });
    },
    initialData: [],
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['allCheckIns'],
    queryFn: async () => toArray(await base44.entities.CheckIn.list("-check_in_time", 200)),
    initialData: [],
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['allAssignments'],
    queryFn: async () => toArray(await base44.entities.Assignment.list("-due_date", 200)),
    initialData: [],
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ['allVideos'],
    queryFn: async () => toArray(await base44.entities.Video.list("-created_date", 100)),
    initialData: [],
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['allPayments'],
    queryFn: async () => toArray(await base44.entities.Payment.list("-payment_date", 100)),
    initialData: [],
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['allEvents'],
    queryFn: async () => toArray(await base44.entities.Event.list("event_date", 50)),
    initialData: [],
  });

  const { data: allTrainingLogs = [] } = useQuery({
    queryKey: ['allTrainingLogs'],
    queryFn: async () => toArray(await base44.entities.TrainingLog.list("-date", 100)),
    initialData: [],
  });

  // ─── Derived Metrics ───────────────────────────────────────────────
  const trainees = useMemo(() =>
    allUsers.filter(u => !u.roles?.includes('coach') && !u.roles?.includes('admin') && u.role !== 'admin' && u.role !== 'coach'),
    [allUsers]
  );
  const coaches = useMemo(() =>
    allUsers.filter(u => u.roles?.includes('coach') || u.role === 'coach'),
    [allUsers]
  );
  const coachRequests = useMemo(() =>
    allUsers.filter(u => u.coach_request === true && u.role !== "coach"),
    [allUsers]
  );

  const today = new Date().toISOString().split('T')[0];
  const todayCheckIns = allCheckIns.filter(c => c.check_in_date === today);
  const verifiedToday = todayCheckIns.filter(c => c.verification_status === 'verified');

  const thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0,0,0,0);
  const thisMonthPayments = allPayments.filter(p => new Date(p.payment_date) >= thisMonthStart);
  const totalRevenue = thisMonthPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstandingPayments = allPayments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

  const pendingAssignments = allAssignments.filter(a => a.status === 'submitted').length;
  const overdueAssignments = allAssignments.filter(a => a.status === 'assigned' && a.due_date && new Date(a.due_date) < new Date()).length;
  const videosNeedingReview = allVideos.filter(v => !v.coach_feedback).length;
  const oldVideos = allVideos.filter(v => !v.coach_feedback && ((Date.now() - new Date(v.created_date).getTime()) / 86400000) > 3).length;

  const inactiveTrainees = trainees.filter(t => {
    const last = allCheckIns.filter(c => c.trainee_id === t.id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
    return !last || (Date.now() - new Date(last.check_in_date).getTime()) / 86400000 > 10;
  });
  const overdueTrainees = trainees.filter(t =>
    allAssignments.filter(a => a.trainee_id === t.id && a.status === 'assigned' && a.due_date && new Date(a.due_date) < new Date()).length >= 3
  );

  const tierBreakdown = {
    T1: trainees.filter(t => t.tier === 'T1').length,
    T2: trainees.filter(t => t.tier === 'T2').length,
    T3: trainees.filter(t => t.tier === 'T3').length,
  };

  const getTierColor = (tier) => tier === 'T1' ? '#8b3dff' : tier === 'T2' ? '#dc2626' : '#c0c0c0';

  const upcomingEventsCount = allEvents.filter(e => e.status === 'upcoming').length;

  const downloadCSV = (filename, headers, rows) => {
    const csv = [headers.join(","), ...rows.map(r => r.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReport = (type) => {
    if (type === "Monthly Attendance") {
      const headers = ["Trainee", "Tier", "Check-ins (30d)", "Last Check-in"];
      const rows = trainees.map(t => {
        const tCheckIns = allCheckIns.filter(c => c.trainee_id === t.id);
        const last = tCheckIns.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        return [t.wrestling_name || t.full_name, t.tier || "T1", tCheckIns.length, last?.check_in_date || "Never"];
      });
      downloadCSV("monthly_attendance.csv", headers, rows);
    } else if (type === "Coach Performance") {
      const headers = ["Coach", "Email", "Trainees", "Pending Reviews"];
      const rows = coaches.map(c => {
        const cTrainees = trainees.length;
        const pending = allAssignments.filter(a => a.status === "submitted").length;
        return [c.wrestling_name || c.full_name, c.email, cTrainees, pending];
      });
      downloadCSV("coach_performance.csv", headers, rows);
    } else if (type === "Financial Summary") {
      const headers = ["Trainee", "Status", "Amount", "Date", "Method"];
      const rows = allPayments.map(p => {
        const t = allUsers.find(u => u.id === p.trainee_id);
        return [t?.wrestling_name || t?.full_name || "Unknown", p.status, `$${p.amount}`, p.payment_date, p.payment_method];
      });
      downloadCSV("financial_summary.csv", headers, rows);
    }
  };

  // Last 7 days check-ins for sparkline
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const checkInsByDay = last7.map(d => allCheckIns.filter(c => c.check_in_date === d).length);
  const prevWeekTotal = allCheckIns.filter(c => {
    const d = new Date(c.check_in_date);
    const daysAgo = (Date.now() - d.getTime()) / 86400000;
    return daysAgo >= 7 && daysAgo < 14;
  }).length;
  const thisWeekTotal = checkInsByDay.reduce((s, n) => s + n, 0);
  const attendanceTrend = thisWeekTotal > prevWeekTotal ? "up" : thisWeekTotal < prevWeekTotal ? "down" : "flat";

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5" style={{ color: '#8b3dff' }} />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Admin Command Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Platform Overview
            </h1>
            <p className="text-gray-500 mt-1">Full operational oversight & management</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live data
          </div>
        </div>

        {/* Risk Banner */}
        <RiskAlertsBanner inactiveTrainees={inactiveTrainees} overdueTrainees={overdueTrainees} />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users} label="Active Trainees" value={trainees.length} color="#8b3dff"
            sub={[
              { key: "T1", val: tierBreakdown.T1, color: "#8b3dff" },
              { key: "T2", val: tierBreakdown.T2, color: "#dc2626" },
              { key: "T3", val: tierBreakdown.T3, color: "#c0c0c0" },
            ]}
            onClick={() => setActiveTab("trainees")}
          />
          <KpiCard
            icon={CheckCircle} label="Attendance Today" value={todayCheckIns.length} color="#10b981"
            trend={attendanceTrend}
            trendLabel={`${thisWeekTotal} this week`}
            sub={[
              { key: "Verified", val: verifiedToday.length, color: "#10b981" },
              { key: "Pending", val: todayCheckIns.length - verifiedToday.length, color: "#f59e0b" },
            ]}
          />
          <KpiCard
            icon={ClipboardList} label="Assignments" value={pendingAssignments} color="#f59e0b"
            sub={[
              { key: "Pending Review", val: pendingAssignments, color: "#f59e0b" },
              { key: "Overdue", val: overdueAssignments, color: "#dc2626" },
            ]}
            urgent={overdueAssignments > 0}
          />
          <KpiCard
            icon={Shield} label="Coaches" value={coaches.length} color="#8b3dff"
            sub={[
              { key: "Trainees/Coach", val: coaches.length ? (trainees.length / coaches.length).toFixed(1) : "—" },
              { key: "Pending Approval", val: coachRequests.length, color: coachRequests.length > 0 ? "#dc2626" : "#6b7280" },
            ]}
          />
          <KpiCard
            icon={Video} label="Videos to Review" value={videosNeedingReview} color="#c0c0c0"
            sub={[
              { key: "Oldest (3+ days)", val: oldVideos, color: oldVideos > 0 ? "#dc2626" : "#6b7280" },
            ]}
            onClick={() => navigate(createPageUrl("VideoAnalysis"))}
          />
          <KpiCard
            icon={DollarSign} label="Revenue This Month" value={`$${totalRevenue.toLocaleString()}`} color="#10b981"
            sub={[
              { key: "Collected", val: thisMonthPayments.length, color: "#10b981" },
              { key: "Outstanding", val: outstandingPayments, color: outstandingPayments > 0 ? "#dc2626" : "#6b7280" },
            ]}
            onClick={() => navigate(createPageUrl("Payments"))}
          />
          <KpiCard
            icon={AlertTriangle} label="Risk Flags" value={inactiveTrainees.length + overdueTrainees.length}
            color="#dc2626" urgent={inactiveTrainees.length + overdueTrainees.length > 0}
            sub={[
              { key: "Inactive 10+ days", val: inactiveTrainees.length, color: "#dc2626" },
              { key: "3+ Overdue", val: overdueTrainees.length, color: "#f59e0b" },
            ]}
          />
          <KpiCard
            icon={Calendar} label="Upcoming Events" value={upcomingEventsCount} color="#f59e0b"
            sub={[
              { key: "Shows", val: allEvents.filter(e => e.event_type === "show" && e.status === "upcoming").length, color: "#dc2626" },
              { key: "Training", val: allEvents.filter(e => e.event_type === "training" && e.status === "upcoming").length, color: "#8b3dff" },
            ]}
            onClick={() => navigate(createPageUrl("Events"))}
          />
        </div>

        {/* Main Grid: Widgets + Quick Links */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Activity + Risk */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <CoachApprovalWidget users={allUsers} />
              <UpcomingEventsWidget events={allEvents} />
            </div>
            <ActivityFeed checkIns={allCheckIns} videos={allVideos} assignments={allAssignments} />
          </div>

          {/* Right: Quick Links */}
          <div>
            <QuickLinks />
          </div>
        </div>

        {/* Detailed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trainees">
              Trainees
              {inactiveTrainees.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#dc2626", color: "#fff" }}>
                  {inactiveTrainees.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="coaches">Coaches</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {['fundamentals', 'intermediate', 'advanced'].map(type => (
                <div key={type} className="p-4 rounded-xl" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs text-gray-500 uppercase tracking-wider capitalize mb-2">{type} today</p>
                  <p className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                    {todayCheckIns.filter(c => c.session_type === type).length}
                  </p>
                </div>
              ))}
            </div>

            {/* 7-day attendance bar */}
            <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-semibold">Attendance — Last 7 Days</p>
              <div className="flex items-end gap-2 h-20">
                {last7.map((day, i) => {
                  const count = checkInsByDay[i];
                  const max = Math.max(...checkInsByDay, 1);
                  const isToday = day === today;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm transition-all"
                        style={{ height: `${(count / max) * 64 + 4}px`, background: isToday ? "#8b3dff" : "rgba(139,61,255,0.3)", minHeight: 4 }} />
                      <span className="text-[9px] text-gray-600">
                        {new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Trainees Tab */}
          <TabsContent value="trainees" className="space-y-6">
            <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-white">All Trainees ({trainees.length})</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white w-48 pl-8" />
                    </div>
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="T1">T1</SelectItem>
                        <SelectItem value="T2">T2</SelectItem>
                        <SelectItem value="T3">T3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trainees
                    .filter(t => {
                      const name = (t.wrestling_name || t.full_name || "").toLowerCase();
                      return (searchQuery === "" || name.includes(searchQuery.toLowerCase()))
                        && (tierFilter === "all" || t.tier === tierFilter);
                    })
                    .slice(0, 25)
                    .map(trainee => {
                      const lastCI = allCheckIns.filter(c => c.trainee_id === trainee.id)
                        .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
                      const daysSince = lastCI ? Math.floor((Date.now() - new Date(lastCI.check_in_date).getTime()) / 86400000) : 999;
                      const overdueCount = allAssignments.filter(a => a.trainee_id === trainee.id && a.status === 'assigned' && a.due_date && new Date(a.due_date) < new Date()).length;
                      const isInactive = daysSince > 7;

                      return (
                        <div key={trainee.id} className="flex items-center justify-between p-3 rounded-lg"
                          style={{ background: '#0a0a0a', border: `1px solid ${isInactive ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${getTierColor(trainee.tier)}, #dc2626)` }}>
                              {(trainee.wrestling_name || trainee.full_name || "?")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white text-sm">{trainee.wrestling_name || trainee.full_name}</p>
                                {isInactive && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${getTierColor(trainee.tier)}20`, color: getTierColor(trainee.tier) }}>
                                  {trainee.tier || 'T1'}
                                </span>
                                {daysSince < 999 && (
                                  <span className={`text-xs ${daysSince > 7 ? 'text-red-400' : 'text-gray-500'}`}>
                                    {daysSince}d ago
                                  </span>
                                )}
                                {overdueCount > 0 && <span className="text-xs text-yellow-400">{overdueCount} overdue</span>}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline"
                            onClick={() => navigate(createPageUrl("UserDetail") + `?id=${trainee.id}`)}
                            style={{ borderColor: '#444', color: '#888' }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coaches Tab */}
          <TabsContent value="coaches" className="space-y-6">
            <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
              <CardHeader>
                <CardTitle className="text-white">Coaching Staff ({coaches.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coaches.map(coach => (
                    <div key={coach.id} className="flex items-center justify-between p-4 rounded-lg"
                      style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                          style={{ background: 'linear-gradient(135deg, #8b3dff, #dc2626)' }}>
                          {(coach.wrestling_name || coach.full_name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{coach.wrestling_name || coach.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#8b3dff20", color: "#8b3dff" }}>
                              {coach.roles?.includes('admin') ? 'Admin' : 'Coach'}
                            </span>
                            <span className="text-xs text-gray-500">{coach.email}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline"
                        onClick={() => navigate(createPageUrl("UserDetail") + `?id=${coach.id}`)}
                        style={{ borderColor: '#444', color: '#888' }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
                <CardHeader>
                  <CardTitle className="text-white text-sm">Tier Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(tierBreakdown).map(([tier, count]) => (
                      <div key={tier}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{tier}</span>
                          <span className="text-white font-semibold">{count} ({trainees.length ? Math.round((count / trainees.length) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all"
                            style={{ width: `${trainees.length ? (count / trainees.length) * 100 : 0}%`, background: getTierColor(tier) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
                <CardHeader>
                  <CardTitle className="text-white text-sm">Platform Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {[
                    { label: "Total Check-ins", val: allCheckIns.length },
                    { label: "Assignments Created", val: allAssignments.length },
                    { label: "Videos Analyzed", val: allVideos.filter(v => v.analyzed).length },
                    { label: "Training Logs", val: allTrainingLogs.length },
                    { label: "Total Revenue", val: `$${allPayments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}` },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-gray-400 text-sm">{label}</span>
                      <span className="text-white font-bold">{val}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: '#8b3dff' }} />
                  Generate Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: "Monthly Attendance", color: "#8b3dff" },
                    { label: "Coach Performance", color: "#dc2626" },
                    { label: "Financial Summary", color: "#10b981" },
                  ].map(({ label, color }) => (
                    <Button key={label} variant="outline" className="h-auto py-5 flex flex-col gap-2"
                      style={{ borderColor: color, color }}
                      onClick={() => generateReport(label)}>
                      <Download className="w-5 h-5" />
                      <span>{label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}