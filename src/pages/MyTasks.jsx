import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList, CheckCircle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Send, BookOpen, Dumbbell,
  Video, FileText, Star, Filter, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

const STATUS_CONFIG = {
  assigned:  { label: "To Do",      color: "#8b3dff", bg: "rgba(139,61,255,0.12)", icon: ClipboardList },
  submitted: { label: "Submitted",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: Clock },
  graded:    { label: "Graded",     color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle },
  overdue:   { label: "Overdue",    color: "#dc2626", bg: "rgba(220,38,38,0.12)",  icon: AlertTriangle },
};

const TYPE_ICONS = {
  drill:       Dumbbell,
  video:       Video,
  written:     FileText,
  reading:     BookOpen,
  evaluation:  Star,
};

function TaskCard({ task, currentUserId, onSubmit, onCompleteInApp }) {
  const [expanded, setExpanded]       = useState(false);
  const [submissionText, setSubmission] = useState("");

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status === "assigned";
  const status    = isOverdue ? "overdue" : task.status;
  const cfg       = STATUS_CONFIG[status] || STATUS_CONFIG.assigned;
  const TypeIcon  = TYPE_ICONS[task.assignment_type] || ClipboardList;

  const daysUntil = task.due_date
    ? Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="rounded-xl overflow-hidden pcw-card-hover"
      style={{ background: "#0f0f0f", border: `1px solid ${isOverdue ? "rgba(220,38,38,0.3)" : "rgba(255,255,255,0.07)"}` }}>

      {/* Top strip */}
      {isOverdue && <div className="h-0.5 w-full" style={{ background: "#dc2626" }} />}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: cfg.bg }}>
            <TypeIcon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white text-sm">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                    {cfg.label}
                  </span>
                  {task.assignment_type && (
                    <span className="text-[10px] text-gray-500 capitalize">{task.assignment_type}</span>
                  )}
                  {daysUntil !== null && task.status === "assigned" && (
                    <span className={`text-[10px] font-medium ${isOverdue ? "text-red-400" : daysUntil <= 2 ? "text-yellow-400" : "text-gray-500"}`}>
                      {isOverdue ? `${Math.abs(daysUntil)}d overdue` : `Due in ${daysUntil}d`}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setExpanded(e => !e)}
                className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-4 pt-4 space-y-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {task.description && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Instructions</p>
                <p className="text-sm text-gray-300 leading-relaxed">{task.description}</p>
              </div>
            )}

            {task.due_date && (
              <p className="text-xs text-gray-500">
                Due: <span className="text-gray-300">{new Date(task.due_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              </p>
            )}

            {/* Graded view */}
            {task.status === "graded" && (
              <div className="p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-green-400">Coach Feedback</p>
                  {task.grade && (
                    <span className="text-lg font-bold" style={{ fontFamily: "Rajdhani, sans-serif", color: "#10b981" }}>
                      {task.grade}/10
                    </span>
                  )}
                </div>
                {task.coach_feedback && <p className="text-sm text-gray-300">{task.coach_feedback}</p>}
              </div>
            )}

            {/* Submitted view */}
            {task.status === "submitted" && (
              <div className="p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p className="text-xs text-yellow-400 mb-2">Your Submission</p>
                {task.submission_text
                  ? <p className="text-sm text-gray-300">{task.submission_text}</p>
                  : <p className="text-sm text-gray-500 italic">Submitted — awaiting coach review.</p>
                }
                {task.submission_video_link && (
                  <a href={task.submission_video_link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-purple-400 underline mt-1 block">View Video →</a>
                )}
              </div>
            )}

            {/* Submit form */}
            {task.status === "assigned" && task.assignment_type === "in_app_task" && task.action_link?.page ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">In-App Task</p>
                <Button size="sm" onClick={() => onCompleteInApp(task)}
                  style={{ background: "linear-gradient(135deg, #3b82f6, #8b3dff)" }}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  {task.action_link.label || "Go to Task"}
                </Button>
              </div>
            ) : task.status === "assigned" && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Submit Your Work</p>
                <Textarea
                  value={submissionText}
                  onChange={e => setSubmission(e.target.value)}
                  placeholder="Describe what you did, any notes for your coach..."
                  className="bg-gray-900 border-gray-700 text-gray-200 text-sm resize-none"
                  rows={3}
                />
                <Button size="sm" onClick={() => onSubmit(task.id, submissionText)}
                  disabled={!submissionText.trim()}
                  style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Submit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyTasks() {
  const [user, setUser]     = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab]       = useState("todo");
  const queryClient         = useQueryClient();
  const navigate            = useNavigate();

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      // Load trainee profile to get tier
      const profiles = toArray(await base44.entities.UserProfile.filter({ auth_user_id: u.id }));
      setProfile(profiles[0] || null);
    }).catch(console.error);
  }, []);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["myTasks", user?.id, profile?.tier],
    queryFn: async () => {
      // Fetch assignments targeted at this trainee directly OR by their tier OR "All"
      const [byTrainee, byTier, byAll] = await Promise.all([
        base44.entities.Assignment.filter({ trainee_id: user.id }, "due_date"),
        profile?.tier ? base44.entities.Assignment.filter({ tier: profile.tier }, "due_date") : Promise.resolve([]),
        base44.entities.Assignment.filter({ tier: "All" }, "due_date"),
      ]);
      // Merge and deduplicate by id
      const all = [...toArray(byTrainee), ...toArray(byTier), ...toArray(byAll)];
      const seen = new Set();
      return all.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
    },
    enabled: !!user,
    initialData: [],
  });

  const completeInAppMutation = useMutation({
    mutationFn: (taskId) =>
      base44.entities.Assignment.update(taskId, {
        status: "submitted",
        submission_text: "Completed via in-app action",
        submitted_by: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      toast.success("Assignment marked as complete!");
    },
  });

  const handleCompleteInApp = (task) => {
    completeInAppMutation.mutate(task.id);
    navigate(createPageUrl(task.action_link.page));
  };

  const submitMutation = useMutation({
    mutationFn: ({ taskId, submission }) =>
      base44.entities.Assignment.update(taskId, {
        status: "submitted",
        submission_text: submission,
        submitted_by: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
      toast.success("Task submitted! Your coach will review it soon.");
    },
  });

  const now = new Date();
  const todo    = assignments.filter(a => a.status === "assigned" && (!a.due_date || new Date(a.due_date) >= now));
  const overdue = assignments.filter(a => a.status === "assigned" && a.due_date && new Date(a.due_date) < now);
  const submitted = assignments.filter(a => a.status === "submitted");
  const graded    = assignments.filter(a => a.status === "graded");

  const avgGrade = graded.length > 0
    ? (graded.reduce((sum, a) => sum + (a.grade || 0), 0) / graded.length).toFixed(1)
    : null;

  const TABS = [
    { key: "todo",      label: "To Do",     count: todo.length,      color: "#8b3dff" },
    { key: "overdue",   label: "Overdue",   count: overdue.length,   color: "#dc2626" },
    { key: "submitted", label: "Submitted", count: submitted.length, color: "#f59e0b" },
    { key: "graded",    label: "Graded",    count: graded.length,    color: "#10b981" },
  ];

  const visibleTasks = { todo, overdue, submitted, graded }[tab] || [];

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "#0a0a0a" }}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-gray-500 uppercase tracking-widest">My Tasks</span>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Assignments
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "To Do",      value: todo.length,      color: "#8b3dff" },
            { label: "Overdue",    value: overdue.length,   color: "#dc2626" },
            { label: "Submitted",  value: submitted.length, color: "#f59e0b" },
            { label: "Avg Grade",  value: avgGrade ? `${avgGrade}/10` : "—", color: "#10b981" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center stat-card"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-2xl font-bold" style={{ fontFamily: "Rajdhani, sans-serif", color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">
              You have <strong>{overdue.length}</strong> overdue task{overdue.length > 1 ? "s" : ""}. Take care of these first!
            </p>
            <button className="ml-auto text-xs text-red-400 hover:text-red-300 font-medium"
              onClick={() => setTab("overdue")}>View →</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === t.key ? t.color + "20" : "transparent",
                color: tab === t.key ? t.color : "#6b7280",
                border: tab === t.key ? `1px solid ${t.color}40` : "1px solid transparent",
              }}>
              {t.label}
              {t.count > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: t.color }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-4" style={{ background: "#0f0f0f" }}>
                <div className="flex gap-3">
                  <div className="shimmer w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-3 w-48 rounded" />
                    <div className="shimmer h-2.5 w-24 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No {TABS.find(t => t.key === tab)?.label.toLowerCase()} tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map(task => (
              <TaskCard key={task.id} task={task} currentUserId={user?.id}
                onSubmit={(taskId, submission) => submitMutation.mutate({ taskId, submission })}
                onCompleteInApp={handleCompleteInApp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}