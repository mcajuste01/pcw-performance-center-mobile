import React, { useState, useMemo, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList, Plus, Edit2, Trash2, Copy, ChevronDown, ChevronUp,
  RefreshCw, Search, Tag, Calendar, Filter, UserPlus, Archive, ArchiveRestore, Check
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BulkActionBar from "@/components/assignments/BulkActionBar";
// bulk selection tool
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import AssignmentAnalytics from "@/components/assignments/AssignmentAnalytics";
import EditAssignmentModal from "@/components/assignments/EditAssignmentModal";
import ReassignModal from "@/components/assignments/ReassignModal";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

const TYPE_COLORS = {
  promo:       { bg: "rgba(139,61,255,0.15)", color: "#a78bfa", label: "Promo" },
  drill:       { bg: "rgba(220,38,38,0.15)",  color: "#f87171", label: "Drill" },
  conditioning:{ bg: "rgba(245,158,11,0.15)", color: "#fbbf24", label: "Conditioning" },
  psychology:  { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Psychology" },
  match_study: { bg: "rgba(192,192,192,0.1)", color: "#d1d5db", label: "Match Study" },
  in_app_task: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "In-App Task" },
};

const TIER_COLORS = {
  T1:           { bg: "rgba(139,61,255,0.12)", color: "#a78bfa" },
  T2:           { bg: "rgba(220,38,38,0.12)",  color: "#f87171" },
  T3:           { bg: "rgba(192,192,192,0.1)", color: "#d1d5db" },
  Graduated:    { bg: "rgba(16,185,129,0.12)", color: "#34d399" },
  "PCW Wrestler": { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" },
  All:          { bg: "rgba(59,130,246,0.12)", color: "#60a5fa" },
};

function AssignmentCard({ assignment, onEdit, onDelete, onDuplicate, onReassign, onArchive, profiles = [], selectMode = false, isSelected = false, onToggleSelect }) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = TYPE_COLORS[assignment.assignment_type] || TYPE_COLORS.promo;
  const tierCfg = TIER_COLORS[assignment.tier] || TIER_COLORS.All;
  const hasSubmission = assignment.status === "submitted" || assignment.status === "graded";

  const submitterName = useMemo(() => {
    if (!assignment.submitted_by) return null;
    const p = profiles.find(p => p.auth_user_id === assignment.submitted_by);
    return p?.wrestling_name || p?.full_name || null;
  }, [assignment.submitted_by, profiles]);

  return (
    <div className="rounded-xl border transition-all pcw-card-hover overflow-hidden"
      style={{ background: "#0a0a0a", borderColor: hasSubmission ? "rgba(139,61,255,0.25)" : "rgba(255,255,255,0.07)" }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {selectMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.([assignment.id]); }}
              className="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
              style={{
                borderColor: isSelected ? "#8b3dff" : "rgba(255,255,255,0.25)",
                background: isSelected ? "#8b3dff" : "transparent",
              }}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                style={{ background: typeCfg.bg, color: typeCfg.color }}>
                {typeCfg.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: tierCfg.bg, color: tierCfg.color }}>
                {assignment.tier}
              </span>
              {assignment.tags?.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(139,61,255,0.1)", color: "#a78bfa" }}>
                  {tag}
                </span>
              ))}
            </div>
            <p className="font-semibold text-white text-sm truncate">{assignment.title}</p>
            {assignment.due_date && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due: {new Date(assignment.due_date + 'T12:00:00').toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasSubmission && (
              <button onClick={() => setExpanded(e => !e)}
                className="p-2 rounded-lg border transition-colors hover:opacity-80 flex items-center gap-1"
                style={{ borderColor: "rgba(139,61,255,0.3)", color: "#a78bfa", background: "rgba(139,61,255,0.08)", fontSize: "10px" }}>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                Submission
              </button>
            )}
            <button onClick={() => onReassign(assignment)}
              className="p-2 rounded-lg border transition-colors hover:opacity-80"
              title="Re-assign"
              style={{ borderColor: "rgba(59,130,246,0.4)", color: "#60a5fa", background: "rgba(59,130,246,0.08)" }}>
              <UserPlus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(assignment)}
              className="p-2 rounded-lg border transition-colors hover:opacity-80"
              style={{ borderColor: "rgba(139,61,255,0.4)", color: "#8b3dff", background: "rgba(139,61,255,0.08)" }}>
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDuplicate(assignment)}
              className="p-2 rounded-lg border transition-colors hover:opacity-80"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "#9ca3af", background: "rgba(255,255,255,0.04)" }}>
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onArchive(assignment)}
              className="p-2 rounded-lg border transition-colors hover:opacity-80"
              title={assignment.archived ? "Restore" : "Archive"}
              style={{ borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b", background: "rgba(245,158,11,0.06)" }}>
              {assignment.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onDelete(assignment)}
              className="p-2 rounded-lg border transition-colors hover:opacity-80"
              style={{ borderColor: "rgba(220,38,38,0.4)", color: "#dc2626", background: "rgba(220,38,38,0.08)" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Submission panel for coach */}
      {hasSubmission && expanded && (
        <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between pt-3 mb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Trainee Submission</p>
            {submitterName && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(139,61,255,0.12)", color: "#a78bfa" }}>
                Submitted by {submitterName}
              </span>
            )}
          </div>

          {assignment.submission_text ? (
            <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {assignment.submission_text.split(/(?<=[:;])\s+/).map((segment, i) => (
                <p key={i} className="text-sm text-gray-300 leading-relaxed mb-1 last:mb-0">{segment.trim()}</p>
              ))}
            </div>
          ) : !assignment.submission_video_link ? (
            <p className="text-sm text-gray-600 italic mb-3">No submission content provided.</p>
          ) : null}

          {assignment.submission_video_link && (
            <a href={assignment.submission_video_link} target="_blank" rel="noopener noreferrer"
              className="text-xs text-purple-400 underline block mb-3">View Video →</a>
          )}
          {assignment.submission_notes && (
            <p className="text-xs text-gray-500 italic mb-3">{assignment.submission_notes}</p>
          )}

          {assignment.status === "graded" && (
            <div className="p-2 rounded-lg flex items-center justify-between"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span className="text-xs text-green-400">Grade: <strong>{assignment.grade}/10</strong></span>
              {assignment.feedback && <span className="text-xs text-gray-400 ml-2">{assignment.feedback}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecurringGroup({ groupId, assignments, onEdit, onDelete, onDeleteGroup, onDuplicate, onReassign, onArchiveGroup, profiles, selectMode = false, isSelected = false, onToggleSelect }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...assignments].sort((a, b) => (a.recurrence_instance || 0) - (b.recurrence_instance || 0));
  const first = sorted[0];
  const typeCfg = TYPE_COLORS[first.assignment_type] || TYPE_COLORS.promo;
  const baseTitle = first.title.replace(/\s*\(\d+\/\d+\)$/, "");
  const completed = sorted.filter(a => a.status === "graded").length;

  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ background: "#0f0f0f", borderColor: "rgba(139,61,255,0.25)" }}>
      {/* Group header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {selectMode && (
            <button
              onClick={() => onToggleSelect?.(assignments.map(a => a.id))}
              className="mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0"
              style={{
                borderColor: isSelected ? "#8b3dff" : "rgba(255,255,255,0.25)",
                background: isSelected ? "#8b3dff" : "transparent",
              }}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                style={{ background: typeCfg.bg, color: typeCfg.color }}>
                {typeCfg.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                style={{ background: "rgba(139,61,255,0.1)", color: "#a78bfa" }}>
                <RefreshCw className="w-2.5 h-2.5" />
                Recurring · {sorted.length} instances
              </span>
              {first.tags?.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(139,61,255,0.08)", color: "#a78bfa" }}>
                  {tag}
                </span>
              ))}
            </div>
            <p className="font-semibold text-white text-sm">{baseTitle}</p>
            <p className="text-xs text-gray-500 mt-1">
              {completed}/{sorted.length} completed ·{" "}
              {sorted[0].due_date && format(new Date(sorted[0].due_date + 'T12:00:00'), "MMM d")} →{" "}
              {sorted[sorted.length - 1].due_date && format(new Date(sorted[sorted.length - 1].due_date + 'T12:00:00'), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => onReassign(first)} title="Re-assign template"
              className="p-2 rounded-lg border transition-colors hover:opacity-80"
              style={{ borderColor: "rgba(59,130,246,0.4)", color: "#60a5fa", background: "rgba(59,130,246,0.08)" }}>
              <UserPlus className="w-4 h-4" />
            </button>
            <button onClick={() => onArchiveGroup(groupId, sorted)} title="Archive all instances"
              className="p-2 rounded-lg border transition-colors hover:opacity-80"
              style={{ borderColor: "rgba(245,158,11,0.4)", color: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
              <Archive className="w-4 h-4" />
            </button>
            <button onClick={() => onDeleteGroup(groupId, sorted.length)} title="Delete all instances"
              className="p-2 rounded-lg border transition-colors hover:opacity-80"
              style={{ borderColor: "rgba(220,38,38,0.4)", color: "#dc2626", background: "rgba(220,38,38,0.08)" }}>
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setExpanded(e => !e)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${(completed / sorted.length) * 100}%`, background: "linear-gradient(90deg, #8b3dff, #10b981)" }} />
        </div>
      </div>

      {/* Expanded instances */}
      {expanded && (
        <div className="border-t space-y-2 p-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {sorted.map(a => (
            <AssignmentCard key={a.id} assignment={a} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onReassign={onReassign} profiles={profiles} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Assignments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [reassignAssignment, setReassignAssignment] = useState(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkReassignAssignments, setBulkReassignAssignments] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      const isCoach = u?.role === "admin" || u?.roles?.includes("coach") || u?.roles?.includes("admin");
      if (!isCoach) navigate(createPageUrl("MyTasks"));
    }).catch(console.error);
  }, [navigate]);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["allAssignments"],
    queryFn: async () => {
      const res = await base44.entities.Assignment.list("due_date", 500);
      return toArray(res);
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["userProfilesAssignments"],
    queryFn: async () => toArray(await base44.entities.UserProfile.list()),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      toast.success("Assignment deleted");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId) => base44.entities.Assignment.deleteMany({ recurrence_group_id: groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      toast.success("All instances deleted");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }) => base44.entities.Assignment.update(id, { archived }),
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      toast.success(archived ? "Assignment archived" : "Assignment restored");
    },
  });

  const archiveGroupMutation = useMutation({
    mutationFn: ({ groupId, archived }) => base44.entities.Assignment.updateMany(
      { recurrence_group_id: groupId },
      { $set: { archived } }
    ),
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      toast.success(archived ? "All instances archived" : "All instances restored");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (a) => base44.entities.Assignment.create({
      title: `${a.title} (Copy)`,
      description: a.description,
      tier: a.tier,
      assignment_type: a.assignment_type,
      due_date: a.due_date,
      tags: a.tags,
      reference_video_link: a.reference_video_link,
      resource_ids: a.resource_ids,
      action_link: a.action_link,
      coach_id: user?.id,
      status: "assigned",
      submission_status: "not_started",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      toast.success("Assignment duplicated");
    },
  });

  const toggleSelection = (ids) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());
  const exitSelectMode = () => { setSelectMode(false); clearSelection(); };

  const bulkArchiveMutation = useMutation({
    mutationFn: ({ ids, archived }) => base44.entities.Assignment.bulkUpdate(ids.map(id => ({ id, archived }))),
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      toast.success(`${selectedIds.size} assignments ${archived ? "archived" : "restored"}`);
      exitSelectMode();
    },
  });

  const handleBulkReassign = () => {
    const selected = filtered.filter(a => selectedIds.has(a.id));
    setBulkReassignAssignments(selected);
  };

  const handleDelete = (assignment) => {
    if (window.confirm(`Delete "${assignment.title}"?`)) {
      deleteMutation.mutate(assignment.id);
    }
  };

  const handleDeleteGroup = (groupId, count) => {
    if (window.confirm(`Delete all ${count} instances of this recurring assignment?`)) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
  };

  // Filter
  const filtered = useMemo(() => {
    return assignments.filter(a => {
      const isArchived = a.archived === true;
      if (archiveFilter === "active" && isArchived) return false;
      if (archiveFilter === "archived" && !isArchived) return false;
      if (tierFilter !== "all" && a.tier !== tierFilter) return false;
      if (typeFilter !== "all" && a.assignment_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.title?.toLowerCase().includes(q) && !a.tags?.some(t => t.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [assignments, tierFilter, typeFilter, search, archiveFilter]);

  // Group: recurring vs standalone
  const { recurringGroups, standalone } = useMemo(() => {
    const groups = {};
    const standalone = [];

    filtered.forEach(a => {
      if (a.recurrence_group_id) {
        if (!groups[a.recurrence_group_id]) groups[a.recurrence_group_id] = [];
        groups[a.recurrence_group_id].push(a);
      } else {
        standalone.push(a);
      }
    });

    return { recurringGroups: groups, standalone };
  }, [filtered]);

  const totalCount = standalone.length + Object.keys(recurringGroups).length;

  const selectAll = () => setSelectedIds(new Set(filtered.map(a => a.id)));

  return (
    <><div className="min-h-screen p-5 md:p-8" style={{ background: "#0a0a0a" }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Coach View</span>
            </div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              Assignment Management
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => { setSelectMode(!selectMode); clearSelection(); }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {selectMode ? "Done" : "Select"}
            </Button>
            <Link to={createPageUrl("CreateAssignment")}>
              <Button style={{ background: "#8b3dff" }}>
                <Plus className="w-4 h-4 mr-2" /> New Assignment
              </Button>
            </Link>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {!isLoading && assignments.length > 0 && (
          <AssignmentAnalytics assignments={assignments} />
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search title or tag..."
              className="bg-gray-900 border-gray-700 text-white pl-9" />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-36">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="T1">T1</SelectItem>
              <SelectItem value="T2">T2</SelectItem>
              <SelectItem value="T3">T3</SelectItem>
              <SelectItem value="Graduated">Graduated</SelectItem>
              <SelectItem value="PCW Wrestler">PCW Wrestler</SelectItem>
              <SelectItem value="All">All Members</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="promo">Promo</SelectItem>
              <SelectItem value="drill">Drill</SelectItem>
              <SelectItem value="conditioning">Conditioning</SelectItem>
              <SelectItem value="psychology">Psychology</SelectItem>
              <SelectItem value="match_study">Match Study</SelectItem>
              <SelectItem value="in_app_task">In-App Task</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            <button onClick={() => setArchiveFilter("active")}
              className="px-3 py-2 text-xs font-medium transition-colors"
              style={archiveFilter === "active"
                ? { background: "#8b3dff", color: "#fff" }
                : { background: "#111", color: "#6b7280" }}>
              Active
            </button>
            <button onClick={() => setArchiveFilter("archived")}
              className="px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1"
              style={archiveFilter === "archived"
                ? { background: "#8b3dff", color: "#fff" }
                : { background: "#111", color: "#6b7280" }}>
              <Archive className="w-3 h-3" />
              Archived
            </button>
          </div>
        </div>

        {/* Stats */}
        <p className="text-xs text-gray-500">
          Showing <span className="text-gray-300 font-medium">{totalCount}</span> assignments
          ({Object.keys(recurringGroups).length} recurring groups, {standalone.length} standalone)
        </p>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="shimmer h-20 rounded-xl" />
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No assignments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Recurring groups first */}
            {Object.entries(recurringGroups).map(([groupId, items]) => (
              <RecurringGroup
                key={groupId}
                groupId={groupId}
                assignments={items}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDeleteGroup={handleDeleteGroup}
                onDuplicate={(a) => duplicateMutation.mutate(a)}
                onReassign={setReassignAssignment}
                onArchiveGroup={(gid, sorted) => archiveGroupMutation.mutate({ groupId: gid, archived: !sorted[0].archived })}
                profiles={profiles}
                selectMode={selectMode}
                isSelected={items.every(a => selectedIds.has(a.id))}
                onToggleSelect={toggleSelection}
              />
            ))}

            {/* Standalone assignments */}
            {standalone.map(a => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={(a) => duplicateMutation.mutate(a)}
                onReassign={setReassignAssignment}
                onArchive={(a) => archiveMutation.mutate({ id: a.id, archived: !a.archived })}
                profiles={profiles}
                selectMode={selectMode}
                isSelected={selectedIds.has(a.id)}
                onToggleSelect={toggleSelection}
              />
            ))}
          </div>
        )}
      </div>
    </div>

    {editingAssignment && (
      <EditAssignmentModal
        assignment={editingAssignment}
        onClose={() => setEditingAssignment(null)}
      />
    )}

    {reassignAssignment && (
      <ReassignModal
        assignment={reassignAssignment}
        user={user}
        profiles={profiles}
        onClose={() => setReassignAssignment(null)}
      />
    )}

    {bulkReassignAssignments && (
      <ReassignModal
        assignments={bulkReassignAssignments}
        user={user}
        profiles={profiles}
        onClose={() => setBulkReassignAssignments(null)}
      />
    )}

    {selectMode && selectedIds.size > 0 && (
      <BulkActionBar
        selectedCount={selectedIds.size}
        onSelectAll={selectAll}
        onClear={clearSelection}
        onArchive={() => bulkArchiveMutation.mutate({ ids: [...selectedIds], archived: archiveFilter !== "archived" })}
        onReassign={handleBulkReassign}
        isArchiving={bulkArchiveMutation.isPending}
        isArchivedView={archiveFilter === "archived"}
      />
    )}
    </>
  );
}