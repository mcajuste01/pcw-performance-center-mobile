import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, Target, Calendar } from 'lucide-react';

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: trainingLogs = [] } = useQuery({
    queryKey: ['analyticsLogs', user?.id],
    queryFn: async () => {
      const res = await base44.entities.TrainingLog.filter({ trainee_id: user.id }, '-date', 100);
      return toArray(res);
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['analyticsCheckIns', user?.id],
    queryFn: async () => {
      const res = await base44.entities.CheckIn.filter({ trainee_id: user.id }, '-check_in_time', 100);
      return toArray(res);
    },
    enabled: !!user,
    initialData: [],
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

  const filteredLogs = trainingLogs.filter(log => 
    log.date && new Date(log.date) >= cutoffDate
  );

  const filteredCheckIns = checkIns.filter(checkIn =>
    checkIn.check_in_time && new Date(checkIn.check_in_time) >= cutoffDate
  );

  // Drill type distribution
  const drillDistribution = {};
  filteredLogs.forEach(log => {
    const type = log.drill_type || 'other';
    drillDistribution[type] = (drillDistribution[type] || 0) + 1;
  });

  const drillData = Object.entries(drillDistribution).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));

  // Performance over time
  const performanceTrend = [];
  const days = parseInt(timeRange);
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = filteredLogs.filter(log => log.date === dateStr);
    const avgScore = dayLogs.length > 0
      ? dayLogs.reduce((sum, log) => sum + (log.self_grade || 0), 0) / dayLogs.length
      : null;
    
    if (avgScore !== null) {
      performanceTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: parseFloat(avgScore.toFixed(1)),
      });
    }
  }

  // Training frequency by session type
  const sessionTypes = {};
  filteredCheckIns.forEach(checkIn => {
    const type = checkIn.session_type || 'other';
    sessionTypes[type] = (sessionTypes[type] || 0) + 1;
  });

  const sessionData = Object.entries(sessionTypes).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    sessions: value,
  }));

  const COLORS = ['#8b3dff', '#dc2626', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8" style={{ color: '#8b3dff' }} />
              Training Analytics
            </h1>
            <p className="text-gray-400">Detailed insights into your performance</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Performance Trend */}
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: '#8b3dff' }} />
                Performance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#999" fontSize={12} />
                  <YAxis stroke="#999" domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8b3dff" strokeWidth={2} dot={{ fill: '#8b3dff' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Session Types */}
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: '#dc2626' }} />
                Training Sessions by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#999" fontSize={10} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#999" />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="sessions" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Drill Type Distribution */}
        <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: '#10b981' }} />
              Training Focus Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={drillData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {drillData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {drillData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded"
                       style={{ background: '#0a0a0a' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ background: COLORS[index % COLORS.length] }} />
                      <span className="text-sm text-white">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-400">{item.value} sessions</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}