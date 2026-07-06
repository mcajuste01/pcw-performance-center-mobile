import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shield, CheckCircle, ClipboardList, Video, AlertTriangle, Download, Calendar, Target, User, MessageSquare, Search, GitCompare } from "lucide-react";
import TraineeFilters from "../components/coach/TraineeFilters";
import QuickGradeModal from "../components/coach/QuickGradeModal";
import BroadcastMessage from "../components/coach/BroadcastMessage";
import QRCheckIn from "../components/coach/QRCheckIn";
import TraineeProgressCard from "../components/coach/TraineeProgressCard";
import WorkoutPlanModal from "../components/coach/WorkoutPlanModal";
import SessionScheduler from "../components/coach/SessionScheduler";
import FeedbackModal from "../components/coach/FeedbackModal";
import PerformanceMetrics from "../components/coach/PerformanceMetrics";
import TraineeCompareModal from "../components/coach/TraineeCompareModal";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [filters, setFilters] = useState({ tier: "all", minStreak: 0, riskFlags: false, showTodayOnly: false });
  const [sortBy, setSortBy] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTrainee, setExpandedTrainee] = useState(null);
  const [showCheckInsDetails, setShowCheckInsDetails] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
  const [messageTrainee, setMessageTrainee] = useState(null);
  const [compareList, setCompareList] = useState([]); // up to 2 trainee IDs
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (trainee) => {
    setCompareList(prev => {
      if (prev.find(t => t.id === trainee.id)) return prev.filter(t => t.id !== trainee.id);
      if (prev.length >= 2) { toast.error("Select only 2 trainees to compare"); return prev; }
      return [...prev, trainee];
    });
  };

  const verifyCheckInMutation = useMutation({
    mutationFn: async (checkIn) => {
      // Update check-in status
      await base44.entities.CheckIn.update(checkIn.id, {
        verification_status: 'verified',
        verified_by: user.id,
        verified_at: new Date().toISOString()
      });
      // Notify the trainee
      try {
        await base44.entities.Notification.create({
          user_id: checkIn.trainee_id,
          type: 'attendance_verified',
          title: '✅ Attendance Verified',
          message: `Your check-in for ${checkIn.check_in_date || 'today'} has been verified by your coach.`,
          sender_id: user.id,
          read: false,
        });
      } catch (e) {
        // Non-fatal — don't block the verify action
        console.log('Could not create verification notification:', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayCheckIns'] });
      queryClient.invalidateQueries({ queryKey: ['allCheckIns'] });
      toast.success('Attendance verified & trainee notified');
    }
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const roles = currentUser?.roles ?? [];
        const hasCoachRole = roles.includes("coach") || roles.includes("admin") || currentUser?.role === "admin";
        if (!hasCoachRole) {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: allTrainees = [] } = useQuery({
    queryKey: ["allTrainees"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.list("full_name", 500);
      return toArray(res).filter((u) => u.role !== "admin" && u.role !== "coach");
    },
    initialData: [],
  });

  const { data: todayCheckIns = [] } = useQuery({
    queryKey: ["todayCheckIns"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await base44.entities.CheckIn.list("-check_in_time");
      return toArray(res).filter((c) => c.check_in_date === today);
    },
    initialData: [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await base44.entities.Assignment.list("due_date");
      return toArray(res);
    },
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const res = await base44.entities.Video.filter({ analyzed: true }, "-created_date");
      return toArray(res);
    },
    initialData: [],
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => {
      const res = await base44.entities.Tier.list("order");
      return toArray(res);
    },
    initialData: [],
  });

  const { data: allTrainingLogs = [] } = useQuery({
    queryKey: ["allTrainingLogs"],
    queryFn: async () => {
      const res = await base44.entities.TrainingLog.list("-date");
      return toArray(res);
    },
    initialData: [],
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ["allCheckIns"],
    queryFn: async () => {
      const res = await base44.entities.CheckIn.list("-check_in_time");
      return toArray(res);
    },
    initialData: [],
  });

  const { data: progressReports = [] } = useQuery({
    queryKey: ["progressReports"],
    queryFn: async () => {
      const res = await base44.entities.ProgressReport.list("-report_date");
      return toArray(res);
    },
    initialData: [],
  });

  const { data: selfEvaluations = [] } = useQuery({
    queryKey: ["selfEvaluations"],
    queryFn: async () => {
      const res = await base44.entities.SelfEvaluation.list("-session_date");
      return toArray(res);
    },
    initialData: [],
  });

  const assignmentsDue = useMemo(
    () =>
      toArray(assignments).filter((a) => {
        if (!a?.due_date) return false;
        const dueDate = new Date(a.due_date);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return a.status !== "graded" && dueDate <= threeDaysFromNow;
      }),
    [assignments]
  );

  const videosToReview = useMemo(
    () => toArray(videos).filter((v) => !v.coach_feedback),
    [videos]
  );

  const unverifiedCheckIns = useMemo(
    () => toArray(allCheckIns).filter((checkIn) =>
      checkIn.verification_status !== 'verified' &&
      checkIn.trainee_name && checkIn.trainee_name !== 'Unknown Trainee' &&
      checkIn.trainee_id
    ),
    [allCheckIns]
  );

  const getUserTier = (traineeId) => {
    const trainee = toArray(allTrainees).find((t) => t.id === traineeId);
    return trainee?.tier || "T1";
  };

  // Memoize ALL trainee metrics at once — avoids recalculating per-trainee on every render
  const allTraineeMetrics = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const map = {};
    toArray(allTrainees).forEach((trainee) => {
      const traineeId = trainee.id;
      const logs = toArray(allTrainingLogs).filter((l) => l?.trainee_id === traineeId);
      const checkIns = toArray(allCheckIns).filter((c) => c?.trainee_id === traineeId);
      const traineeAssignments = toArray(assignments).filter((a) => a?.trainee_id === traineeId);
      const traineeVideos = toArray(videos).filter((v) => v?.trainee_id === traineeId);
      const reports = toArray(progressReports).filter((r) => r?.trainee_id === traineeId);
      const evals = toArray(selfEvaluations).filter((e) => e?.trainee_id === traineeId);

      const recentLogs = logs.filter((l) => l?.date && new Date(l.date) >= last30Days);
      const recentCheckIns = checkIns.filter((c) => c?.check_in_time && new Date(c.check_in_time) >= last30Days);

      const avgPerformance = recentLogs.length > 0 ? recentLogs.reduce((sum, log) => sum + (log.self_grade || 0), 0) / recentLogs.length : 0;
      const coachGradedLogs = logs.filter((l) => l.coach_grade != null);
      const avgCoachGrade = coachGradedLogs.length > 0 ? coachGradedLogs.reduce((sum, log) => sum + (log.coach_grade || 0), 0) / coachGradedLogs.length : 0;

      const lastActivity = Math.max(
        ...logs.filter((l) => l?.date).map((l) => new Date(l.date).getTime()),
        ...checkIns.filter((c) => c?.check_in_time).map((c) => new Date(c.check_in_time).getTime()),
        0
      );

      map[traineeId] = {
        totalTrainingSessions: recentCheckIns.length,
        avgPerformance,
        avgCoachGrade,
        pendingAssignments: traineeAssignments.filter((a) => a.status === "assigned").length,
        submittedAssignments: traineeAssignments.filter((a) => a.status === "submitted").length,
        gradedAssignments: traineeAssignments.filter((a) => a.status === "graded").length,
        videosSubmitted: traineeVideos.length,
        videosNeedingFeedback: traineeVideos.filter((v) => !v.coach_feedback).length,
        latestReport: reports[0],
        latestEval: evals[0],
        daysSinceActivity: lastActivity > 0 ? Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24)) : 999,
        totalHours: recentLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60,
      };
    });
    return map;
  }, [allTrainees, allTrainingLogs, allCheckIns, assignments, videos, progressReports, selfEvaluations]);

  const getTraineeMetrics = (traineeId) => allTraineeMetrics[traineeId] ?? {
    totalTrainingSessions: 0, avgPerformance: 0, avgCoachGrade: 0,
    pendingAssignments: 0, submittedAssignments: 0, gradedAssignments: 0,
    videosSubmitted: 0, videosNeedingFeedback: 0, latestReport: null,
    latestEval: null, daysSinceActivity: 999, totalHours: 0,
  };

  const filteredTrainees = useMemo(() => {
    return toArray(allTrainees)
      .filter((trainee) => {
        if (trainee.role === "admin") return false;
        if (trainee.role === "coach" || trainee.roles?.includes("coach")) return false;

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const name = (trainee.wrestling_name || trainee.full_name || "").toLowerCase();
          const email = (trainee.email || "").toLowerCase();
          const tier = (trainee.tier || "").toLowerCase();
          if (!name.includes(query) && !email.includes(query) && !tier.includes(query)) return false;
        }

        if (filters.showTodayOnly) {
          const checkedInToday = toArray(todayCheckIns).some(c => c.trainee_id === trainee.id);
          if (!checkedInToday) return false;
        }

        if (filters.tier !== "all" && trainee.tier !== filters.tier) {
          return false;
        }

        if (filters.minStreak > 0 && (trainee.streak_count || 0) < filters.minStreak) {
          return false;
        }

        if (filters.riskFlags) {
          const metrics = getTraineeMetrics(trainee.id);
          const isAtRisk = metrics.daysSinceActivity > 7 || (trainee.streak_count || 0) < 2 || metrics.pendingAssignments > 2;
          if (!isAtRisk) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return (a.wrestling_name || a.full_name || "").localeCompare(b.wrestling_name || b.full_name || "");
          case "tier":
            return (a.tier || "T1").localeCompare(b.tier || "T1");
          case "level":
            return (b.level || 0) - (a.level || 0);
          case "streak":
            return (b.streak_count || 0) - (a.streak_count || 0);
          case "performance": {
            const metricsA = getTraineeMetrics(a.id);
            const metricsB = getTraineeMetrics(b.id);
            return metricsB.avgPerformance - metricsA.avgPerformance;
          }
          case "low_performance": {
            const metricsA = getTraineeMetrics(a.id);
            const metricsB = getTraineeMetrics(b.id);
            return metricsA.avgPerformance - metricsB.avgPerformance;
          }
          case "activity": {
            const metricsA = getTraineeMetrics(a.id);
            const metricsB = getTraineeMetrics(b.id);
            return metricsA.daysSinceActivity - metricsB.daysSinceActivity;
          }
          case "needs_review": {
            const metricsA = getTraineeMetrics(a.id);
            const metricsB = getTraineeMetrics(b.id);
            const scoreA = metricsA.videosNeedingFeedback + metricsA.submittedAssignments;
            const scoreB = metricsB.videosNeedingFeedback + metricsB.submittedAssignments;
            return scoreB - scoreA;
          }
          default:
            return 0;
        }
      });
  }, [allTrainees, filters, searchQuery, sortBy, todayCheckIns]);

  const createWorkoutPlanMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutPlan.create({
      ...data,
      coach_id: user.id,
      status: 'active'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      toast.success("Workout plan created!");
    }
  });

  const scheduleSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.DirectMessage.create({
      sender_id: user.id,
      recipient_id: data.trainee_id,
      message: `1-on-1 Session scheduled for ${new Date(data.proposed_date).toLocaleString()}`,
      message_type: 'session_request',
      session_details: {
        proposed_date: data.proposed_date,
        duration_minutes: data.duration_minutes,
        notes: data.notes
      },
      accepted: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDirectMessages'] });
      toast.success("Session request sent!");
    }
  });

  const sendFeedbackMutation = useMutation({
    mutationFn: (data) => base44.entities.DirectMessage.create({
      sender_id: user.id,
      recipient_id: data.trainee_id,
      message: data.feedback,
      message_type: 'feedback',
      accepted: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDirectMessages'] });
      toast.success("Feedback sent!");
    }
  });

  const exportReport = async (traineeId) => {
    try {
      const trainee = toArray(allTrainees).find((t) => t.id === traineeId);
      const res = await base44.entities.TrainingLog.filter({ trainee_id: traineeId }, "-date");
      const logs = toArray(res);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekLogs = logs.filter((l) => l?.date && new Date(l.date) >= weekAgo);

      const header = `PCW Training Report - ${trainee?.wrestling_name || trainee?.full_name || "Trainee"}\n\n`;
      const columns = "Date,Drill Type,Duration (min),Intensity,Self Grade,Coach Grade,Notes\n";
      const rows = weekLogs.map((l) => `${l.date || ""},${l.drill_type || ""},${l.duration_minutes || ""},${l.intensity || ""},${l.self_grade ?? ""},${l.coach_grade ?? "N/A"},"${(l.notes || "").replace(/"/g, '""')}"`).join("\n");

      const csvContent = header + columns + rows;
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trainee?.wrestling_name || trainee?.full_name || "trainee"}_weekly_report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Report exported!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8" style={{ color: "#8b3dff" }} />
                Coach Dashboard
              </h1>
              <p className="text-gray-400 text-sm">Monitor trainee progress and manage training activities.</p>
              </div>
              <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("ShowcaseFeedback"))}
                style={{ borderColor: "#8b3dff", color: "#8b3dff" }}
              >
                Monthly Showcase
              </Button>
              <QRCheckIn user={user} />
              <BroadcastMessage user={user} />
              </div>
          </div>
        </div>

        {/* Critical Metrics - Top Row */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" style={{ color: "#8b3dff" }} />
                Today's Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">{toArray(todayCheckIns).length}</p>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Fundamentals:</span>
                  <span className="font-semibold">{toArray(todayCheckIns).filter(c => c.session_type === 'fundamentals').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Intermediate:</span>
                  <span className="font-semibold">{toArray(todayCheckIns).filter(c => c.session_type === 'intermediate').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advanced:</span>
                  <span className="font-semibold">{toArray(todayCheckIns).filter(c => c.session_type === 'advanced').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <ClipboardList className="w-4 h-4" style={{ color: "#dc2626" }} />
                Assignment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">{assignmentsDue.length}</p>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Due Soon:</span>
                  <span className="font-semibold text-yellow-400">{assignmentsDue.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue:</span>
                  <span className="font-semibold text-red-400">
                    {toArray(assignments).filter(a => a.due_date && new Date(a.due_date) < new Date() && a.status === 'assigned').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Submitted Today:</span>
                  <span className="font-semibold text-green-400">
                    {toArray(assignments).filter(a => a.status === 'submitted' && new Date(a.updated_date).toDateString() === new Date().toDateString()).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Video className="w-4 h-4" style={{ color: "#c0c0c0" }} />
                Video Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">{videosToReview.length}</p>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Awaiting Feedback:</span>
                  <span className="font-semibold">{videosToReview.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Urgent (3+ days):</span>
                  <span className="font-semibold text-red-400">
                    {toArray(videos).filter(v => !v.coach_feedback && ((Date.now() - new Date(v.created_date).getTime()) / (1000 * 60 * 60 * 24)) > 3).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Recent:</span>
                  <span className="font-semibold">
                    {toArray(videos).filter(v => ((Date.now() - new Date(v.created_date).getTime()) / (1000 * 60 * 60 * 24)) <= 1).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" style={{ color: "#f59e0b" }} />
                Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">
                {toArray(allTrainees).filter(t => {
                  const metrics = getTraineeMetrics(t.id);
                  return metrics.daysSinceActivity > 7 || metrics.pendingAssignments > 2 || (t.streak_count || 0) < 2;
                }).length}
              </p>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Inactive 7+ days:</span>
                  <span className="font-semibold text-red-400">
                    {toArray(allTrainees).filter(t => getTraineeMetrics(t.id).daysSinceActivity > 7).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>2+ Overdue Tasks:</span>
                  <span className="font-semibold text-yellow-400">
                    {toArray(allTrainees).filter(t => getTraineeMetrics(t.id).pendingAssignments > 2).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Streak Drop-offs:</span>
                  <span className="font-semibold">
                    {toArray(allTrainees).filter(t => (t.streak_count || 0) < 2).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Smart Filters */}
        <Card className="border-gray-800 mb-8" style={{ background: "#0f0f0f" }}>
          <CardContent className="p-5">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, tier..."
                    className="bg-gray-900 border-gray-700 text-white pl-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-full md:w-56">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A–Z)</SelectItem>
                    <SelectItem value="tier">Tier</SelectItem>
                    <SelectItem value="level">Level (High–Low)</SelectItem>
                    <SelectItem value="streak">Streak (High–Low)</SelectItem>
                    <SelectItem value="performance">Performance (High–Low)</SelectItem>
                    <SelectItem value="low_performance">Lowest Performance</SelectItem>
                    <SelectItem value="activity">Recent Activity</SelectItem>
                    <SelectItem value="needs_review">Needs Coach Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, showTodayOnly: !filters.showTodayOnly })}
                  style={filters.showTodayOnly ? { 
                    background: 'rgba(139, 61, 255, 0.2)', 
                    borderColor: '#8b3dff', 
                    color: '#8b3dff' 
                  } : { borderColor: '#666', color: '#999' }}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Here Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, riskFlags: !filters.riskFlags })}
                  style={filters.riskFlags ? { 
                    background: 'rgba(220, 38, 38, 0.2)', 
                    borderColor: '#dc2626', 
                    color: '#dc2626' 
                  } : { borderColor: '#666', color: '#999' }}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Risk Flags Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 mb-8" style={{ background: "#0f0f0f" }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Unverified Check-Ins ({unverifiedCheckIns.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {unverifiedCheckIns.length > 0 ? (
              <div className="space-y-3">
                {unverifiedCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                  <div>
                    <p className="font-semibold text-white">{checkIn.trainee_name || "Unknown Trainee"}</p>
                    {(() => { const t = toArray(allTrainees).find(t => t.id === checkIn.trainee_id); return t?.wrestling_name && t.wrestling_name !== t.full_name ? <p className="text-xs text-gray-400">{t.full_name}</p> : null; })()}
                    <p className="text-sm text-gray-400">
                      {(checkIn.attendance_date || checkIn.check_in_date)} • {checkIn.session_type?.toString()?.replace(/_/g, ' ') || 'Session'}
                    </p>
                  </div>
                    <Button
                      size="sm"
                      onClick={() => verifyCheckInMutation.mutate(checkIn)}
                      style={{ background: '#10b981' }}
                      disabled={verifyCheckInMutation.isPending}
                    >
                      Verify
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No unverified check-ins</p>
            )}
          </CardContent>
        </Card>

        {/* Today's Check-ins Expandable */}
        <Card className="border-gray-800 mb-8" style={{ background: "#0f0f0f" }}>
          <CardHeader className="cursor-pointer" onClick={() => setShowCheckInsDetails(!showCheckInsDetails)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                Today's Check-Ins ({toArray(todayCheckIns).length})
                {toArray(todayCheckIns).length > 0 && (
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(139, 61, 255, 0.2)', color: '#8b3dff' }}>
                    Live Now
                  </span>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm">
                {showCheckInsDetails ? '▲' : '▼'}
              </Button>
            </div>
          </CardHeader>
          {showCheckInsDetails && (
            <CardContent className="pt-4">
              {toArray(todayCheckIns).length > 0 ? (
                <div className="space-y-3">
                  {toArray(todayCheckIns).map((checkIn) => {
                    const trainee = toArray(allTrainees).find(t => t.id === checkIn.trainee_id);
                    return (
                      <div key={checkIn.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }}>
                            <span className="text-white font-bold text-sm">
                              {checkIn.trainee_name?.toString()?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{checkIn.trainee_name || "Unknown Trainee"}</p>
                              {trainee?.streak_count > 0 && (
                                <span className="text-xs">🔥 {trainee.streak_count}</span>
                              )}
                            </div>
                            {trainee?.wrestling_name && trainee.wrestling_name !== trainee.full_name && (
                              <p className="text-xs text-gray-400">{trainee.full_name}</p>
                            )}
                            <p className="text-sm text-gray-400">
                              {checkIn.tier || "Tier"} • {checkIn.session_type?.toString()?.replace(/_/g, " ") || "Session"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-400">
                              {checkIn.attendance_date || checkIn.check_in_date}
                            </p>
                            <p className="text-xs text-gray-500">
                              {checkIn.verification_status === 'verified' ? 'Verified' : 'Pending'}
                            </p>
                          </div>
                          {checkIn.verification_status !== 'verified' && (
                            <Button
                              size="sm"
                              onClick={() => verifyCheckInMutation.mutate(checkIn)}
                              style={{ background: '#10b981' }}
                              disabled={verifyCheckInMutation.isPending}
                            >
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No check-ins yet today</p>
              )}
            </CardContent>
          )}
        </Card>

        <TraineeFilters filters={filters} onFilterChange={setFilters} tiers={toArray(tiers)} />

        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-white">Trainees ({filteredTrainees.length})</CardTitle>
              <div className="flex gap-2 flex-wrap">
                {compareList.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => compareList.length === 2 ? setShowCompare(true) : toast.error("Select 2 trainees to compare")}
                    style={{
                      background: compareList.length === 2 ? "linear-gradient(135deg, #8b3dff, #dc2626)" : "rgba(139,61,255,0.2)",
                      color: "#fff", borderColor: "#8b3dff"
                    }}
                  >
                    <GitCompare className="w-3.5 h-3.5 mr-1.5" />
                    Compare ({compareList.length}/2)
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  style={viewMode === 'list' ? {
                    background: 'rgba(139, 61, 255, 0.2)',
                    borderColor: '#8b3dff',
                    color: '#8b3dff'
                  } : { borderColor: '#666', color: '#999' }}
                >
                  List View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  style={viewMode === 'cards' ? {
                    background: 'rgba(139, 61, 255, 0.2)',
                    borderColor: '#8b3dff',
                    color: '#8b3dff'
                  } : { borderColor: '#666', color: '#999' }}
                >
                  Card View
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'cards' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTrainees.map((trainee) => {
                  const recentActivity = (() => {
                    const metrics = getTraineeMetrics(trainee.id);
                    if (metrics.daysSinceActivity === 0) return "Active today";
                    if (metrics.daysSinceActivity === 1) return "Active yesterday";
                    if (metrics.daysSinceActivity <= 3) return `Active ${metrics.daysSinceActivity} days ago`;
                    if (metrics.daysSinceActivity <= 7) return "Active this week";
                    return `Last active ${metrics.daysSinceActivity} days ago`;
                  })();

                  return (
                    <TraineeProgressCard
                      key={trainee.id}
                      trainee={trainee}
                      recentActivity={recentActivity}
                      assignments={toArray(assignments)}
                      checkIns={toArray(allCheckIns)}
                      trainingLogs={toArray(allTrainingLogs)}
                      onMessage={(t) => {
                        setMessageTrainee(t);
                        navigate(createPageUrl("DirectMessages"));
                      }}
                    />
                  );
                })}
                {filteredTrainees.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No trainees found matching your filters.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrainees.map((trainee) => {
                const tier = getUserTier(trainee.id);
                const checkedInToday = toArray(todayCheckIns).some((c) => c.trainee_id === trainee.id);
                const metrics = getTraineeMetrics(trainee.id);
                const isExpanded = expandedTrainee === trainee.id;
                const isAtRisk = metrics.daysSinceActivity > 7 || metrics.pendingAssignments > 2;

                return (
                  <div key={trainee.id} className="rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }}>
                            <span className="text-white font-bold">
                              {(trainee.wrestling_name || trainee.full_name || "?").toString().charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{trainee.wrestling_name || trainee.full_name}</h3>
                              {isAtRisk && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                            </div>
                            {trainee.wrestling_name && trainee.wrestling_name !== trainee.full_name && (
                              <p className="text-xs text-gray-400 mb-1">{trainee.full_name}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(139, 61, 255, 0.2)", color: "#8b3dff" }}>{tier}</span>
                              {trainee.streak_count > 0 && <span className="text-sm">🔥 {trainee.streak_count}</span>}
                              {checkedInToday && <span className="text-xs px-2 py-1 rounded bg-green-900 text-green-300">Checked In</span>}
                              {toArray(todayCheckIns).some((c) => c.trainee_id === trainee.id && c.verification_status === 'verified') && <span className="text-xs px-2 py-1 rounded bg-emerald-950 text-emerald-300">Verified</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setExpandedTrainee(isExpanded ? null : trainee.id)} style={{ borderColor: "#666", color: "#999" }}>
                            {isExpanded ? "Hide" : "Details"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTrainee(trainee)} style={{ borderColor: "#8b3dff", color: "#8b3dff" }}>
                            Quick Grade
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toggleCompare(trainee)}
                            style={compareList.find(t => t.id === trainee.id)
                              ? { background: "rgba(139,61,255,0.2)", borderColor: "#8b3dff", color: "#8b3dff" }
                              : { borderColor: "#444", color: "#666" }}>
                            <GitCompare className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => exportReport(trainee.id)} style={{ borderColor: "#c0c0c0", color: "#c0c0c0" }}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                          <div className="flex gap-2 mb-4">
                            <WorkoutPlanModal 
                              trainee={trainee} 
                              onSave={(data) => createWorkoutPlanMutation.mutate(data)}
                            />
                            <SessionScheduler
                              trainee={trainee}
                              onSchedule={(data) => scheduleSessionMutation.mutate(data)}
                            />
                            <FeedbackModal
                              trainee={trainee}
                              recentLogs={toArray(allTrainingLogs).filter(l => l.trainee_id === trainee.id).slice(0, 10)}
                              onSendFeedback={(data) => sendFeedbackMutation.mutate(data)}
                            />
                          </div>

                          <PerformanceMetrics
                            trainee={trainee}
                            logs={toArray(allTrainingLogs).filter(l => l.trainee_id === trainee.id)}
                            checkIns={toArray(allCheckIns).filter(c => c.trainee_id === trainee.id)}
                            assignments={toArray(assignments).filter(a => a.trainee_id === trainee.id)}
                          />

                          <h4 className="text-sm font-semibold text-gray-400 mb-3">📊 Detailed Breakdown</h4>
                          <div className="grid md:grid-cols-4 gap-4 mb-4">
                            <div className="p-3 rounded-lg border border-gray-800" style={{ background: "#0f0f0f" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4" style={{ color: "#8b3dff" }} />
                                <p className="text-xs text-gray-400">Sessions (30d)</p>
                              </div>
                              <p className="text-2xl font-bold text-white">{metrics.totalTrainingSessions}</p>
                              <p className="text-xs text-gray-500">{metrics.totalHours.toFixed(1)}h total</p>
                            </div>

                            <div className="p-3 rounded-lg border border-gray-800" style={{ background: "#0f0f0f" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <Target className="w-4 h-4" style={{ color: metrics.avgPerformance >= 7 ? "#10b981" : "#dc2626" }} />
                                <p className="text-xs text-gray-400">Avg Performance</p>
                              </div>
                              <p className="text-2xl font-bold text-white">{metrics.avgPerformance > 0 ? metrics.avgPerformance.toFixed(1) : "N/A"}</p>
                              {metrics.avgCoachGrade > 0 && <p className="text-xs text-gray-500">Coach: {metrics.avgCoachGrade.toFixed(1)}</p>}
                            </div>

                            <div className="p-3 rounded-lg border border-gray-800" style={{ background: "#0f0f0f" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <ClipboardList className="w-4 h-4" style={{ color: "#c0c0c0" }} />
                                <p className="text-xs text-gray-400">Assignments</p>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-white">{metrics.pendingAssignments}</p>
                                <p className="text-xs text-gray-500">pending</p>
                              </div>
                              <p className="text-xs text-gray-500">{metrics.submittedAssignments} submitted • {metrics.gradedAssignments} graded</p>
                            </div>

                            <div className="p-3 rounded-lg border border-gray-800" style={{ background: "#0f0f0f" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <Video className="w-4 h-4" style={{ color: "#8b3dff" }} />
                                <p className="text-xs text-gray-400">Videos</p>
                              </div>
                              <p className="text-2xl font-bold text-white">{metrics.videosSubmitted}</p>
                              {metrics.videosNeedingFeedback > 0 && <p className="text-xs text-yellow-400">{metrics.videosNeedingFeedback} need feedback</p>}
                            </div>
                          </div>

                          <h4 className="text-sm font-semibold text-gray-400 mb-3 mt-4">📋 Recent Evaluations</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {metrics.latestReport && (
                              <div className="p-3 rounded-lg border border-gray-800" style={{ background: "#0f0f0f" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="w-4 h-4" style={{ color: "#8b3dff" }} />
                                  <p className="text-xs text-gray-400">Latest Progress Report</p>
                                </div>
                                <p className="text-sm text-white mb-1">Grade: {metrics.latestReport?.overall_grade ?? "N/A"}</p>
                                <p className="text-xs text-gray-500">
                                  {metrics.latestReport?.report_date ? new Date(metrics.latestReport.report_date).toLocaleDateString() : ""}
                                </p>
                              </div>
                            )}

                            {metrics.latestEval && (
                              <div className="p-3 rounded-lg border border-gray-800" style={{ background: "#0f0f0f" }}>
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4" style={{ color: "#c0c0c0" }} />
                                  <p className="text-xs text-gray-400">Latest Self-Eval</p>
                                </div>
                                <p className="text-sm text-white mb-1">
                                  Cardio: {metrics.latestEval?.cardio_rating ? `${metrics.latestEval.cardio_rating}/10` : "N/A"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {metrics.latestEval?.session_date ? new Date(metrics.latestEval.session_date).toLocaleDateString() : ""}
                                </p>
                              </div>
                            )}
                          </div>

                          {metrics.daysSinceActivity > 7 && (
                            <div className="mt-4 p-3 rounded-lg border border-yellow-800 bg-yellow-900/20">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <p className="text-sm text-yellow-300">No activity for {metrics.daysSinceActivity} days</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

                {filteredTrainees.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No trainees found matching your filters.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedTrainee && <QuickGradeModal trainee={selectedTrainee} onClose={() => setSelectedTrainee(null)} />}
      {showCompare && compareList.length === 2 && (
        <TraineeCompareModal
          trainees={compareList}
          metricsMap={allTraineeMetrics}
          onClose={() => { setShowCompare(false); setCompareList([]); }}
        />
      )}
    </div>
  );
}