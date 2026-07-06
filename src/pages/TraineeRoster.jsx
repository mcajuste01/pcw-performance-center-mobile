import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Search, ClipboardList, TrendingUp, Trophy, Flame,
  CheckCircle, Clock, AlertTriangle, X, Plus, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

const TIER_COLORS = {
  T1: { bg: "rgba(139,61,255,0.15)", text: "#8b3dff", border: "rgba(139,61,255,0.3)" },
  T2: { bg: "rgba(220,38,38,0.15)", text: "#dc2626", border: "rgba(220,38,38,0.3)" },
  T3: { bg: "rgba(192,192,192,0.1)", text: "#c0c0c0", border: "rgba(192,192,192,0.25)" },
  Graduated: { bg: "rgba(16,185,129,0.15)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  "PCW Wrestler": { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
};

const ASSIGNMENT_TYPES = ["promo", "drill", "conditioning", "psychology", "match_study", "in_app_task"];

function StatusBadge({ checkIns = [], assignments = [] }) {
  const recentCheckIn = checkIns.some(c => {
    const d = new Date(c.check_in_date);
    const diff = (Date.now() - d) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const pendingTasks = assignments.filter(a => a.status === "assigned").length;

  if (!recentCheckIn && checkIns.length > 0) {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
        style={{ background: "rgba(220,38,38,0.15)", color: "#dc2626" }}>
        <AlertTriangle className="w-3 h-3" /> Inactive
      </span>
    );
  }
  if (pendingTasks > 2) {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
        style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
        <Clock className="w-3 h-3" /> {pendingTasks} pending
      </span>
    );
  }
  if (recentCheckIn) {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: "rgba(107,114,128,0.15)", color: "#6b7280" }}>
      No data
    </span>
  );
}

