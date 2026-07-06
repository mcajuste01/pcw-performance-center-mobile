import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Activity, Target, Award } from "lucide-react";
import { format, subDays } from "date-fns";

export default function PerformanceMetrics({ 
  trainingLogs = [], 
  checkIns = [], 
  assignments = [] 
}) {
  // Prepare attendance data (last 30 days)
  const attendanceData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const count = checkIns.filter(c => {
      const checkInDate = format(new Date(c.check_in_date || c.check_in_time), "yyyy-MM-dd");
      return checkInDate === dateStr;
    }).length;
    return {
      date: format(date, "MMM d"),
      sessions: count,
    };
  });

  // Prepare score progression data
  const scoreData = trainingLogs
    .filter(l => l.self_grade || l.coach_grade)
    .slice(0, 20)
    .reverse()
    .map((l, i) => ({
      session: i + 1,
      selfScore: l.self_grade || 0,
      coachScore: l.coach_grade || 0,
    }));

  // Assignment grades data
  const gradeData = assignments
    .filter(a => a.grade)
    .slice(0, 10)
    .reverse()
    .map((a, i) => ({
      assignment: i + 1,
      grade: a.grade,
      title: a.title?.substring(0, 15) + "...",
    }));

  // Skills radar data
  const drillTypes = ["chain_wrestling", "bumps", "promos", "strikes", "conditioning"];
  const skillsData = drillTypes.map(type => {
    const drillLogs = trainingLogs.filter(l => l.drill_type === type);
    const avgScore = drillLogs.length > 0
      ? drillLogs.reduce((sum, l) => sum + (l.coach_grade || l.self_grade || 0), 0) / drillLogs.length
      : 0;
    return {
      skill: type.replace(/_/g, " "),
      score: Math.round(avgScore * 10),
      fullMark: 100,
    };
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Attendance Chart */}
      <Card className="border-gray-800 bg-[#0b0b0b]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            Attendance (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b3dff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b3dff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} />
              <YAxis stroke="#666" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#8b3dff"
                fillOpacity={1}
                fill="url(#attendanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score Progression */}
      <Card className="border-gray-800 bg-[#0b0b0b]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Score Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="session" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} domain={[0, 10]} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
              />
              <Line type="monotone" dataKey="selfScore" stroke="#8b3dff" strokeWidth={2} dot={false} name="Self Score" />
              <Line type="monotone" dataKey="coachScore" stroke="#dc2626" strokeWidth={2} dot={false} name="Coach Score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Assignment Grades */}
      <Card className="border-gray-800 bg-[#0b0b0b]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-400" />
            Assignment Grades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="assignment" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} domain={[0, 10]} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
              />
              <Bar dataKey="grade" fill="#8b3dff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Skills Radar */}
      <Card className="border-gray-800 bg-[#0b0b0b]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            Skill Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={skillsData}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="skill" stroke="#666" fontSize={10} />
              <PolarRadiusAxis stroke="#666" fontSize={8} />
              <Radar
                name="Skills"
                dataKey="score"
                stroke="#8b3dff"
                fill="#8b3dff"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}