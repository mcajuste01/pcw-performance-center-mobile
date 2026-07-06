import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Calendar, ChevronLeft, ChevronRight, Clock, Users, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

export default function Curriculum() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    session_type: 'fundamentals_class',
    topics_covered: [],
    notes: '',
    duration_minutes: 90,
  });
  const [newTopic, setNewTopic] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const hasCoachRole = currentUser.roles?.includes('coach') || currentUser.roles?.includes('admin') || currentUser.role === 'admin';
        if (!hasCoachRole) {
          window.location.href = '/';
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: trainingSessions = [] } = useQuery({
    queryKey: ['trainingSessions'],
    queryFn: () => base44.entities.DailyTraining.list('-training_date'),
    initialData: [],
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list(),
    initialData: [],
  });

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyTraining.create({
      ...data,
      training_date: format(selectedDate, 'yyyy-MM-dd'),
      coach_id: user.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingSessions'] });
      setShowForm(false);
      setFormData({
        session_type: 'fundamentals_class',
        topics_covered: [],
        notes: '',
        duration_minutes: 90,
      });
      toast.success("Training session saved!");
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyTraining.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingSessions'] });
      setEditingSession(null);
      toast.success("Session updated!");
    },
  });

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      if (editingSession) {
        setEditingSession({
          ...editingSession,
          topics_covered: [...(editingSession.topics_covered || []), newTopic.trim()]
        });
      } else {
        setFormData({
          ...formData,
          topics_covered: [...formData.topics_covered, newTopic.trim()]
        });
      }
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (index) => {
    if (editingSession) {
      setEditingSession({
        ...editingSession,
        topics_covered: editingSession.topics_covered.filter((_, i) => i !== index)
      });
    } else {
      setFormData({
        ...formData,
        topics_covered: formData.topics_covered.filter((_, i) => i !== index)
      });
    }
  };

  const handleSubmit = () => {
    if (editingSession) {
      updateSessionMutation.mutate({
        id: editingSession.id,
        data: {
          session_type: editingSession.session_type,
          topics_covered: editingSession.topics_covered,
          notes: editingSession.notes,
          duration_minutes: editingSession.duration_minutes,
        }
      });
    } else {
      createSessionMutation.mutate(formData);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const getSessionsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return (trainingSessions || []).filter(s => s.training_date === dateStr);
  };

  const getAttendanceForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return (checkIns || []).filter(c => c.check_in_time?.startsWith(dateStr)).length;
  };

  const getSessionTypeLabel = (type) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  };

  const getSessionTypeColor = (type) => {
    switch(type) {
      case 'fundamentals_class': return '#8b3dff';
      case 'intermediate_class': return '#c0c0c0';
      case 'advanced_class': return '#dc2626';
      case 'promo_workshop': return '#f59e0b';
      case 'sparring': return '#ef4444';
      default: return '#666';
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8" style={{ color: '#8b3dff' }} />
              Lesson Planning
            </h1>
            <p className="text-gray-400">Plan and track daily training sessions</p>
          </div>
        </div>

        {/* Week Navigator */}
        <Card className="border-gray-800 mb-6" style={{ background: '#0f0f0f' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                style={{ borderColor: '#666', color: '#999' }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold text-white">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                style={{ borderColor: '#666', color: '#999' }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Week Grid */}
        <div className="grid md:grid-cols-7 gap-4 mb-6">
          {weekDays.map((day) => {
            const sessions = getSessionsForDate(day);
            const attendance = getAttendanceForDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);

            return (
              <Card
                key={day.toString()}
                className={`border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-purple-500' : 'border-gray-800'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                style={{ background: '#0f0f0f' }}
                onClick={() => setSelectedDate(day)}
              >
                <CardHeader className="p-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase">{format(day, 'EEE')}</p>
                    <p className="text-2xl font-bold text-white">{format(day, 'd')}</p>
                    {isToday && <p className="text-xs text-blue-400 mt-1">Today</p>}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1">
                  {(sessions || []).length > 0 ? (
                    (sessions || []).map((session) => (
                      <div
                        key={session.id}
                        className="text-xs p-2 rounded border"
                        style={{
                          borderColor: getSessionTypeColor(session.session_type),
                          background: `${getSessionTypeColor(session.session_type)}20`,
                          color: getSessionTypeColor(session.session_type)
                        }}
                      >
                        {getSessionTypeLabel(session.session_type)}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600 text-center py-2">No sessions</p>
                  )}
                  {attendance > 0 && (
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-2">
                      <Users className="w-3 h-3" />
                      {attendance}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Day Detail */}
        <Card className="border-gray-800 mb-6" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: '#8b3dff' }} />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
              <Button
                onClick={() => setShowForm(!showForm)}
                style={{ background: '#8b3dff' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Plan Session
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showForm && (
              <Card className="border-gray-700 mb-6" style={{ background: '#0a0a0a' }}>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Session Type *</Label>
                      <Select
                        value={formData.session_type}
                        onValueChange={(value) => setFormData({ ...formData, session_type: value })}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fundamentals_class">Fundamentals Class</SelectItem>
                          <SelectItem value="intermediate_class">Intermediate Class</SelectItem>
                          <SelectItem value="advanced_class">Advanced Class</SelectItem>
                          <SelectItem value="open_mat">Open Mat</SelectItem>
                          <SelectItem value="sparring">Sparring</SelectItem>
                          <SelectItem value="promo_workshop">Promo Workshop</SelectItem>
                          <SelectItem value="psychology_session">Psychology Session</SelectItem>
                          <SelectItem value="conditioning">Conditioning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Topics to Cover</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                        placeholder="Add topic..."
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                      <Button onClick={handleAddTopic} style={{ background: '#8b3dff' }}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.topics_covered || []).map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          style={{ background: 'rgba(139, 61, 255, 0.2)', color: '#8b3dff' }}
                        >
                          {topic}
                          <button onClick={() => handleRemoveTopic(index)} className="hover:text-red-500">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Session Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white h-24"
                      placeholder="Training objectives, special focus areas, equipment needed..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      style={{ borderColor: '#666', color: '#999' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={createSessionMutation.isPending}
                      style={{ background: '#8b3dff' }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Existing Sessions */}
            <div className="space-y-4">
              {(getSessionsForDate(selectedDate) || []).length > 0 ? (
                (getSessionsForDate(selectedDate) || []).map((session) => (
                  <Card
                    key={session.id}
                    className="border-gray-700"
                    style={{ background: '#0a0a0a' }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: getSessionTypeColor(session.session_type) }}
                          />
                          <div>
                            <h3 className="font-semibold text-white">
                              {getSessionTypeLabel(session.session_type)}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {session.duration_minutes} min
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSession(session)}
                          style={{ borderColor: '#8b3dff', color: '#8b3dff' }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingSession?.id === session.id ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-300">Session Type</Label>
                              <Select
                                value={editingSession.session_type}
                                onValueChange={(value) => setEditingSession({ ...editingSession, session_type: value })}
                              >
                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fundamentals_class">Fundamentals Class</SelectItem>
                                  <SelectItem value="intermediate_class">Intermediate Class</SelectItem>
                                  <SelectItem value="advanced_class">Advanced Class</SelectItem>
                                  <SelectItem value="open_mat">Open Mat</SelectItem>
                                  <SelectItem value="sparring">Sparring</SelectItem>
                                  <SelectItem value="promo_workshop">Promo Workshop</SelectItem>
                                  <SelectItem value="psychology_session">Psychology Session</SelectItem>
                                  <SelectItem value="conditioning">Conditioning</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-gray-300">Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={editingSession.duration_minutes}
                                onChange={(e) => setEditingSession({ ...editingSession, duration_minutes: parseInt(e.target.value) })}
                                className="bg-gray-900 border-gray-700 text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-gray-300">Topics</Label>
                            <div className="flex gap-2 mb-2">
                              <Input
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                                placeholder="Add topic..."
                                className="bg-gray-900 border-gray-700 text-white"
                              />
                              <Button onClick={handleAddTopic} style={{ background: '#8b3dff' }}>
                                Add
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(editingSession.topics_covered || []).map((topic, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                  style={{ background: 'rgba(139, 61, 255, 0.2)', color: '#8b3dff' }}
                                >
                                  {topic}
                                  <button onClick={() => handleRemoveTopic(index)} className="hover:text-red-500">
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-gray-300">Notes</Label>
                            <Textarea
                              value={editingSession.notes}
                              onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                              className="bg-gray-900 border-gray-700 text-white h-24"
                            />
                          </div>

                          <div className="flex gap-3 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setEditingSession(null)}
                              style={{ borderColor: '#666', color: '#999' }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSubmit}
                              disabled={updateSessionMutation.isPending}
                              style={{ background: '#8b3dff' }}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {(session.topics_covered || []).length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-400 mb-2">Topics Covered:</p>
                              <div className="flex flex-wrap gap-2">
                                {(session.topics_covered || []).map((topic, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 rounded-full text-sm"
                                    style={{ background: 'rgba(139, 61, 255, 0.2)', color: '#8b3dff' }}
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {session.notes && (
                            <div className="p-3 rounded border border-gray-800">
                              <p className="text-sm text-gray-300">{session.notes}</p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No training sessions planned for this day</p>
                  <p className="text-sm text-gray-600 mt-1">Click "Plan Session" to add one</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}