function AssignModal({ trainee, onClose, coachId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignment_type: "drill",
    due_date: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rosterAssignments"] });
      toast.success(`Task assigned to ${trainee.full_name}`);
      onClose();
    },
    onError: () => toast.error("Failed to assign task"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.due_date) {
      toast.error("Title and due date are required");
      return;
    }
    createMutation.mutate({
      coach_id: coachId,
      trainee_id: trainee.auth_user_id,
      tier: trainee.tier || "T1",
      title: form.title,
      description: form.description,
      assignment_type: form.assignment_type,
      due_date: form.due_date,
      status: "assigned",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: "#0f0f0f", border: "1px solid rgba(139,61,255,0.3)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Assign Task</h2>
            <p className="text-sm text-gray-400">To: {trainee.wrestling_name || trainee.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-gray-400 text-xs">Task Title *</Label>
            <Input
              className="bg-black/40 border-gray-700 text-white mt-1"
              placeholder="e.g. Cut a 2-minute promo"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs">Type</Label>
            <Select value={form.assignment_type} onValueChange={v => setForm({ ...form, assignment_type: v })}>
              <SelectTrigger className="bg-black/40 border-gray-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-400 text-xs">Instructions</Label>
            <Textarea
              className="bg-black/40 border-gray-700 text-white mt-1 h-20"
              placeholder="Describe the task in detail..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-gray-400 text-xs">Due Date *</Label>
            <Input
              type="date"
              className="bg-black/40 border-gray-700 text-white mt-1"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              className="flex-1 border-gray-700 text-gray-400">
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}
              className="flex-1 text-white"
              style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
              <Plus className="w-4 h-4 mr-1" />
              {createMutation.isPending ? "Assigning..." : "Assign Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TraineeRoster() {
  const [me, setMe] = useState(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [assignTarget, setAssignTarget] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(console.error);
  }, []);

  const isCoach = me?.role === "admin" || me?.roles?.includes("coach") || me?.roles?.includes("admin");

  const { data: profiles = [] } = useQuery({
    queryKey: ["rosterProfiles"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.list("-created_date", 200);
      return toArray(res).filter(p => p.role === "trainee");
    },
    enabled: !!me,
    initialData: [],
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["rosterCheckIns"],
    queryFn: async () => toArray(await base44.entities.CheckIn.list("-check_in_date", 500)),
    initialData: [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["rosterAssignments"],
    queryFn: async () => toArray(await base44.entities.Assignment.list("-created_date", 500)),
    initialData: [],
  });

  const { data: trainingLogs = [] } = useQuery({
    queryKey: ["rosterTrainingLogs"],
    queryFn: async () => toArray(await base44.entities.TrainingLog.list("-date", 500)),
    initialData: [],
  });

  const enriched = profiles.map(p => {
    const pid = p.auth_user_id;
    const pCheckIns = checkIns.filter(c => c.trainee_id === pid);
    const pAssignments = assignments.filter(a => a.trainee_id === pid);
    const pLogs = trainingLogs.filter(l => l.trainee_id === pid);

    const avgScore = pLogs.length > 0
      ? (pLogs.reduce((s, l) => s + (l.self_grade || 0), 0) / pLogs.length).toFixed(1)
      : null;

    const completedTasks = pAssignments.filter(a => a.status === "graded").length;
    const pendingTasks = pAssignments.filter(a => a.status === "assigned").length;

    return { ...p, _checkIns: pCheckIns, _assignments: pAssignments, _logs: pLogs, avgScore, completedTasks, pendingTasks };
  });

  const filtered = enriched.filter(p => {
    const matchSearch = !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.wrestling_name?.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || p.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const tiers = [...new Set(profiles.map(p => p.tier).filter(Boolean))];

  if (!isCoach) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <p className="text-gray-500">Access restricted to coaches and admins.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "#0a0a0a" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"
              style={{ fontFamily: "Rajdhani, sans-serif" }}>
              <Users className="w-8 h-8" style={{ color: "#8b3dff" }} />
              Trainee Roster
            </h1>
            <p className="text-gray-500 mt-1">{filtered.length} trainees • Quick-assign tasks from anywhere</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Trainees", value: profiles.length, icon: Users, color: "#8b3dff" },
            { label: "Active This Week", value: enriched.filter(p => p._checkIns.some(c => (Date.now() - new Date(c.check_in_date)) / 86400000 <= 7)).length, icon: Flame, color: "#10b981" },
            { label: "Pending Tasks", value: assignments.filter(a => a.status === "assigned").length, icon: Clock, color: "#f59e0b" },
            { label: "Completed Tasks", value: assignments.filter(a => a.status === "graded").length, icon: Trophy, color: "#dc2626" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{value}</p>
                </div>
                <div className="p-2 rounded-xl" style={{ background: `${color}20` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              className="pl-9 bg-gray-900 border-gray-800 text-white"
              placeholder="Search by name or ring name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-40 bg-gray-900 border-gray-800 text-white">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {tiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Trainee Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
            style={{ background: "#0f0f0f", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="col-span-4">Trainee</div>
            <div className="col-span-2 text-center">Tier</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1 text-center">Avg Score</div>
            <div className="col-span-1 text-center">Check-ins</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ background: "#080808", borderColor: "rgba(255,255,255,0.04)" }}>
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-600">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No trainees found</p>
              </div>
            ) : (
              filtered.map(trainee => {
                const tierStyle = TIER_COLORS[trainee.tier] || TIER_COLORS["T1"];
                const initials = (trainee.wrestling_name || trainee.full_name || "?")[0].toUpperCase();

                return (
                  <div key={trainee.id}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors">
                    {/* Name */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{
                          background: trainee.avatar_url ? `url(${trainee.avatar_url}) center/cover` :
                            "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)",
                        }}>
                        {!trainee.avatar_url && initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {trainee.wrestling_name || trainee.full_name}
                        </p>
                        {trainee.wrestling_name && trainee.full_name !== trainee.wrestling_name && (
                          <p className="text-xs text-gray-500 truncate">{trainee.full_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Tier */}
                    <div className="col-span-2 flex justify-center">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: tierStyle.bg, color: tierStyle.text, border: `1px solid ${tierStyle.border}` }}>
                        {trainee.tier || "—"}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex justify-center">
                      <StatusBadge checkIns={trainee._checkIns} assignments={trainee._assignments} />
                    </div>

                    {/* Avg Score */}
                    <div className="col-span-1 text-center">
                      {trainee.avgScore ? (
                        <span className="text-sm font-bold"
                          style={{
                            color: trainee.avgScore >= 7 ? "#8b3dff" :
                              trainee.avgScore >= 5 ? "#f59e0b" : "#dc2626"
                          }}>
                          {trainee.avgScore}<span className="text-xs text-gray-600">/10</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </div>

                    {/* Check-ins */}
                    <div className="col-span-1 text-center">
                      <span className="text-sm text-gray-300">{trainee._checkIns.length}</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => setAssignTarget(trainee)}
                        className="text-white text-xs"
                        style={{ background: "rgba(139,61,255,0.2)", border: "1px solid rgba(139,61,255,0.4)", color: "#a78bfa" }}>
                        <ClipboardList className="w-3.5 h-3.5 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {assignTarget && (
        <AssignModal
          trainee={assignTarget}
          coachId={me?.id}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}