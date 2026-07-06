import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Zap, Flame, Trophy, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";

const XP_LEVELS = [0, 150, 400, 800, 1300, 1900, 2600, 3400, 4300, 5300];

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

export default function CheckIn() {
  const [user, setUser] = useState(null);
  const [sessionType, setSessionType] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isChecking, setIsChecking] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationData, setEvaluationData] = useState({
    what_learned: '',
    difficult_drill: '',
    want_to_improve: '',
    cardio_rating: 5,
    felt_safe: true,
    felt_consistent: true,
    additional_notes: ''
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

  const { data: todayCheckIns = [] } = useQuery({
    queryKey: ['todayCheckIns', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await base44.entities.CheckIn.filter({ trainee_id: user.id });
      const checkIns = toArray(res);
      return checkIns.filter(c => c.check_in_time?.startsWith(today));
    },
    enabled: !!user,
    initialData: [],
  });

  const calculateXPForCheckIn = (currentStreak) => {
    let baseXP = 20;
    const streakBonus = Math.min(currentStreak * 5, 50);
    return baseXP + streakBonus;
  };

  const calculateNewStreak = (lastCheckIn) => {
    if (!lastCheckIn) return 1;
    
    const now = new Date();
    const last = new Date(lastCheckIn);
    const hoursDiff = (now - last) / (1000 * 60 * 60);
    
    if (hoursDiff <= 36) {
      return (user.streak_count || 0) + 1;
    }
    return 1;
  };

  const calculateLevel = (xp) => {
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (xp >= XP_LEVELS[i]) {
        return i + 1;
      }
    }
    return 1;
  };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const newStreak = calculateNewStreak(user.last_check_in);
      const xpAwarded = calculateXPForCheckIn(newStreak);
      const newXP = (user.xp || 0) + xpAwarded;
      const newLevel = calculateLevel(newXP);
      
      const checkIn = await base44.entities.CheckIn.create({
        trainee_id: user.id,
        trainee_name: user.wrestling_name || user.full_name,
        tier: user.tier || 'T1',
        session_type: sessionType,
        check_in_date: attendanceDate,
        attendance_date: attendanceDate,
        check_in_time: new Date().toISOString(),
        verification_status: 'pending',
        streak_count: newStreak,
        xp_awarded: xpAwarded
      });

      await base44.auth.updateMe({
        xp: newXP,
        level: newLevel,
        streak_count: newStreak,
        last_check_in: new Date().toISOString()
      });

      return { checkIn, xpAwarded, newStreak, newLevel, leveledUp: newLevel > (user.level || 1) };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['todayCheckIns'] });
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setSessionType('');
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setShowEvaluation(true);
      
      if (data.leveledUp) {
        toast.success(`🎉 LEVEL UP! You're now Level ${data.newLevel}!`, { duration: 5000 });
      } else {
        toast.success(`✅ Checked in! +${data.xpAwarded} XP | ${data.newStreak} day streak 🔥`);
      }
    },
  });

  const submitEvaluationMutation = useMutation({
    mutationFn: (data) => base44.entities.SelfEvaluation.create({
      ...data,
      trainee_id: user.id,
      session_date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      setShowEvaluation(false);
      setEvaluationData({
        what_learned: '',
        difficult_drill: '',
        want_to_improve: '',
        cardio_rating: 5,
        felt_safe: true,
        felt_consistent: true,
        additional_notes: ''
      });
      toast.success("Self-evaluation submitted!");
    },
  });

  const handleCheckIn = () => {
    if (!sessionType) {
      toast.error("Please select a session type");
      return;
    }
    
    if (todayCheckIns.length > 0) {
      toast.error("You've already checked in today!");
      return;
    }

    setIsChecking(true);
    checkInMutation.mutate();
    setTimeout(() => setIsChecking(false), 2000);
  };

  const nextLevelXP = user?.level < 10 ? XP_LEVELS[user?.level] : XP_LEVELS[9];
  const currentLevelXP = user?.level > 1 ? XP_LEVELS[user?.level - 1] : 0;
  const progressPercent = user?.level < 10 
    ? ((user?.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 
    : 100;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Zap className="w-10 h-10" style={{ color: '#8b3dff' }} />
            Check In
          </h1>
          <p className="text-gray-400">Mark your attendance and earn XP</p>
        </div>

        {/* User Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardContent className="p-6 text-center">
              <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: '#8b3dff' }} />
              <p className="text-5xl font-bold text-white mb-1">L{user?.level || 1}</p>
              <p className="text-sm text-gray-400">Current Level</p>
              <div className="mt-4 bg-gray-800 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #8b3dff 0%, #dc2626 100%)'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {user?.xp || 0} / {nextLevelXP} XP
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardContent className="p-6 text-center">
              <Flame className="w-10 h-10 mx-auto mb-3" style={{ color: '#dc2626' }} />
              <p className="text-5xl font-bold text-white mb-1">{user?.streak_count || 0}</p>
              <p className="text-sm text-gray-400">Day Streak 🔥</p>
              <p className="text-xs text-gray-500 mt-4">
                +{Math.min((user?.streak_count || 0) * 5, 50)} bonus XP
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-3" style={{ color: '#c0c0c0' }} />
              <p className="text-5xl font-bold text-white mb-1">{user?.xp || 0}</p>
              <p className="text-sm text-gray-400">Total XP</p>
            </CardContent>
          </Card>
        </div>

        {/* Check In Form */}
        {todayCheckIns.length === 0 ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
              <CardHeader>
                <CardTitle className="text-white text-2xl text-center">Ready to Train?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Attendance Date</label>
                    <Input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white h-14 text-lg"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Select Session Type</label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white h-14 text-lg">
                        <SelectValue placeholder="Choose your session..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fundamentals">Fundamentals</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="guest_trainer">Guest Trainer</SelectItem>
                        <SelectItem value="conditioning">Conditioning (S&C)</SelectItem>
                        <SelectItem value="open_mat">Open Mat</SelectItem>
                        <SelectItem value="show_prep">Show Prep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleCheckIn}
                    disabled={!sessionType || isChecking}
                    className="w-full h-20 text-2xl font-bold"
                    style={{ 
                      background: isChecking 
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                        : 'linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)'
                    }}
                  >
                    {isChecking ? (
                      <>
                        <CheckCircle className="w-8 h-8 mr-3 animate-pulse" />
                        Checked In! ✓
                      </>
                    ) : (
                      <>
                        <Zap className="w-8 h-8 mr-3" />
                        CHECK IN NOW
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="text-center p-4 rounded-lg border border-gray-800" style={{ background: '#0a0a0a' }}>
                  <p className="text-gray-400 text-sm">
                    You'll earn <span className="font-bold text-white">{calculateXPForCheckIn(user?.streak_count || 0)} XP</span> for checking in today
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-20 h-20 mx-auto mb-4" style={{ color: '#10b981' }} />
              <h2 className="text-3xl font-bold text-white mb-2">Already Checked In!</h2>
              <p className="text-gray-400 mb-6">Your attendance has been submitted and is waiting for coach verification</p>
              <p className="text-sm text-yellow-400 mb-6">Status: {todayCheckIns[0]?.verification_status === 'verified' ? 'Verified' : 'Pending verification'}</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full" 
                   style={{ background: 'rgba(139, 61, 255, 0.2)' }}>
                <Zap className="w-5 h-5" style={{ color: '#8b3dff' }} />
                <span className="font-bold text-white">
                  +{todayCheckIns[0]?.xp_awarded} XP Earned
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Self-Evaluation Modal */}
        {showEvaluation && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
              <CardHeader>
                <CardTitle className="text-white">Session Self-Evaluation</CardTitle>
                <p className="text-sm text-gray-400">Quick reflection on today's training</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">What did you learn today?</Label>
                  <Textarea
                    value={evaluationData.what_learned}
                    onChange={(e) => setEvaluationData({ ...evaluationData, what_learned: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white h-20"
                    placeholder="New techniques, insights, etc..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">What drill gave you trouble?</Label>
                  <Input
                    value={evaluationData.difficult_drill}
                    onChange={(e) => setEvaluationData({ ...evaluationData, difficult_drill: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Any challenging drills..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">What do you want to improve?</Label>
                  <Textarea
                    value={evaluationData.want_to_improve}
                    onChange={(e) => setEvaluationData({ ...evaluationData, want_to_improve: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white h-20"
                    placeholder="Focus areas for next session..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">How was your cardio? (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={evaluationData.cardio_rating}
                    onChange={(e) => setEvaluationData({ ...evaluationData, cardio_rating: parseInt(e.target.value) })}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evaluationData.felt_safe}
                      onChange={(e) => setEvaluationData({ ...evaluationData, felt_safe: e.target.checked })}
                      className="w-4 h-4"
                    />
                    I felt safe today
                  </label>
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evaluationData.felt_consistent}
                      onChange={(e) => setEvaluationData({ ...evaluationData, felt_consistent: e.target.checked })}
                      className="w-4 h-4"
                    />
                    I felt consistent
                  </label>
                </div>
                <div>
                  <Label className="text-gray-300">Additional Notes</Label>
                  <Textarea
                    value={evaluationData.additional_notes}
                    onChange={(e) => setEvaluationData({ ...evaluationData, additional_notes: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white h-20"
                    placeholder="Any other thoughts..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowEvaluation(false)}
                    style={{ borderColor: '#666', color: '#999' }}
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={() => submitEvaluationMutation.mutate(evaluationData)}
                    disabled={submitEvaluationMutation.isPending}
                    style={{ background: '#8b3dff' }}
                  >
                    Submit Evaluation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}