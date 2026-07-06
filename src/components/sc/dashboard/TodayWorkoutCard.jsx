import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dumbbell, Calendar, ArrowRight, Target } from "lucide-react";

export default function TodayWorkoutCard({ plan }) {
  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Dumbbell className="w-5 h-5" style={{ color: "#8b3dff" }} /> Today's Workout
        </CardTitle>
      </CardHeader>
      <CardContent>
        {plan ? (
          <div>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xl font-bold text-white">{plan.title}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-400">
                  {plan.frequency && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{plan.frequency}</span>}
                  {plan.level && <span className="capitalize">{plan.level}</span>}
                  {plan.category && <span className="capitalize">{plan.category}</span>}
                </div>
              </div>
              <Badge className="bg-green-900 text-green-300 capitalize">{plan.status}</Badge>
            </div>
            {plan.description && <p className="text-gray-300 mt-3 text-sm">{plan.description}</p>}
            {plan.exercises?.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2 mt-4">
                {plan.exercises.slice(0, 6).map((ex, i) => (
                  <div key={i} className="p-3 rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                    <p className="text-white font-medium text-sm">{ex.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ex.sets ? `${ex.sets} sets` : ""} {ex.reps ? `× ${ex.reps}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link to="/PerformanceLab" className="inline-flex items-center gap-1 mt-4 text-sm font-medium" style={{ color: "#8b3dff" }}>
              Open in Performance Lab <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-10 h-10 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500">No workout assigned for today</p>
            <p className="text-xs text-gray-600 mt-1">Your coach will assign a program soon.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}