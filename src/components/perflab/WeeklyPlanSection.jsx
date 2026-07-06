import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, CheckCircle2, Dumbbell, Clock } from "lucide-react";
import { toArray, getCategoryInfo } from "./constants";

export default function WeeklyPlanSection({ traineeId, traineeName }) {
  const { toast } = useToast();

  const { data: plans = [], refetch } = useQuery({
    queryKey: ["perf-plans", traineeId],
    queryFn: () =>
      base44.entities.WorkoutPlan.filter(
        { trainee_id: traineeId },
        "-created_date"
      ),
    enabled: !!traineeId,
  });
  const planList = toArray(plans);
  const active = planList.filter((p) => p.status === "active");
  const completed = planList.filter((p) => p.completion_status === "completed");

  const completeMutation = useMutation({
    mutationFn: (plan) =>
      base44.entities.WorkoutPlan.update(plan.id, {
        completion_status: "completed",
        completed_date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      toast({ title: "Workout marked complete! 💪" });
      refetch();
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <Calendar className="w-5 h-5" style={{ color: "#8b3dff" }} />
        Weekly Conditioning Plan
      </h3>

      {active.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          No active workout plans assigned yet. Your coach will assign one based on your level.
        </p>
      ) : (
        active.map((plan) => {
          const cat = getCategoryInfo(plan.category);
          return (
            <Card key={plan.id} className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" style={{ color: cat.color }} />
                    {plan.title}
                  </CardTitle>
                  <div className="flex gap-1.5">
                    <Badge
                      variant="outline"
                      className="capitalize border-gray-700 text-gray-400"
                    >
                      {plan.level}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-gray-700 text-gray-400"
                    >
                      {plan.frequency || "As prescribed"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.description && (
                  <p className="text-sm text-gray-400">{plan.description}</p>
                )}
                {plan.focus_areas?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plan.focus_areas.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-full text-[10px]"
                        style={{ background: "rgba(139,61,255,0.15)", color: "#8b3dff" }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
                {plan.exercises?.length > 0 && (
                  <div className="space-y-1.5">
                    {plan.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg"
                        style={{ background: "#0a0a0a" }}
                      >
                        <span className="text-white text-sm font-medium">{ex.name}</span>
                        <span className="text-gray-400 text-xs">
                          {ex.sets} sets × {ex.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => completeMutation.mutate(plan)}
                  disabled={completeMutation.isPending}
                  variant="outline"
                  className="w-full border-green-800 text-green-400 hover:bg-green-900/20"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Complete
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}

      {completed.length > 0 && (
        <div>
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed Workouts ({completed.length})
          </p>
          <div className="space-y-1.5">
            {completed.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-gray-800"
                style={{ background: "#0a0a0a" }}
              >
                <div>
                  <span className="text-gray-300 text-sm">{plan.title}</span>
                  {plan.completed_date && (
                    <p className="text-[10px] text-gray-600">
                      <Clock className="w-3 h-3 inline" /> {new Date(plan.completed_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}