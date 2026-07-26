import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Megaphone, Calendar, Inbox } from "lucide-react";
import BrandAssignmentCard from "./BrandAssignmentCard";
import BrandSubmissionModal from "./BrandSubmissionModal";
import { toArray } from "./brandConstants";

export default function BrandPromoSection({ traineeId, traineeName }) {
  const queryClient = useQueryClient();
  const [submitTarget, setSubmitTarget] = useState(null);

  const { data: assignments = [] } = useQuery({
    queryKey: ["brand-assignments", traineeId],
    queryFn: async () => {
      const res = await base44.entities.BrandAssignment.filter({ assigned_to: traineeId }, "-due_date", 50);
      return toArray(res);
    },
    enabled: !!traineeId,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["brand-submissions", traineeId],
    queryFn: async () => {
      const res = await base44.entities.BrandSubmission.filter({ athlete_id: traineeId }, "-submitted_at", 50);
      return toArray(res);
    },
    enabled: !!traineeId,
  });

  const submissionMap = {};
  submissions.forEach(s => { submissionMap[s.assignment_id] = s; });

  const onSubmitted = () => {
    queryClient.invalidateQueries({ queryKey: ["brand-assignments", traineeId] });
    queryClient.invalidateQueries({ queryKey: ["brand-submissions", traineeId] });
  };

  // Group by due date for calendar view
  const grouped = {};
  assignments.forEach(a => {
    const key = a.due_date || "No due date";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === "No due date") return 1;
    if (b === "No due date") return -1;
    return a.localeCompare(b);
  });

  const openCount = assignments.filter(a => a.status !== "approved").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5" style={{ color: "#8b3dff" }} />
          <h3 className="text-white font-semibold">Brand & Promo Assignments</h3>
        </div>
        <span className="text-xs text-gray-500">{openCount} open</span>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-gray-800 p-8 text-center" style={{ background: "#0f0f0f" }}>
          <Inbox className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No brand assignments yet</p>
          <p className="text-gray-600 text-xs mt-1">Your brand coach will assign promo videos, bios, and more here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{date === "No due date" ? "No due date" : new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {grouped[date].map(a => (
                  <BrandAssignmentCard
                    key={a.id}
                    assignment={a}
                    submission={submissionMap[a.id]}
                    onSubmit={(assign) => setSubmitTarget(assign)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <BrandSubmissionModal
        assignment={submitTarget}
        open={!!submitTarget}
        onClose={() => setSubmitTarget(null)}
        onSubmitted={onSubmitted}
      />
    </div>
  );
}