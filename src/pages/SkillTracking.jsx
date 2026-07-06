import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Plus, Calendar, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

const drillTypes = [
  { value: 'chain_wrestling', label: 'Chain Wrestling' },
  { value: 'bumps', label: 'Bumps' },
  { value: 'promos', label: 'Promos' },
  { value: 'strikes', label: 'Strikes' },
  { value: 'character_work', label: 'Character Work' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'strength', label: 'Strength Training' },
  { value: 'match_psychology', label: 'Match Psychology' },
  { value: 'aerial_moves', label: 'Aerial Moves' },
  { value: 'submission_holds', label: 'Submission Holds' },
  { value: 'selling', label: 'Selling' },
  { value: 'ring_awareness', label: 'Ring Awareness' },
];

export default function SkillTracking() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    drill_type: '',
    duration_minutes: '',
    intensity: 'moderate',
    self_grade: 5,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: trainingLogs = [] } = useQuery({
    queryKey: ['trainingLogs', user?.id],
    queryFn: async () => {
      const res = await base44.entities.TrainingLog.filter({ trainee_id: user.id }, '-date');
      return toArray(res);
    },
    enabled: !!user,
    initialData: [],
  });

  const emptyForm = {
    drill_type: '',
    duration_minutes: '',
    intensity: 'moderate',
    self_grade: 5,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  };

  const createLogMutation = useMutation({
    mutationFn: (logData) => base44.entities.TrainingLog.create({
      ...logData,
      trainee_id: user.id
    }),
    onMutate: async (logData) => {
      await queryClient.cancelQueries({ queryKey: ['trainingLogs', user?.id] });
      const prev = queryClient.getQueryData(['trainingLogs', user?.id]);
      const optimistic = {
        id: `temp-${Date.now()}`,
        ...logData,
        trainee_id: user?.id,
      };
      queryClient.setQueryData(['trainingLogs', user?.id], (old) => [
        optimistic,
        ...(old || []),
      ]);
      setShowForm(false);
      setFormData(emptyForm);
      toast.success("Training log added!");
      return { prev };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(['trainingLogs', user?.id], ctx.prev);
      }
      toast.error("Failed to save training log");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingLogs'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createLogMutation.mutate(formData);
  };

  // Calculate stats
  const totalHours = trainingLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;
  const avgScore = trainingLogs.length > 0 
    ? trainingLogs.reduce((sum, log) => sum + (log.self_grade || 0), 0) / trainingLogs.length 
    : 0;

  // Drill type breakdown
  const drillBreakdown = {};
  trainingLogs.forEach(log => {
    if (log.drill_type) {
      drillBreakdown[log.drill_type] = (drillBreakdown[log.drill_type] || 0) + 1;
    }
  });

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8" style={{ color: '#8b3dff' }} />
              Skill Tracking
            </h1>
            <p className="text-gray-400">Log your training sessions and track your progress</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} style={{ background: '#8b3dff' }}>
            <Plus className="w-4 h-4 mr-2" />
            Log Training
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: '#8b3dff' }} />
                Total Training
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{totalHours.toFixed(1)}h</p>
              <p className="text-sm text-gray-400 mt-1">{trainingLogs.length} sessions logged</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: '#dc2626' }} />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{avgScore.toFixed(1)}/10</p>
              <p className="text-sm text-gray-400 mt-1">Self-assessment</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" style={{ color: '#c0c0c0' }} />
                Most Practiced
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {Object.keys(drillBreakdown).length > 0 
                  ? Object.entries(drillBreakdown).sort((a, b) => b[1] - a[1])[0][0]
                      .replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  : 'N/A'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {Object.keys(drillBreakdown).length > 0 
                  ? `${Object.entries(drillBreakdown).sort((a, b) => b[1] - a[1])[0][1]} sessions`
                  : 'No data yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-gray-800 mb-8" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white">Log Training Session</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Drill Type *</Label>
                    <Select 
                      value={formData.drill_type}
                      onValueChange={(value) => setFormData({ ...formData, drill_type: value })}
                      required
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Select drill type" />
                      </SelectTrigger>
                      <SelectContent>
                        {drillTypes.map(drill => (
                          <SelectItem key={drill.value} value={drill.value}>
                            {drill.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Date *</Label>
                    <Input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Duration (minutes) *</Label>
                    <Input 
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="60"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Intensity</Label>
                    <Select 
                      value={formData.intensity}
                      onValueChange={(value) => setFormData({ ...formData, intensity: value })}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="intense">Intense</SelectItem>
                        <SelectItem value="maximum">Maximum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-gray-300">Self Grade (1-10)</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        type="range"
                        min="1"
                        max="10"
                        value={formData.self_grade}
                        onChange={(e) => setFormData({ ...formData, self_grade: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-2xl font-bold text-white w-12 text-center">
                        {formData.self_grade}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-gray-300">Notes</Label>
                    <Textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white h-24"
                      placeholder="How did it go? What did you learn?"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                          style={{ borderColor: '#666', color: '#999' }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLogMutation.isPending}
                          style={{ background: '#8b3dff' }}>
                    {createLogMutation.isPending ? 'Saving...' : 'Save Log'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Training History */}
        <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <CardTitle className="text-white">Training History</CardTitle>
          </CardHeader>
          <CardContent>
            {trainingLogs.length > 0 ? (
              <div className="space-y-3">
                {trainingLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-lg border border-gray-800"
                       style={{ background: '#0a0a0a' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">
                            {log.drill_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <span className="px-2 py-1 rounded text-xs font-medium"
                                style={{ 
                                  background: log.intensity === 'maximum' ? 'rgba(220, 38, 38, 0.2)' : 
                                             log.intensity === 'intense' ? 'rgba(139, 61, 255, 0.2)' : 
                                             'rgba(192, 192, 192, 0.2)',
                                  color: log.intensity === 'maximum' ? '#dc2626' : 
                                        log.intensity === 'intense' ? '#8b3dff' : '#c0c0c0'
                                }}>
                            {log.intensity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">
                          {log.duration_minutes} minutes • {new Date(log.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        {log.notes && <p className="text-sm text-gray-300 mt-2">{log.notes}</p>}
                        {log.coach_feedback && (
                          <div className="mt-2 p-2 rounded border border-gray-700" style={{ background: '#0f0f0f' }}>
                            <p className="text-xs font-semibold" style={{ color: '#8b3dff' }}>Coach Feedback:</p>
                            <p className="text-sm text-gray-300">{log.coach_feedback}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-3xl font-bold" 
                           style={{ color: log.self_grade >= 7 ? '#8b3dff' : log.self_grade >= 5 ? '#c0c0c0' : '#dc2626' }}>
                          {log.self_grade}
                        </p>
                        <p className="text-xs text-gray-500">/ 10</p>
                        {log.coach_grade && (
                          <p className="text-sm text-gray-400 mt-2">Coach: {log.coach_grade}/10</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No training logs yet. Start tracking your progress!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}