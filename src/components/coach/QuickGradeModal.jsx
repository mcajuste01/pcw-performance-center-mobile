import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const gradeTemplates = {
  rolls: { name: "Rolls", feedback: "Good rotation and momentum. Focus on protecting your neck and keeping tight." },
  lockup: { name: "Lock-up", feedback: "Solid collar-and-elbow. Work on hand positioning and maintaining balance." },
  footwork: { name: "Footwork", feedback: "Movement is improving. Keep working on lateral agility and pivoting." },
  strikes: { name: "Strikes", feedback: "Good contact and timing. Remember to protect your opponent while making it look impactful." },
  selling: { name: "Selling", feedback: "Excellent reaction to moves. Keep showing the story through your facial expressions." },
  psychology: { name: "Match Psychology", feedback: "Strong understanding of pace and timing. Continue developing your in-ring storytelling." },
  promo: { name: "Promo Delivery", feedback: "Confident mic work. Work on connecting emotionally with the audience." },
  timing: { name: "Timing", feedback: "Good sense of when to speed up and slow down. Keep reading your opponent." },
  crowd: { name: "Crowd Work", feedback: "Great audience engagement. Keep playing to all sides of the venue." }
};

export default function QuickGradeModal({ trainee, onClose }) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [grade, setGrade] = useState(7);
  const [feedback, setFeedback] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['traineeLogs', trainee.id],
    queryFn: () => base44.entities.TrainingLog.filter({ trainee_id: trainee.id }, '-date'),
    initialData: [],
  });

  const updateLogMutation = useMutation({
    mutationFn: ({ logId, gradeData }) => 
      base44.entities.TrainingLog.update(logId, gradeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traineeLogs'] });
      toast.success("Grade submitted successfully!");
      onClose();
    },
  });

  const applyTemplate = (templateKey) => {
    const template = gradeTemplates[templateKey];
    setFeedback(template.feedback);
  };

  const handleSubmit = () => {
    if (!selectedLog) {
      toast.error("Please select a training log");
      return;
    }

    updateLogMutation.mutate({
      logId: selectedLog,
      gradeData: {
        coach_grade: grade,
        coach_feedback: feedback
      }
    });
  };

  const ungradedLogs = recentLogs.filter(l => !l.coach_grade).slice(0, 10);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Quick Grade - {trainee.wrestling_name || trainee.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-300 mb-2 block">Select Training Log</Label>
            <Select value={selectedLog} onValueChange={setSelectedLog}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Choose a recent log to grade" />
              </SelectTrigger>
              <SelectContent>
                {ungradedLogs.length > 0 ? (
                  ungradedLogs.map(log => (
                    <SelectItem key={log.id} value={log.id}>
                      {log.drill_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {log.date}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No ungraded logs</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block">Quick Templates</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(gradeTemplates).map(([key, template]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(key);
                    applyTemplate(key);
                  }}
                  className={selectedTemplate === key ? 'border-purple-500' : ''}
                  style={{ 
                    borderColor: selectedTemplate === key ? '#8b3dff' : '#374151',
                    color: selectedTemplate === key ? '#8b3dff' : '#9ca3af'
                  }}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block">Coach Grade (1-10)</Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-3xl font-bold text-white w-16 text-center">
                {grade}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block">Feedback</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white h-32"
              placeholder="Provide detailed feedback..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}
                    style={{ borderColor: '#666', color: '#999' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedLog || updateLogMutation.isPending}
              style={{ background: '#8b3dff' }}
            >
              {updateLogMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Grade'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}