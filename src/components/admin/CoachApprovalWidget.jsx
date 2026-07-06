import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

export default function CoachApprovalWidget({ users = [] }) {
  const queryClient = useQueryClient();

  const coachRequests = users.filter(u => u.coach_request === true && u.role !== "coach");

  const approveMutation = useMutation({
    mutationFn: async ({ userId, profileId }) => {
      if (profileId) await base44.entities.UserProfile.update(profileId, { role: "coach", coach_request: false });
      try { await base44.entities.User.update(userId, { role: "coach" }); } catch (e) {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Coach approved!");
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ profileId }) => {
      if (profileId) await base44.entities.UserProfile.update(profileId, { coach_request: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Request denied.");
    },
  });

  return (
    <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: "#dc2626" }} />
          <p className="text-sm font-semibold text-white">Coach Approvals</p>
          {coachRequests.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#dc2626", color: "#fff" }}>
              {coachRequests.length}
            </span>
          )}
        </div>
        <Link to={createPageUrl("RoleManagement")}>
          <span className="text-xs text-purple-400 hover:text-purple-300 transition-colors">View all →</span>
        </Link>
      </div>

      {coachRequests.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-gray-600">
          <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coachRequests.slice(0, 4).map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "rgba(220,150,0,0.06)", border: "1px solid rgba(220,150,0,0.2)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
                {(u.wrestling_name || u.full_name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.wrestling_name || u.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => approveMutation.mutate({ userId: u.id, profileId: u._profile_id })}
                  disabled={approveMutation.isPending}
                  className="p-1.5 rounded-lg transition-colors hover:bg-green-900/30"
                  title="Approve">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </button>
                <button
                  onClick={() => denyMutation.mutate({ profileId: u._profile_id })}
                  disabled={denyMutation.isPending}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-900/30"
                  title="Deny">
                  <XCircle className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}