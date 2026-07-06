import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Target, Activity, Award } from "lucide-react";

export default function PerformanceMetrics({ trainee, logs = [], checkIns = [], assignments = [] }) {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const recentLogs = logs.filter(log => new Date(log.date) >= last30Days);
  const recentCheckIns = checkIns.filter(ci => new Date(ci.check_in_date) >= last30Days);

  const avgScore = recentLogs.length > 0
    ? recentLogs.reduce((sum, log) => sum + (log.self_grade || 0), 0) / recentLogs.length
    : 0;

  const totalHours = recentLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;

  const assignmentStats = {
    total: assignments.length,
    completed: assignments.filter(a => a.status === 'graded').length,
    pending: assignments.filter(a => a.status === 'assigned').length,
    avgGrade: assignments.filter(a => a.grade).length > 0
      ? assignments.filter(a => a.grade).reduce((sum, a) => sum + a.grade, 0) / assignments.filter(a => a.grade).length
      : 0
  };

  // Calculate trend (compare first half vs second half of period)
  const midPoint = new Date(last30Days.getTime() + (new Date().getTime() - last30Days.getTime()) / 2);
  const firstHalf = recentLogs.filter(log => new Date(log.date) < midPoint);
  const secondHalf = recentLogs.filter(log => new Date(log.date) >= midPoint);

  const firstHalfAvg = firstHalf.length > 0
    ? firstHalf.reduce((sum, log) => sum + (log.self_grade || 0), 0) / firstHalf.length
    : 0;
  const secondHalfAvg = secondHalf.length > 0
    ? secondHalf.reduce((sum, log) => sum + (log.self_grade || 0), 0) / secondHalf.length
    : 0;

  const trend = secondHalfAvg - firstHalfAvg;

  const getTrendIcon = () => {
    if (trend > 0.5) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend < -0.5) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <Card className="border-gray-800" style={{ background: '#0a0a0a' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Performance</p>
            {getTrendIcon()}
          </div>
          <p className="text-2xl font-bold text-white">{avgScore.toFixed(1)}/10</p>
          <p className="text-xs text-gray-500">Avg self-score (30d)</p>
        </CardContent>
      </Card>

      <Card className="border-gray-800" style={{ background: '#0a0a0a' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Activity</p>
            <Activity className="w-4 h-4" style={{ color: '#8b3dff' }} />
          </div>
          <p className="text-2xl font-bold text-white">{recentCheckIns.length}</p>
          <p className="text-xs text-gray-500">{totalHours.toFixed(1)}h logged</p>
        </CardContent>
      </Card>

      <Card className="border-gray-800" style={{ background: '#0a0a0a' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Assignments</p>
            <Award className="w-4 h-4" style={{ color: '#dc2626' }} />
          </div>
          <p className="text-2xl font-bold text-white">{assignmentStats.completed}/{assignmentStats.total}</p>
          <p className="text-xs text-gray-500">
            {assignmentStats.avgGrade > 0 ? `Avg: ${assignmentStats.avgGrade.toFixed(1)}/10` : 'No grades yet'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}