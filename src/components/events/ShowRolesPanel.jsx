import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const SHOW_ROLES = ["Wrestler", "Referee", "Manager/Valet", "Commentary", "Announcer", "Staff", "N/A"];

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function ShowRolesPanel({ event }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ["userProfilesForEvent"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.list();
      return toArray(res).filter(p => p.role !== "coach" && p.role !== "admin");
    },
    enabled: open,
    initialData: [],
  });

  const participants = event.participants || [];
  const showRoles = event.show_roles || {};

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const updated = { ...showRoles, [userId]: role };
      return base44.entities.Event.update(event.id, { show_roles: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => toast.error("Failed to save role"),
  });

  // Get display name for a participant
  const getName = (userId) => {
    const p = profiles.find(pr => pr.auth_user_id === userId || pr.id === userId);
    return p?.wrestling_name || p?.full_name || userId.slice(0, 8) + "…";
  };

  if (participants.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-800 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
      >
        <Users className="w-4 h-4" />
        Show Role Assignments ({participants.length})
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {participants.map((userId) => (
            <div key={userId} className="flex items-center justify-between gap-3 p-2 rounded-lg"
              style={{ background: "#0a0a0a", border: "1px solid #222" }}>
              <span className="text-sm text-white font-medium">{getName(userId)}</span>
              <Select
                value={showRoles[userId] || ""}
                onValueChange={(role) => updateRoleMutation.mutate({ userId, role })}
              >
                <SelectTrigger className="w-44 bg-gray-900 border-gray-700 text-white text-xs h-8">
                  <SelectValue placeholder="Assign role…" />
                </SelectTrigger>
                <SelectContent>
                  {SHOW_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}