import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function CoachEvaluationModal({ trainee, onClose, user }) {
  const [evaluation, setEvaluation] = useState('');
  const [grade, setGrade] = useState('B');
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const submitEvaluation = async () => {
    if (!evaluation.trim()) {
      toast.error("Please write an evaluation");
      return;
    }

    setSubmitting(true);
    try {
      // Use AI to summarize the coach's review
      const prompt = `You are processing a coach's quarterly evaluation for a wrestling trainee.

Coach's raw evaluation:
${evaluation}

Overall grade given: ${grade}

Extract and summarize this into:
1. A concise summary (2-3 sentences)
2. 3-5 key strengths identified
3. 3-5 areas for improvement
4. 3-5 specific recommendations

Be clear, professional, and maintain the coach's intent while organizing the feedback.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            areas_for_improvement: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Calculate metrics for the period
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      const trainingLogs = await base44.entities.TrainingLog.filter({ trainee_id: trainee.id });
      const videos = await base44.entities.Video.filter({ trainee_id: trainee.id });
      const assignments = await base44.entities.Assignment.filter({ trainee_id: trainee.id });

      const recentLogs = trainingLogs.filter(log => new Date(log.created_date) >= ninetyDaysAgo);
      const totalHours = recentLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60;
      const avgScore = recentLogs.length > 0 
        ? recentLogs.reduce((sum, log) => sum + (log.self_grade || 0), 0) / recentLogs.length 
        : 0;
      const completedAssignments = assignments.filter(a => 
        a.status === 'graded' && new Date(a.created_date) >= ninetyDaysAgo
      ).length;
      const videosSubmitted = videos.filter(v => new Date(v.created_date) >= ninetyDaysAgo).length;

      await base44.entities.ProgressReport.create({
        trainee_id: trainee.id,
        coach_id: user.id,
        report_type: 'coach_evaluation',
        report_date: now.toISOString().split('T')[0],
        period_start: ninetyDaysAgo.toISOString().split('T')[0],
        period_end: now.toISOString().split('T')[0],
        coach_review: evaluation,
        summary: result.summary,
        strengths: result.strengths,
        areas_for_improvement: result.areas_for_improvement,
        recommendations: result.recommendations,
        overall_grade: grade,
        metrics: {
          total_training_hours: totalHours,
          average_drill_score: avgScore,
          assignments_completed: completedAssignments,
          videos_submitted: videosSubmitted
        }
      });

      queryClient.invalidateQueries({ queryKey: ['progressReports'] });
      toast.success("Evaluation submitted!");
      onClose();
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast.error("Failed to submit evaluation");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-gray-800" style={{ background: '#0f0f0f' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: '#8b3dff' }} />
              Coach Evaluation - {trainee.wrestling_name || trainee.full_name}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={submitting}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300">Overall Grade</Label>
            <Select value={grade} onValueChange={setGrade} disabled={submitting}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="C+">C+</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="C-">C-</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Quarterly Evaluation</Label>
            <Textarea
              value={evaluation}
              onChange={(e) => setEvaluation(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white h-64"
              placeholder="Write your detailed evaluation covering:
- Technical skills development
- Character work progress
- Attitude and work ethic
- Areas of strength
- Areas needing improvement
- Specific recommendations for next quarter

AI will automatically organize this into a structured report for the trainee."
              disabled={submitting}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={submitting}
                    style={{ borderColor: '#666', color: '#999' }}>
              Cancel
            </Button>
            <Button onClick={submitEvaluation} disabled={submitting || !evaluation.trim()}
                    style={{ background: '#8b3dff' }}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Evaluation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}