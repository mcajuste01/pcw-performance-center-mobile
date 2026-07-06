import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FileText, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { currentMonthStr } from "./analyticsConstants";

export default function ReportGeneratorModal({ open, onClose, trainee, summaryData }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reportMonth, setReportMonth] = useState(currentMonthStr());
  const [coachComments, setCoachComments] = useState("");
  const [skillProgression, setSkillProgression] = useState("");
  const [goals, setGoals] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      setReportMonth(currentMonthStr());
      setCoachComments("");
      setSkillProgression("");
      setGoals("");
      setGenerating(false);
    }
  }, [open]);

  const s = summaryData || {};
  const periodStart = `${reportMonth}-01`;
  const periodEnd = new Date(
    parseInt(reportMonth.split("-")[0]),
    parseInt(reportMonth.split("-")[1]),
    0
  ).toISOString().slice(0, 10);

  const generateSummary = () => {
    const parts = [];
    parts.push(`${trainee?.wrestling_name || trainee?.full_name || "Trainee"} — ${reportMonth} Performance Report.`);
    if (s.attendancePct != null) parts.push(`Attendance: ${s.attendancePct}%.`);
    if (s.avgReadiness != null) parts.push(`Average readiness score: ${s.avgReadiness}/100.`);
    if (s.workoutPct != null) parts.push(`Workout completion: ${s.workoutPct}% (${s.completedWorkouts}/${s.totalWorkouts}).`);
    if (s.baselineCount > 0) parts.push(`Baseline tests completed: ${s.baselineCount}.`);
    if (s.recoveryCount != null) parts.push(`Recovery sessions this month: ${s.recoveryCount}.`);
    if (s.activeInjuries > 0) parts.push(`Active injuries flagged: ${s.activeInjuries}.`);
    return parts.join(" ");
  };

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.PerformanceReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reports", trainee?.auth_user_id] });
      toast({ title: "Report generated!" });
      onClose();
    },
    onError: (err) => toast({ title: "Failed to save", description: err.message, variant: "destructive" }),
  });

  const handleGenerate = () => {
    const summary = generateSummary();
    setGenerating(true);
    setTimeout(() => setGenerating(false), 800);
    mutation.mutate({
      trainee_id: trainee?.auth_user_id,
      trainee_name: trainee?.wrestling_name || trainee?.full_name || "",
      report_month: reportMonth,
      period_start: periodStart,
      period_end: periodEnd,
      attendance_pct: s.attendancePct,
      workouts_completed: s.completedWorkouts,
      conditioning_score: s.conditioningScore,
      strength_score: s.strengthScore,
      mobility_score: s.mobilityScore,
      recovery_consistency: s.recoveryCount,
      readiness_score: s.avgReadiness,
      coach_comments: coachComments,
      skill_progression: skillProgression,
      goals_next_month: goals,
      summary,
    });
  };

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> Generate Monthly Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-300 text-xs">Trainee</Label>
            <p className="text-white text-sm mt-1 font-medium">
              {trainee?.wrestling_name || trainee?.full_name || "—"}
            </p>
          </div>

          <div>
            <Label className="text-gray-300 text-xs">Report Month</Label>
            <Input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>

          {/* Auto-summary preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-gray-300 text-xs">Auto-Generated Summary</Label>
              <button onClick={generateSummary} className="text-purple-400 text-xs flex items-center gap-1 hover:text-purple-300">
                <Sparkles className="w-3 h-3" /> Refresh
              </button>
            </div>
            <div className="p-3 rounded-lg text-xs text-gray-300" style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}>
              {generateSummary()}
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-xs">Skill Progression Notes</Label>
            <Textarea value={skillProgression} onChange={(e) => setSkillProgression(e.target.value)}
              placeholder="How have the trainee's skills developed this month?" className={`mt-1 ${inputCls}`} rows={2} />
          </div>

          <div>
            <Label className="text-gray-300 text-xs">Coach Comments</Label>
            <Textarea value={coachComments} onChange={(e) => setCoachComments(e.target.value)}
              placeholder="Overall assessment, strengths, areas to improve..." className={`mt-1 ${inputCls}`} rows={3} />
          </div>

          <div>
            <Label className="text-gray-300 text-xs">Goals for Next Month</Label>
            <Textarea value={goals} onChange={(e) => setGoals(e.target.value)}
              placeholder="Targets and focus areas for next month" className={`mt-1 ${inputCls}`} rows={2} />
          </div>

          {/* Pre-filled metrics preview */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Readiness", value: s.avgReadiness },
              { label: "Workouts", value: s.completedWorkouts },
              { label: "Recovery", value: s.recoveryCount },
            ].map((m) => (
              <div key={m.label} className="p-2 rounded-lg" style={{ background: "#0a0a0a" }}>
                <p className="text-white text-lg font-bold">{m.value ?? "—"}</p>
                <p className="text-[10px] text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={handleGenerate} disabled={mutation.isPending || generating}
            className="bg-purple-600 hover:bg-purple-700 text-white">
            {(mutation.isPending || generating) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}