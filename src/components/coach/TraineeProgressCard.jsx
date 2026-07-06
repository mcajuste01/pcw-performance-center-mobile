import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
} from "lucide-react";

export default function TraineeProgressCard({
  trainee,
  recentActivity,
  assignments,
  checkIns,
  trainingLogs,
  onMessage,
}) {
  const last30Days = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();

  const recentCheckIns = checkIns.filter(
    c => c.trainee_id === trainee.id && new Date(c.check_in_time) >= last30Days
  );

  const recentLogs = trainingLogs.filter(
    l => l.trainee_id === trainee.id && l.date && new Date(l.date) >= last30Days
  );

  const traineeAssignments = assignments.filter(a => a.trainee_id === trainee.id);
  const pending = traineeAssignments.filter(a => a.status === 'assigned').length;
  const overdue = traineeAssignments.filter(a => 
    a.status === 'assigned' && a.due_date && new Date(a.due_date) < new Date()
  ).length;

  const avgScore = recentLogs.length > 0
    ? (recentLogs.reduce((sum, l) => sum + (l.self_grade || 0), 0) / recentLogs.length).toFixed(1)
    : 'N/A';

  const totalHours = (recentLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60).toFixed(1);

  const isActive = recentCheckIns.length >= 8; // At least 2x/week
  const needsAttention = overdue > 0 || recentCheckIns.length < 4;

  const getTrendIcon = () => {
    if (recentCheckIns.length >= 8) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (recentCheckIns.length < 4) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Activity className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <Card 
      className="border-gray-800 hover:border-purple-500/50 transition-all"
      style={{ background: '#0f0f0f' }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)' }}>
              <span className="text-white font-bold">
                {(trainee.wrestling_name || trainee.full_name || '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <CardTitle className="text-white text-lg">
                {trainee.wrestling_name || trainee.full_name}
              </CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge className="bg-purple-900 text-purple-300 text-xs">
                  {trainee.tier || 'T1'}
                </Badge>
                {needsAttention && (
                  <Badge className="bg-red-900 text-red-300 text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Needs Attention
                  </Badge>
                )}
                {isActive && !needsAttention && (
                  <Badge className="bg-green-900 text-green-300 text-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMessage(trainee)}
            style={{ borderColor: '#8b3dff', color: '#8b3dff' }}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg border border-gray-800" style={{ background: '#0a0a0a' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              {getTrendIcon()}
              <p className="text-xs text-gray-400">Sessions</p>
            </div>
            <p className="text-xl font-bold text-white">{recentCheckIns.length}</p>
            <p className="text-xs text-gray-500">last 30d</p>
          </div>
          
          <div className="text-center p-2 rounded-lg border border-gray-800" style={{ background: '#0a0a0a' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-gray-400">Hours</p>
            </div>
            <p className="text-xl font-bold text-white">{totalHours}</p>
            <p className="text-xs text-gray-500">training</p>
          </div>
          
          <div className="text-center p-2 rounded-lg border border-gray-800" style={{ background: '#0a0a0a' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-green-400" />
              <p className="text-xs text-gray-400">Score</p>
            </div>
            <p className="text-xl font-bold text-white">{avgScore}</p>
            <p className="text-xs text-gray-500">avg</p>
          </div>
        </div>

        {/* Assignments Status */}
        <div className="p-3 rounded-lg border border-gray-800" style={{ background: '#0a0a0a' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-300">Assignments</p>
            <Link to={createPageUrl("Assignments")}>
              <Button variant="ghost" size="sm" className="text-xs text-purple-400 h-6 px-2">
                View All
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Pending:</span>
            <span className="text-white font-semibold">{pending}</span>
          </div>
          {overdue > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Overdue:
              </span>
              <span className="text-red-400 font-semibold">{overdue}</span>
            </div>
          )}
        </div>

        {/* Recent Activity Summary */}
        {recentActivity && (
          <div className="p-3 rounded-lg border border-gray-800" style={{ background: '#0a0a0a' }}>
            <p className="text-xs font-medium text-gray-400 mb-2">Recent Activity</p>
            <p className="text-xs text-gray-300">{recentActivity}</p>
          </div>
        )}

        {/* Streak */}
        {trainee.streak_count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-2xl">🔥</span>
            <span className="text-gray-300">{trainee.streak_count} day streak</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}