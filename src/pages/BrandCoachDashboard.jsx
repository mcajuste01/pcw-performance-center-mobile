import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Megaphone, ClipboardList, CheckCircle, Calendar, TrendingUp, BookOpen, Users } from "lucide-react";
import BrandAssignmentBuilderModal from "@/components/brand/BrandAssignmentBuilderModal";
import BrandApprovalQueue from "@/components/brand/BrandApprovalQueue";
import BrandNotebookEditor from "@/components/brand/BrandNotebookEditor";
import BrandMetricsView from "@/components/brand/BrandMetricsView";
import { toArray, formatDate } from "@/components/brand/brandConstants";

export default function BrandCoachDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [notebookAthlete, setNotebookAthlete] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== "brand_coach" && currentUser.role !== "admin") {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (err) {
        console.error("Error loading user:", err);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: trainees = [] } = useQuery({
    queryKey: ["brand-coach-trainees"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" });
      return toArray(res);
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["brand-all-assignments"],
    queryFn: async () => {
      const res = await base44.entities.BrandAssignment.list("-due_date", 100);
      return toArray(res);
    },
  });

  const { data: pendingSubmissions = [] } = useQuery({
    queryKey: ["brand-pending-submissions"],
    queryFn: async () => {
      const res = await base44.entities.BrandSubmission.filter({ posting_approval_status: "pending" }, "-submitted_at", 50);
      return toArray(res);
    },
  });

  useEffect(() => {
    if (!notebookAthlete && trainees.length > 0) {
      setNotebookAthlete(trainees[0].auth_user_id);
    }
  }, [trainees, notebookAthlete]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 86400000);
    return assignments.filter(a => {
      if (!a.due_date || a.status === "approved") return false;
      const due = new Date(a.due_date + "T00:00:00");
      return due >= now && due <= weekAhead;
    });
  }, [assignments]);

  const openAssignments = assignments.filter(a => a.status !== "approved");
  const traineesWithOpen = new Set(openAssignments.map(a => a.assigned_to)).size;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }} />
      </div>
    );
  }

  const TABS = [
    { key: "overview", label: "Overview", icon: Megaphone },
    { key: "approvals", label: "Approval Queue", icon: ClipboardList },
    { key: "assign", label: "Assignments", icon: Calendar },
    { key: "notebook", label: "Notebooks", icon: BookOpen },
    { key: "metrics", label: "Metrics", icon: TrendingUp },
  ];

  const notebookTrainee = trainees.find(t => t.auth_user_id === notebookAthlete);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Megaphone className="w-7 h-7" style={{ color: "#8b3dff" }} />
                Brand Coach Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage brand assignments, approvals, and athlete personas.</p>
            </div>
            <BrandAssignmentBuilderModal user={user} onCreated={() => queryClient.invalidateQueries({ queryKey: ["brand-all-assignments"] })} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition"
                style={{
                  background: active ? "rgba(139,61,255,0.15)" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                  border: active ? "1px solid rgba(139,61,255,0.3)" : "1px solid transparent",
                }}>
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="grid sm:grid-cols-3 gap-4">
            <OverviewCard icon={Users} label="Trainees with Open Assignments" value={traineesWithOpen} color="#8b3dff" />
            <OverviewCard icon={ClipboardList} label="Submissions Pending Review" value={pendingSubmissions.length} color="#f59e0b" highlight={pendingSubmissions.length > 0} onClick={() => setActiveTab("approvals")} />
            <OverviewCard icon={Calendar} label="Deadlines This Week" value={upcomingDeadlines.length} color="#dc2626" highlight={upcomingDeadlines.length > 0} />
            {upcomingDeadlines.length > 0 && (
              <div className="sm:col-span-3 rounded-xl border border-gray-800 p-4" style={{ background: "#0f0f0f" }}>
                <p className="text-white text-sm font-semibold mb-3">Upcoming Deadlines</p>
                <div className="space-y-2">
                  {upcomingDeadlines.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{a.title}</span>
                      <span className="text-gray-500">{a.assigned_to_name} • {formatDate(a.due_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "approvals" && <BrandApprovalQueue user={user} />}

        {activeTab === "assign" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-semibold">All Brand Assignments ({assignments.length})</p>
              <BrandAssignmentBuilderModal user={user} onCreated={() => queryClient.invalidateQueries({ queryKey: ["brand-all-assignments"] })} />
            </div>
            {assignments.length === 0 ? (
              <div className="rounded-xl border border-gray-800 p-8 text-center" style={{ background: "#0f0f0f" }}>
                <Calendar className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No assignments created yet</p>
                <p className="text-gray-600 text-xs mt-1">Use "New Assignment" to create your first brand assignment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map(a => (
                  <div key={a.id} className="rounded-xl border border-gray-800 p-3 flex items-center justify-between" style={{ background: "#0f0f0f" }}>
                    <div>
                      <p className="text-white text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.assigned_to_name} • Due {formatDate(a.due_date)}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                      background: a.status === "approved" ? "rgba(16,185,129,0.15)" : a.status === "submitted" ? "rgba(6,182,212,0.15)" : a.status === "needs_revision" ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.15)",
                      color: a.status === "approved" ? "#10b981" : a.status === "submitted" ? "#06b6d4" : a.status === "needs_revision" ? "#f59e0b" : "#6b7280",
                    }}>{a.status.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "notebook" && (
          <div className="space-y-3">
            {trainees.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Trainee:</span>
                <select value={notebookAthlete} onChange={e => setNotebookAthlete(e.target.value)} className="rounded-lg border border-gray-800 bg-[#0a0a0a] text-white px-3 py-1.5 text-sm">
                  {trainees.map(t => <option key={t.id} value={t.auth_user_id}>{t.wrestling_name || t.full_name}</option>)}
                </select>
              </div>
            )}
            <BrandNotebookEditor
              athleteId={notebookAthlete}
              athleteName={notebookTrainee?.wrestling_name || notebookTrainee?.full_name || ""}
              userId={user.id}
              userFullName={user.full_name}
            />
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="space-y-3">
            {trainees.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Trainee:</span>
                <select value={notebookAthlete} onChange={e => setNotebookAthlete(e.target.value)} className="rounded-lg border border-gray-800 bg-[#0a0a0a] text-white px-3 py-1.5 text-sm">
                  {trainees.map(t => <option key={t.id} value={t.auth_user_id}>{t.wrestling_name || t.full_name}</option>)}
                </select>
              </div>
            )}
            <BrandMetricsView user={user} traineeId={notebookAthlete} traineeName={notebookTrainee?.wrestling_name || notebookTrainee?.full_name || ""} />
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ icon: Icon, label, value, color, highlight, onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick} className="text-left rounded-xl border p-4 transition" style={{
      background: "#0f0f0f",
      borderColor: highlight ? `${color}40` : "rgba(255,255,255,0.06)",
      cursor: onClick ? "pointer" : "default",
    }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{value}</p>
    </button>
  );
}