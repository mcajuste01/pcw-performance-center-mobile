import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  CheckCircle,
  Star,
} from "lucide-react";

export default function ProfileStats({ 
  trainingLogs = [], 
  checkIns = [], 
  assignments = [],
  streak = 0,
  level = 1,
  xp = 0,
}) {
  // Calculate total training hours (all time)
  const totalHours = trainingLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60;
  
  // Calculate average score
  const logsWithGrades = trainingLogs.filter(l => l.self_grade || l.coach_grade);
  const avgScore = logsWithGrades.length > 0
    ? logsWithGrades.reduce((sum, l) => sum + (l.coach_grade || l.self_grade || 0), 0) / logsWithGrades.length
    : 0;

  // Completed assignments
  const completedAssignments = assignments.filter(a => a.status === "graded" || a.status === "submitted").length;
  const totalAssignments = assignments.length;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  // XP to next level
  const xpForNextLevel = level * 500;
  const xpProgress = xp > 0 ? (xp % xpForNextLevel) / xpForNextLevel * 100 : 0;

  // Recent achievements (simulated based on data)
  const achievements = [];
  if (checkIns.length >= 10) achievements.push({ name: "10 Check-ins", icon: CheckCircle, color: "text-green-400" });
  if (totalHours >= 10) achievements.push({ name: "10+ Hours", icon: Clock, color: "text-blue-400" });
  if (streak >= 5) achievements.push({ name: "5 Day Streak", icon: Flame, color: "text-orange-400" });
  if (completedAssignments >= 5) achievements.push({ name: "5 Assignments Done", icon: Target, color: "text-purple-400" });
  if (avgScore >= 8) achievements.push({ name: "High Performer", icon: Star, color: "text-yellow-400" });

  const stats = [
    {
      label: "Total Training",
      value: `${totalHours.toFixed(1)}h`,
      subtext: `${checkIns.length} sessions`,
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Current Streak",
      value: streak,
      subtext: "consecutive days",
      icon: Flame,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Avg Performance",
      value: avgScore > 0 ? avgScore.toFixed(1) : "N/A",
      subtext: `${logsWithGrades.length} graded sessions`,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Assignments",
      value: `${completedAssignments}/${totalAssignments}`,
      subtext: `${completionRate.toFixed(0)}% complete`,
      icon: Target,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Level & XP Bar */}
      <Card className="border-gray-800 bg-gradient-to-r from-purple-900/20 to-red-900/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Level</p>
                <p className="text-2xl font-bold text-white">Level {level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">XP Progress</p>
              <p className="text-lg font-semibold text-purple-400">{xp % xpForNextLevel} / {xpForNextLevel}</p>
            </div>
          </div>
          <Progress value={xpProgress} className="h-2 bg-gray-800" />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <Card key={i} className="border-gray-800 bg-[#0b0b0b]">
            <CardContent className="pt-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="border-gray-800 bg-[#0b0b0b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {achievements.map((ach, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-800/50 border border-gray-700"
                >
                  <ach.icon className={`w-4 h-4 ${ach.color}`} />
                  <span className="text-sm text-white">{ach.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}