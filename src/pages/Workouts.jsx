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
import { Dumbbell, Plus, X, Calendar, Target, TrendingUp, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Workouts() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    focus_areas: [],
    frequency: '',
    duration_weeks: '',
    start_date: '',
    exercises: []
  });
  const [newFocusArea, setNewFocusArea] = useState('');
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', notes: '' });

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

  const hasRole = (role) => {
    return user?.roles?.includes(role) || (role === 'admin' && user?.role === 'admin');
  };

  const isCoachOrAdmin = hasRole('coach') || hasRole('admin');

  const { data: allTrainees = [] } = useQuery({
    queryKey: ['allTrainees'],
    queryFn: () => base44.entities.User.list(),
    enabled: isCoachOrAdmin,
    initialData: [],
  });

  const { data: workoutPlans = [] } = useQuery({
    queryKey: ['workoutPlans', user?.id, selectedTrainee],
    queryFn: () => {
      if (isCoachOrAdmin && selectedTrainee) {
        return base44.entities.WorkoutPlan.filter({ trainee_id: selectedTrainee }, '-created_date');
      }
      return base44.entities.WorkoutPlan.filter({ trainee_id: user.id }, '-created_date');
    },
    enabled: !!user,
    initialData: [],
  });

  const createWorkoutMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutPlan.create({
      ...data,
      coach_id: user.id,
      trainee_id: selectedTrainee || user.id,
      status: 'active'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        focus_areas: [],
        frequency: '',
        duration_weeks: '',
        start_date: '',
        exercises: []
      });
      toast.success("Workout plan created!");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.WorkoutPlan.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      toast.success("Status updated!");
    },
  });

  const handleAddFocusArea = () => {
    if (newFocusArea.trim()) {
      setFormData({ ...formData, focus_areas: [...formData.focus_areas, newFocusArea.trim()] });
      setNewFocusArea('');
    }
  };

  const handleRemoveFocusArea = (index) => {
    setFormData({ ...formData, focus_areas: formData.focus_areas.filter((_, i) => i !== index) });
  };

  const handleAddExercise = () => {
    if (newExercise.name.trim()) {
      setFormData({ ...formData, exercises: [...formData.exercises, { ...newExercise }] });
      setNewExercise({ name: '', sets: '', reps: '', notes: '' });
    }
  };

  const handleRemoveExercise = (index) => {
    setFormData({ ...formData, exercises: formData.exercises.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createWorkoutMutation.mutate(formData);
  };

  const trainees = (allTrainees || []).filter(t => t.role !== 'admin');

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Dumbbell className="w-8 h-8" style={{ color: '#8b3dff' }} />
              Workout Plans
            </h1>
            <p className="text-gray-400">
              {isCoachOrAdmin ? 'Create personalized workout plans' : 'Your strength & conditioning program'}
            </p>
          </div>
          {isCoachOrAdmin && selectedTrainee && (
            <Button onClick={() => setShowForm(!showForm)} style={{ background: '#8b3dff' }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          )}
        </div>

        {/* Coach View - Trainee Selector */}
        {isCoachOrAdmin && (
          <Card className="border-gray-800 mb-6" style={{ background: '#0f0f0f' }}>
            <CardContent className="p-4">
              <Select value={selectedTrainee || ''} onValueChange={setSelectedTrainee}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Select a trainee to manage workouts..." />
                </SelectTrigger>
                <SelectContent>
                  {(trainees || []).map(trainee => (
                    <SelectItem key={trainee.id} value={trainee.id}>
                      {trainee.wrestling_name || trainee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Workout Form */}
        {showForm && isCoachOrAdmin && (
          <Card className="border-gray-800 mb-8" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Create Workout Plan
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Plan Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="e.g., Strength Building Program"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Frequency</Label>
                    <Input
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="e.g., 3x per week"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Duration (weeks)</Label>
                    <Input
                      type="number"
                      value={formData.duration_weeks}
                      onChange={(e) => setFormData({ ...formData, duration_weeks: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="8"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white h-24"
                    placeholder="Overall goals and notes for this program..."
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Focus Areas</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newFocusArea}
                      onChange={(e) => setNewFocusArea(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFocusArea())}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="e.g., Upper Body Strength"
                    />
                    <Button type="button" onClick={handleAddFocusArea} style={{ background: '#8b3dff' }}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.focus_areas || []).map((area, index) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            style={{ background: 'rgba(139, 61, 255, 0.2)', color: '#8b3dff' }}>
                        {area}
                        <button type="button" onClick={() => handleRemoveFocusArea(index)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Exercises</Label>
                  <div className="space-y-3 mb-3">
                    <div className="grid grid-cols-12 gap-2">
                      <Input
                        placeholder="Exercise name"
                        value={newExercise.name}
                        onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white col-span-4"
                      />
                      <Input
                        placeholder="Sets"
                        type="number"
                        value={newExercise.sets}
                        onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white col-span-2"
                      />
                      <Input
                        placeholder="Reps"
                        value={newExercise.reps}
                        onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white col-span-2"
                      />
                      <Input
                        placeholder="Notes"
                        value={newExercise.notes}
                        onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white col-span-3"
                      />
                      <Button type="button" onClick={handleAddExercise} className="col-span-1" style={{ background: '#8b3dff' }}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(formData.exercises || []).map((exercise, index) => (
                      <div key={index} className="p-3 rounded-lg border border-gray-800 flex items-center justify-between"
                           style={{ background: '#0a0a0a' }}>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{exercise.name}</p>
                          <p className="text-sm text-gray-400">
                            {exercise.sets && `${exercise.sets} sets`} {exercise.reps && `× ${exercise.reps}`}
                            {exercise.notes && ` - ${exercise.notes}`}
                          </p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveExercise(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                          style={{ borderColor: '#666', color: '#999' }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createWorkoutMutation.isPending}
                          style={{ background: '#8b3dff' }}>
                    {createWorkoutMutation.isPending ? 'Creating...' : 'Create Workout Plan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Workout Plans List */}
        {(isCoachOrAdmin ? selectedTrainee : true) ? (
          <div className="space-y-6">
            {(workoutPlans || []).length > 0 ? (
              (workoutPlans || []).map((plan) => (
                <Card key={plan.id} className="border-gray-800" style={{ background: '#0f0f0f' }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-white text-2xl">{plan.title}</CardTitle>
                          <Badge className={
                            plan.status === 'active' ? 'bg-green-900 text-green-300' :
                            plan.status === 'completed' ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-800 text-gray-400'
                          }>
                            {plan.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          {plan.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Starts {new Date(plan.start_date).toLocaleDateString()}
                            </span>
                          )}
                          {plan.frequency && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {plan.frequency}
                            </span>
                          )}
                          {plan.duration_weeks && (
                            <span>{plan.duration_weeks} weeks</span>
                          )}
                        </div>
                      </div>
                      {isCoachOrAdmin && (
                        <Select
                          value={plan.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: plan.id, status })}
                        >
                          <SelectTrigger className="w-32 bg-gray-900 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.description && (
                      <p className="text-gray-300">{plan.description}</p>
                    )}

                    {plan.focus_areas?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Focus Areas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(plan.focus_areas || []).map((area, index) => (
                            <span key={index} className="px-3 py-1 rounded-full text-sm"
                                  style={{ background: 'rgba(139, 61, 255, 0.2)', color: '#8b3dff' }}>
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {plan.exercises?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                          <Dumbbell className="w-4 h-4" />
                          Exercises ({plan.exercises.length})
                        </h4>
                        <div className="space-y-2">
                          {(plan.exercises || []).map((exercise, index) => (
                            <div key={index} className="p-3 rounded-lg border border-gray-800"
                                 style={{ background: '#0a0a0a' }}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{exercise.name}</p>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {exercise.sets && `${exercise.sets} sets`} {exercise.reps && `× ${exercise.reps}`}
                                  </p>
                                  {exercise.notes && (
                                    <p className="text-sm text-gray-500 mt-1">{exercise.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
                <CardContent className="p-12 text-center">
                  <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500 text-lg">No workout plans yet</p>
                  {isCoachOrAdmin && selectedTrainee && (
                    <Button onClick={() => setShowForm(true)} className="mt-4" style={{ background: '#8b3dff' }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          isCoachOrAdmin && (
            <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Select a trainee to view and manage their workout plans</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}