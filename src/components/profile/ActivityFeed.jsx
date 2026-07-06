import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  Dumbbell,
  ClipboardCheck,
  FileText,
  Star,
  Calendar,
} from "lucide-react";

export default function ActivityFeed({
  trainingLogs = [],
  checkIns = [],
  assignments = [],
}) {
  // Combine all activities into a single feed
  const activities = [];

  // Add check-ins
  checkIns.slice(0, 10).forEach((c) => {
    activities.push({
      type: "checkin",
      date: c.check_in_time || c.check_in_date,
      title: "Checked in",
      subtitle: `${c.session_type || "Training"} session`,
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      xp: c.xp_awarded,
    });
  });

  // Add training logs
  trainingLogs.slice(0, 10).forEach((l) => {
    activities.push({
      type: "training",
      date: l.date,
      title: `Logged ${l.drill_type?.replace(/_/g, " ") || "training"}`,
      subtitle: l.duration_minutes ? `${l.duration_minutes} min • ${l.intensity || "moderate"}` : null,
      icon: Dumbbell,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      score: l.self_grade || l.coach_grade,
    });
  });

  // Add assignments
  assignments.slice(0, 10).forEach((a) => {
    if (a.status === "submitted" || a.status === "graded") {
      activities.push({
        type: "assignment",
        date: a.updated_date || a.created_date,
        title: a.status === "graded" ? "Assignment graded" : "Assignment submitted",
        subtitle: a.title,
        icon: a.status === "graded" ? Star : ClipboardCheck,
        color: a.status === "graded" ? "text-yellow-400" : "text-purple-400",
        bgColor: a.status === "graded" ? "bg-yellow-500/10" : "bg-purple-500/10",
        grade: a.grade,
      });
    }
  });

  // Sort by date (newest first)
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Take top 15
  const recentActivities = activities.slice(0, 15);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <Card className="border-gray-800 bg-[#050505]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No recent activity yet</p>
            <p className="text-sm">Check in to a session to get started!</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    {activity.subtitle && (
                      <p className="text-xs text-gray-400 truncate">{activity.subtitle}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {activity.xp && (
                      <span className="text-xs text-green-400 font-medium">+{activity.xp} XP</span>
                    )}
                    {activity.score && (
                      <span className="text-xs text-blue-400 font-medium">Score: {activity.score}/10</span>
                    )}
                    {activity.grade && (
                      <span className="text-xs text-yellow-400 font-medium">Grade: {activity.grade}/10</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}