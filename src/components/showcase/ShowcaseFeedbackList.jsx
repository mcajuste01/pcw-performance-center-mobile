import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ShowcaseFeedbackList({ items, profiles, isCoachView }) {
  const getName = (userId) => {
    const profile = profiles.find((item) => item.auth_user_id === userId || item.id === userId);
    return profile?.wrestling_name || profile?.full_name || "Unknown";
  };

  if (!items.length) {
    return <p className="text-gray-500 text-center py-8">No showcase feedback yet.</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="border-gray-800 bg-[#0f0f0f]">
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-400">
                  {item.showcase_month}
                  {isCoachView ? ` • ${getName(item.trainee_id)}` : ` • Coach: ${getName(item.coach_id)}`}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {item.score !== undefined && item.score !== null && (
                  <Badge className="bg-purple-900/40 text-purple-200">Score: {item.score}</Badge>
                )}
                <Badge className="bg-gray-800 text-gray-200">{item.visibility === "private" ? "Private" : "Visible"}</Badge>
              </div>
            </div>

            {item.strengths && (
              <div>
                <p className="text-xs uppercase tracking-wide text-green-400 mb-1">Strengths</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{item.strengths}</p>
              </div>
            )}

            {item.areas_to_improve && (
              <div>
                <p className="text-xs uppercase tracking-wide text-yellow-400 mb-1">Areas to improve</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{item.areas_to_improve}</p>
              </div>
            )}

            {item.coach_notes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-400 mb-1">Coach notes</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{item.coach_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}