import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Flame, Target, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState('overall');
  const [tierFilter, setTierFilter] = useState('all');

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

  const { data: trainees = [] } = useQuery({
    queryKey: ['leaderboardTrainees'],
    queryFn: async () => {
      const res = await base44.entities.User.list();
      return toArray(res).filter(u => !u.roles?.includes('coach') && !u.roles?.includes('admin'));
    },
    initialData: [],
  });

  const { data: trainingLogs = [] } = useQuery({
    queryKey: ['leaderboardLogs'],
    queryFn: async () => {
      const res = await base44.entities.TrainingLog.list('-date');
      return toArray(res);
    },
    initialData: [],
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['leaderboardCheckIns'],
    queryFn: async () => {
      const res = await base44.entities.CheckIn.list('-check_in_time');
      return toArray(res);
    },
    initialData: [],
  });

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const getTraineeScore = (trainee) => {
    const logs = trainingLogs.filter(l => l.trainee_id === trainee.id && new Date(l.date) >= last30Days);
    const checks = checkIns.filter(c => c.trainee_id === trainee.id && new Date(c.check_in_time) >= last30Days);
    
    switch (category) {
      case 'attendance':
        return checks.length;
      case 'performance':
        return logs.length > 0 ? logs.reduce((sum, l) => sum + (l.self_grade || 0), 0) / logs.length : 0;
      case 'hours':
        return logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60;
      case 'streak':
        return trainee.streak_count || 0;
      case 'overall':
      default:
        const score = (checks.length * 10) + (trainee.streak_count || 0) * 5 + (trainee.level || 0) * 2;
        return score;
    }
  };

  const filteredTrainees = trainees
    .filter(t => tierFilter === 'all' || t.tier === tierFilter)
    .map(trainee => ({
      ...trainee,
      score: getTraineeScore(trainee)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const getMedalIcon = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return null;
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'attendance': return <Target className="w-5 h-5" style={{ color: '#8b3dff' }} />;
      case 'performance': return <TrendingUp className="w-5 h-5" style={{ color: '#10b981' }} />;
      case 'hours': return <Flame className="w-5 h-5" style={{ color: '#dc2626' }} />;
      case 'streak': return <Flame className="w-5 h-5" style={{ color: '#f59e0b' }} />;
      default: return <Trophy className="w-5 h-5" style={{ color: '#fbbf24' }} />;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'attendance': return 'Sessions';
      case 'performance': return 'Avg Score';
      case 'hours': return 'Hours';
      case 'streak': return 'Days';
      default: return 'Points';
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8" style={{ color: '#fbbf24' }} />
            Leaderboard
          </h1>
          <p className="text-gray-400">See where you rank among trainees</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Ranking</SelectItem>
              <SelectItem value="attendance">Most Sessions (30d)</SelectItem>
              <SelectItem value="performance">Highest Performance</SelectItem>
              <SelectItem value="hours">Most Training Hours</SelectItem>
              <SelectItem value="streak">Longest Streak</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="T1">Tier 1</SelectItem>
              <SelectItem value="T2">Tier 2</SelectItem>
              <SelectItem value="T3">Tier 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {getCategoryIcon()}
              Top {filteredTrainees.length} Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredTrainees.map((trainee, index) => {
                const medal = getMedalIcon(index);
                const isCurrentUser = trainee.id === user?.id;
                
                return (
                  <div
                    key={trainee.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      isCurrentUser ? 'border-purple-500 bg-purple-900/10' : 'border-gray-800'
                    }`}
                    style={{ background: isCurrentUser ? 'rgba(139, 61, 255, 0.05)' : '#0a0a0a' }}
                  >
                    <div className="w-12 text-center">
                      {medal ? (
                        <span className="text-3xl">{medal}</span>
                      ) : (
                        <span className="text-xl font-bold text-gray-500">#{index + 1}</span>
                      )}
                    </div>

                    <div className="w-12 h-12 rounded-full flex items-center justify-center"
                         style={{ background: 'linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)' }}>
                      <span className="text-white font-bold">
                        {(trainee.wrestling_name || trainee.full_name || '?')[0].toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">
                          {trainee.wrestling_name || trainee.full_name}
                        </p>
                        {isCurrentUser && (
                          <Badge className="bg-purple-900 text-purple-300 text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-gray-800 text-gray-300 text-xs">
                          {trainee.tier || 'T1'}
                        </Badge>
                        {trainee.streak_count > 0 && (
                          <span className="text-xs text-gray-500">🔥 {trainee.streak_count}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {category === 'performance' ? trainee.score.toFixed(1) : Math.round(trainee.score)}
                      </p>
                      <p className="text-xs text-gray-500">{getCategoryLabel()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}