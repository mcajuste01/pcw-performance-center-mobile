import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Dumbbell } from "lucide-react";
import { toast } from "sonner";

export default function WorkoutPlanModal({ trainee, onSave }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    focus_areas: [],
    exercises: [],
    frequency: '',
    duration_weeks: '',
    start_date: new Date().toISOString().split('T')[0]
  });
  const [newFocusArea, setNewFocusArea] = useState('');
  const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', notes: '' });

  const addFocusArea = () => {
    if (newFocusArea.trim()) {
      setFormData({ ...formData, focus_areas: [...formData.focus_areas, newFocusArea.trim()] });
      setNewFocusArea('');
    }
  };

  const addExercise = () => {
    if (newExercise.name.trim()) {
      setFormData({ ...formData, exercises: [...formData.exercises, { ...newExercise }] });
      setNewExercise({ name: '', sets: '', reps: '', notes: '' });
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.frequency) {
      toast.error("Please fill in required fields");
      return;
    }

    onSave({
      ...formData,
      trainee_id: trainee.id,
      duration_weeks: parseInt(formData.duration_weeks) || 4
    });
    setOpen(false);
    setFormData({
      title: '',
      description: '',
      focus_areas: [],
      exercises: [],
      frequency: '',
      duration_weeks: '',
      start_date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" style={{ background: '#8b3dff' }}>
          <Dumbbell className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#0f0f0f', border: '1px solid #333' }}>
        <DialogHeader>
          <DialogTitle className="text-white">Create Workout Plan for {trainee.wrestling_name || trainee.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-gray-300">Plan Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Strength Building Program"
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Plan overview and goals..."
              className="bg-gray-900 border-gray-700 text-white h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Frequency *</Label>
              <Input
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., 3x per week"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Duration (weeks)</Label>
              <Input
                type="number"
                value={formData.duration_weeks}
                onChange={(e) => setFormData({ ...formData, duration_weeks: e.target.value })}
                placeholder="4"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
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
            <Label className="text-gray-300">Focus Areas</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newFocusArea}
                onChange={(e) => setNewFocusArea(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFocusArea())}
                placeholder="e.g., Strength, Cardio, Flexibility"
                className="bg-gray-900 border-gray-700 text-white"
              />
              <Button type="button" onClick={addFocusArea} size="sm" style={{ background: '#8b3dff' }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.focus_areas.map((area, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      style={{ background: 'rgba(139, 61, 255, 0.2)', color: '#8b3dff' }}>
                  {area}
                  <button onClick={() => setFormData({ ...formData, focus_areas: formData.focus_areas.filter((_, idx) => idx !== i) })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-gray-300">Exercises</Label>
            <div className="space-y-2 mb-2">
              <Input
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                placeholder="Exercise name"
                className="bg-gray-900 border-gray-700 text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                  placeholder="Sets"
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Input
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                  placeholder="Reps"
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Button type="button" onClick={addExercise} size="sm" style={{ background: '#8b3dff' }}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <Input
                value={newExercise.notes}
                onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              {formData.exercises.map((ex, i) => (
                <div key={i} className="p-3 rounded border border-gray-700 flex justify-between items-start"
                     style={{ background: '#0a0a0a' }}>
                  <div>
                    <p className="font-semibold text-white">{ex.name}</p>
                    <p className="text-sm text-gray-400">{ex.sets} sets × {ex.reps} reps</p>
                    {ex.notes && <p className="text-xs text-gray-500 mt-1">{ex.notes}</p>}
                  </div>
                  <button onClick={() => setFormData({ ...formData, exercises: formData.exercises.filter((_, idx) => idx !== i) })}>
                    <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} style={{ borderColor: '#666', color: '#999' }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} style={{ background: '#8b3dff' }}>
              Create Workout Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}