import React, { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, parseISO, isValid, addDays, addWeeks, addMonths } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalIcon, MapPin, Users, CheckCircle, XCircle, Clock,
  Plus, X, ClipboardList, Repeat, Trash2, Edit, MessageSquare,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CalendarPlus
} from "lucide-react";

import ShowRolesPanel from "@/components/events/ShowRolesPanel";
import EventFeedbackForm from "@/components/events/EventFeedbackForm";
import CalendarSyncModal from "@/components/events/CalendarSyncModal";
import { toast } from "sonner";

const toArray = (v) => Array.isArray(v) ? v : v?.items && Array.isArray(v.items) ? v.items : [];

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

const EVENT_TYPE_COLORS = {
  training: "#8b3dff",
  show: "#dc2626",
  showcase: "#c0c0c0",
  conditioning: "#10b981",
};

const SESSION_LEVEL_OPTIONS = [
  { value: "fundamentals", label: "Fundamentals (T1)" },
  { value: "intermediate", label: "Intermediate (T2)" },
  { value: "advanced", label: "Advanced (T3)" },
  { value: "graduated", label: "Graduated" },
  { value: "pcw_wrestler", label: "PCW Wrestlers" },
  { value: "conditioning", label: "Conditioning (All Training)" },
  { value: "all", label: "All Members" },
];

const LEVEL_TIERS = {
  fundamentals: ["T1"],
  intermediate: ["T2"],
  advanced: ["T3"],
  graduated: ["Graduated"],
  pcw_wrestler: ["PCW Wrestler"],
  conditioning: ["T1", "T2", "T3"],
  all: ["T1", "T2", "T3", "Graduated", "PCW Wrestler"],
};

function CoachFeedbackReview({ event }) {
  const [open, setOpen] = useState(false);
  const { data: feedbacks = [] } = useQuery({
    queryKey: ["coachFeedbackReview", event.id],
    queryFn: async () => toArray(await base44.entities.EventFeedback.filter({ event_id: event.id })),
    enabled: open,
    initialData: [],
  });
  const STARS = (n) => "⭐".repeat(n || 0);
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors">
        <MessageSquare className="w-4 h-4" />
        View Feedback ({open ? feedbacks.length : "…"})
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {feedbacks.length === 0
            ? <p className="text-sm text-gray-600">No feedback submitted yet.</p>
            : feedbacks.map((fb) => (
              <div key={fb.id} className="p-3 rounded-lg space-y-2" style={{ background: "#050505", border: "1px solid #1f1f1f" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{fb.trainee_name || "Anonymous"} {fb.tier ? `· ${fb.tier}` : ""}</span>
                  <span className="text-yellow-400 text-sm">{STARS(fb.session_rating)}</span>
                </div>
                {fb.training_duration && <p className="text-xs text-gray-500">Training: {fb.training_duration}</p>}
                {fb.felt_prepared && <p className="text-xs text-gray-400">Felt prepared: <span className="text-white">{fb.felt_prepared}</span></p>}
                {fb.highlight && <div><p className="text-xs text-gray-500 mb-0.5">Highlight</p><p className="text-sm text-gray-300">{fb.highlight}</p></div>}
                {fb.what_learned && <div><p className="text-xs text-gray-500 mb-0.5">Learned</p><p className="text-sm text-gray-300">{fb.what_learned}</p></div>}
                {fb.improvement_areas && <div><p className="text-xs text-gray-500 mb-0.5">Wants to improve</p><p className="text-sm text-gray-300">{fb.improvement_areas}</p></div>}
                {fb.coach_feedback && (
                  <div className="p-2 rounded" style={{ background: "rgba(139,61,255,0.1)", border: "1px solid rgba(139,61,255,0.2)" }}>
                    <p className="text-xs text-purple-400 mb-0.5">🔒 Private Coach Feedback</p>
                    <p className="text-sm text-gray-300">{fb.coach_feedback}</p>
                  </div>
                )}
                {fb.additional_notes && <div><p className="text-xs text-gray-500 mb-0.5">Additional Notes</p><p className="text-sm text-gray-300">{fb.additional_notes}</p></div>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function EventDetailPanel({ event, user, isCoachOrAdmin, onEdit, onDelete, onClose, signUpMutation, withdrawMutation, assignments }) {
  const isSignedUp = event.participants?.includes(user?.id);
  const isCompleted = event.status === "completed";
  const typeColor = EVENT_TYPE_COLORS[event.event_type] || "#8b3dff";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative h-full w-full max-w-lg overflow-y-auto"
        style={{ background: "#0f0f0f", borderLeft: "1px solid #222" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-gray-800"
          style={{ background: "#0f0f0f" }}>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: `${typeColor}25`, color: typeColor }}>
              {event.event_type?.replace(/_/g, " ").toUpperCase()}
            </span>
            {isCompleted && <Badge className="bg-gray-800 text-gray-400 text-xs">Completed</Badge>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              {event.event_name}
            </h2>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CalIcon className="w-4 h-4" />
                <span>{event.event_date ? format(parseISO(event.event_date), "EEEE, MMMM d, yyyy") : "—"}</span>
                {event.event_time && <span className="text-gray-500">at {event.event_time}{event.event_end_time ? ` – ${event.event_end_time}` : ""}</span>}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{event.participants?.length || 0} participants</span>
              </div>
              {(event.session_levels?.length > 0 || event.session_level) && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Session:</span>
                  <span className="text-purple-400 capitalize">
                    {(event.session_levels?.length > 0 ? event.session_levels : [event.session_level]).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {event.description && (
            <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
          )}

          {/* Actions */}
          {!isCoachOrAdmin && !isCompleted && (
            <div>
              {isSignedUp ? (
                <Button variant="outline" className="w-full" onClick={() => withdrawMutation.mutate({ eventId: event.id, currentParticipants: event.participants })}
                  disabled={withdrawMutation.isPending} style={{ borderColor: "#dc2626", color: "#dc2626" }}>
                  <XCircle className="w-4 h-4 mr-2" /> Withdraw
                </Button>
              ) : (
                <Button className="w-full" onClick={() => signUpMutation.mutate({ eventId: event.id, currentParticipants: event.participants })}
                  disabled={signUpMutation.isPending} style={{ background: "#8b3dff" }}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Sign Up
                </Button>
              )}
            </div>
          )}

          {isCoachOrAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit} style={{ borderColor: "#8b3dff", color: "#8b3dff" }}>
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete} style={{ borderColor: "#dc2626", color: "#dc2626" }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          )}

          {/* Assigned tasks */}
          {event.assigned_assignments?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4" style={{ color: "#8b3dff" }} />
                <p className="font-semibold text-white text-sm">Assigned Tasks</p>
              </div>
              <div className="space-y-2">
                {event.assigned_assignments.map((id) => {
                  const a = assignments.find((a) => a.id === id);
                  if (!a) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 p-2 rounded border border-gray-700" style={{ background: "#0a0a0a" }}>
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{a.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCoachOrAdmin && <ShowRolesPanel event={event} />}

          {/* Feedback */}
          {isCompleted && !isCoachOrAdmin && user && <EventFeedbackForm event={event} user={user} />}
          {isCompleted && isCoachOrAdmin && <CoachFeedbackReview event={event} />}
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  event_name: "", event_date: "", event_time: "", event_end_time: "", location: "", description: "",
  event_type: "training_show", session_levels: [], is_recurring: false,
  recurrence_pattern: "weekly", recurrence_days: [], recurrence_interval: 1, recurrence_end_date: "",
};

export default function Events() {
  const [user, setUser] = useState(null);
  const [calView, setCalView] = useState("month");
  const [calDate, setCalDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(console.error);
  }, []);

  const isCoachOrAdmin = user?.roles?.includes("coach") || user?.roles?.includes("admin") || user?.role === "admin";

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => toArray(await base44.entities.Event.list("event_date")),
    initialData: [],
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["userProfilesEvents"],
    queryFn: async () => {
      const all = toArray(await base44.entities.UserProfile.list());
      const seen = new Set();
      return all.filter((u) => { const k = u.auth_user_id || u.id; if (seen.has(k)) return false; seen.add(k); return true; });
    },
    initialData: [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => toArray(await base44.entities.Assignment.list("-due_date")),
    initialData: [],
  });

  const getAutoParticipants = (session_levels) => {
    const levels = Array.isArray(session_levels) ? session_levels : session_levels ? [session_levels] : [];
    const tiers = [...new Set(levels.flatMap((l) => LEVEL_TIERS[l] || []))];
    if (!tiers.length) return [];
    return userProfiles.filter((p) => p.role !== "coach" && p.role !== "admin" && tiers.includes(p.tier))
      .map((p) => p.auth_user_id || p.id).filter(Boolean);
  };

  const signUpMutation = useMutation({
    mutationFn: ({ eventId, currentParticipants }) =>
      base44.entities.Event.update(eventId, { participants: [...(currentParticipants || []), user.id] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast.success("Signed up!"); },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ eventId, currentParticipants }) =>
      base44.entities.Event.update(eventId, { participants: currentParticipants.filter((id) => id !== user.id) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); toast.success("Withdrawn"); },
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => {
      const autoParticipants = getAutoParticipants(data.session_levels);
      if (editingEvent) return base44.entities.Event.update(editingEvent, { ...data, participants: autoParticipants });
      return base44.entities.Event.create({ ...data, status: "upcoming", participants: autoParticipants, assigned_assignments: [] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowForm(false); setEditingEvent(null); setFormData(EMPTY_FORM);
      toast.success(editingEvent ? "Event updated!" : "Event created!");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => base44.entities.Event.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setSelectedEvent(null);
      toast.success("Event deleted");
    },
  });

  // Convert events to react-big-calendar format, expanding recurring events
  const calEvents = useMemo(() => {
    const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

    const makeEntry = (ev, date) => {
      const start = new Date(date);
      const end = new Date(date);
      if (ev.event_time) {
        const [h, m] = ev.event_time.split(":").map(Number);
        start.setHours(h, m, 0);
        if (ev.event_end_time) {
          const [eh, em] = ev.event_end_time.split(":").map(Number);
          end.setHours(eh, em, 0);
        } else {
          end.setHours(h + 2, m, 0);
        }
      } else {
        start.setHours(10, 0, 0);
        end.setHours(12, 0, 0);
      }
      return { id: `${ev.id}-${date.toISOString()}`, title: ev.event_name, start, end, resource: ev, color: EVENT_TYPE_COLORS[ev.event_type] || "#8b3dff" };
    };

    const calStart = startOfWeek(new Date(calDate.getFullYear(), calDate.getMonth(), 1), { weekStartsOn: 0 });
    const calEnd = addDays(calStart, 42); // 6 weeks

    const results = [];
    events.forEach((ev) => {
      if (!ev.event_date) return;
      const [y, mo, d] = ev.event_date.split('-').map(Number);
      const origin = new Date(y, mo - 1, d);

      if (!ev.is_recurring || !ev.recurrence_pattern) {
        if (origin >= calStart && origin <= calEnd) results.push(makeEntry(ev, origin));
        return;
      }

      const endDate = ev.recurrence_end_date
        ? (() => { const [ey, em, ed] = ev.recurrence_end_date.split('-').map(Number); return new Date(ey, em - 1, ed); })()
        : calEnd;
      const until = endDate < calEnd ? endDate : calEnd;

      const recDays = Array.isArray(ev.recurrence_days) && ev.recurrence_days.length > 0 ? ev.recurrence_days : null;
      const pattern = ev.recurrence_pattern;
      const interval = pattern === 'biweekly' ? 14 : pattern === 'weekly' ? 7 : pattern === 'monthly' ? 0 : 1;

      if (recDays && (pattern === 'weekly' || pattern === 'biweekly')) {
        // For each target day-of-week, generate occurrences within the window
        recDays.forEach((dayName) => {
          const targetDow = DAY_NAMES.indexOf(dayName);
          if (targetDow === -1) return;
          // Find first occurrence of this weekday on or after origin
          let cur = new Date(origin);
          const diff = (targetDow - cur.getDay() + 7) % 7;
          cur.setDate(cur.getDate() + diff);
          while (cur <= until) {
            if (cur >= calStart) results.push(makeEntry(ev, new Date(cur)));
            cur.setDate(cur.getDate() + interval);
          }
        });
      } else {
        // Simple interval expansion
        let cur = new Date(origin);
        while (cur <= until) {
          if (cur >= calStart) results.push(makeEntry(ev, new Date(cur)));
          if (pattern === 'daily') cur.setDate(cur.getDate() + 1);
          else if (pattern === 'weekly') cur.setDate(cur.getDate() + 7);
          else if (pattern === 'biweekly') cur.setDate(cur.getDate() + 14);
          else if (pattern === 'monthly') cur.setMonth(cur.getMonth() + 1);
          else break;
        }
      }
    });

    // Add assignment due dates
    const userProfile = userProfiles.find(p => p.auth_user_id === user?.id);
    const userTier = userProfile?.tier;
    assignments.forEach((a) => {
      if (!a.due_date || a.archived) return;
      const isRelevant = isCoachOrAdmin
        || a.tier === "All"
        || a.tier === userTier
        || a.trainee_id === user?.id;
      if (!isRelevant) return;
      const [ay, am, ad] = a.due_date.split('-').map(Number);
      const dueDate = new Date(ay, am - 1, ad);
      if (dueDate < calStart || dueDate > calEnd) return;
      const start = new Date(dueDate); start.setHours(9, 0, 0);
      const end = new Date(dueDate); end.setHours(9, 30, 0);
      results.push({
        id: `assignment-${a.id}`,
        title: `📋 ${a.title}`,
        start, end,
        resource: { ...a, isAssignment: true },
        color: "#f59e0b",
      });
    });

    return results;
    }, [events, calDate, assignments, userProfiles, user, isCoachOrAdmin]);

  const eventStyleGetter = (ev) => ({
    style: {
      backgroundColor: ev.color,
      borderRadius: "6px",
      border: "none",
      color: "#fff",
      fontSize: "11px",
      fontWeight: 600,
    },
  });

  const navigate = (dir) => {
    const d = new Date(calDate);
    if (calView === "month") { d.setMonth(d.getMonth() + dir); }
    else if (calView === "week") { d.setDate(d.getDate() + dir * 7); }
    else { d.setDate(d.getDate() + dir); }
    setCalDate(d);
  };

  const handleSelectEvent = (calEv) => {
    if (calEv.resource?.isAssignment) {
      toast.info(`📋 Assignment due: ${calEv.resource.title}`);
      return;
    }
    setSelectedEvent(calEv.resource);
  };
  const handleSelectSlot = () => {}; // no-op for now

  const openEdit = (event) => {
    setEditingEvent(event.id);
    setFormData({
      event_name: event.event_name, event_date: event.event_date, event_time: event.event_time || "", event_end_time: event.event_end_time || "",
      location: event.location || "", description: event.description || "", event_type: event.event_type,
      session_levels: Array.isArray(event.session_levels) ? event.session_levels : event.session_level ? [event.session_level] : [],
      is_recurring: event.is_recurring || false, recurrence_pattern: event.recurrence_pattern || "weekly",
      recurrence_days: event.recurrence_days || [], recurrence_interval: event.recurrence_interval || 1,
      recurrence_end_date: event.recurrence_end_date || "",
    });
    setSelectedEvent(null);
    setShowForm(true);
  };

  const handleDelete = (event) => {
    if (confirm("Delete this event?")) deleteEventMutation.mutate(event.id);
  };

  const viewLabel = { month: "Month", week: "Week", day: "Day" };
  const titleFormat = {
    month: format(calDate, "MMMM yyyy"),
    week: `Week of ${format(startOfWeek(calDate, { weekStartsOn: 0 }), "MMM d, yyyy")}`,
    day: format(calDate, "EEEE, MMMM d, yyyy"),
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalIcon className="w-6 h-6" style={{ color: "#8b3dff" }} />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              PCW Events
            </h1>
          </div>
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCalDate(new Date())}
              className="px-3 py-1 text-xs font-medium rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-800">
              Today
            </button>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-white font-semibold text-sm hidden sm:block" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            {titleFormat[calView]}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {Object.entries(viewLabel).map(([v, label]) => (
              <button key={v} onClick={() => setCalView(v)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={calView === v
                  ? { background: "#8b3dff", color: "#fff" }
                  : { background: "#111", color: "#6b7280" }}>
                {label}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowCalendarSync(true)} variant="outline" size="sm"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
            <CalendarPlus className="w-4 h-4 mr-1" /> Sync
          </Button>
          {isCoachOrAdmin && (
            <Button onClick={() => { setShowForm(!showForm); setEditingEvent(null); setFormData(EMPTY_FORM); }}
              style={{ background: "#8b3dff" }} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Event type legend */}
      <div className="flex flex-wrap gap-3 px-6 py-2 border-b border-gray-800">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500 capitalize">{type.replace(/_/g, " ")}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} />
          <span className="text-xs text-gray-500">Assignment Due</span>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && isCoachOrAdmin && (
        <div className="mx-6 mt-4 rounded-xl border border-gray-800" style={{ background: "#0f0f0f" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">{editingEvent ? "Edit Event" : "Create New Event"}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); createEventMutation.mutate(formData); }} className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 text-sm">Event Name *</Label>
                <Input value={formData.event_name} onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white" placeholder="e.g., PCW Showdown" required />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Event Type</Label>
                <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="show">Show</SelectItem>
                    <SelectItem value="showcase">Showcase</SelectItem>
                    <SelectItem value="conditioning">Conditioning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Event Date *</Label>
                <Input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white" required />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Start Time</Label>
                <Input type="time" value={formData.event_time} onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white" />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">End Time</Label>
                <Input type="time" value={formData.event_end_time} onChange={(e) => setFormData({ ...formData, event_end_time: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white" />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white" placeholder="e.g., PCW Arena" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-gray-300 text-sm mb-2 block">Session Levels (auto-assigns participants)</Label>
                <div className="flex flex-wrap gap-2">
                  {SESSION_LEVEL_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-colors text-sm"
                      style={formData.session_levels.includes(opt.value)
                        ? { background: "rgba(139,61,255,0.2)", borderColor: "#8b3dff", color: "#8b3dff" }
                        : { background: "#0a0a0a", borderColor: "#444", color: "#999" }}>
                      <Checkbox checked={formData.session_levels.includes(opt.value)}
                        onCheckedChange={(checked) => setFormData({
                          ...formData, session_levels: checked
                            ? [...formData.session_levels, opt.value]
                            : formData.session_levels.filter((v) => v !== opt.value)
                        })} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white h-20" placeholder="Event details…" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="recurring" checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })} />
              <Label htmlFor="recurring" className="text-gray-300 text-sm flex items-center gap-1 cursor-pointer">
                <Repeat className="w-4 h-4" /> Recurring Event
              </Label>
            </div>
            {formData.is_recurring && (
              <div className="p-4 rounded-lg border border-gray-700 space-y-3" style={{ background: "#0a0a0a" }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 text-sm">Pattern</Label>
                    <Select value={formData.recurrence_pattern} onValueChange={(v) => setFormData({ ...formData, recurrence_pattern: v })}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-sm">End Date (optional)</Label>
                    <Input type="date" value={formData.recurrence_end_date}
                      onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white" />
                  </div>
                </div>
                {(formData.recurrence_pattern === "weekly" || formData.recurrence_pattern === "biweekly") && (
                  <div className="flex flex-wrap gap-3">
                    {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((day) => (
                      <label key={day} className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <Checkbox checked={formData.recurrence_days.includes(day)}
                          onCheckedChange={(checked) => setFormData({
                            ...formData, recurrence_days: checked
                              ? [...formData.recurrence_days, day]
                              : formData.recurrence_days.filter((d) => d !== day)
                          })} />
                        <span className="text-gray-300 capitalize">{day.slice(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                style={{ borderColor: "#444", color: "#999" }}>Cancel</Button>
              <Button type="submit" disabled={createEventMutation.isPending} style={{ background: "#8b3dff" }}>
                {createEventMutation.isPending ? "Saving…" : editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar */}
      <div className="flex-1 p-4 md:p-6" style={{ minHeight: 600 }}>
        <Calendar
          localizer={localizer}
          events={calEvents}
          view={calView}
          date={calDate}
          onNavigate={setCalDate}
          onView={setCalView}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          style={{ height: "calc(100vh - 220px)", minHeight: 500 }}
          toolbar={false}
          popup
        />
      </div>

      {/* Event Detail Panel */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          user={user}
          isCoachOrAdmin={isCoachOrAdmin}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => openEdit(selectedEvent)}
          onDelete={() => handleDelete(selectedEvent)}
          signUpMutation={signUpMutation}
          withdrawMutation={withdrawMutation}
          assignments={assignments}
        />
      )}

      <CalendarSyncModal open={showCalendarSync} onClose={() => setShowCalendarSync(false)} user={user} />
    </div>
  );
}