import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Search, UserPlus, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

export default function InvitePartnerModal({ user, onClose, onInvited }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [groupType, setGroupType] = useState("pair");
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load all trainees via backend function (bypasses RLS for invite search)
  const { data: trainees = [], isLoading } = useQuery({
    queryKey: ["allTraineesForInvites"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listTraineesForInvites", {});
      const data = res?.data ?? res;
      return data?.trainees || [];
    },
    initialData: [],
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return trainees.slice(0, 20);
    const q = search.toLowerCase();
    return trainees
      .filter(
        (t) =>
          (t.full_name || "").toLowerCase().includes(q) ||
          (t.wrestling_name || "").toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [trainees, search]);

  const toggleSelect = (trainee) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id === trainee.auth_user_id);
      if (exists) return prev.filter((p) => p.id !== trainee.auth_user_id);
      if (groupType === "pair" && prev.length >= 1) {
        toast.info("Pairs are limited to 2 athletes. Replacing current selection.");
        return [{ id: trainee.auth_user_id, name: trainee.wrestling_name || trainee.full_name }];
      }
      return [...prev, { id: trainee.auth_user_id, name: trainee.wrestling_name || trainee.full_name }];
    });
  };

  const handleInvite = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one athlete to invite.");
      return;
    }
    const name = groupName.trim() || `${user.wrestling_name || user.full_name || "PCW"}'s ${groupType === "pair" ? "Pair" : "Pod"}`;
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("inviteToAccountabilityGroup", {
        groupType,
        groupName: name,
        inviteeIds: selected.map((s) => s.id),
      });
      const data = res?.data ?? res;
      toast.success(data?.message || "Invitations sent!");
      onInvited();
    } catch (error) {
      const errData = error?.response?.data || {};
      toast.error(errData?.error || error?.message || "Failed to send invitations.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#0f0f0f", border: "1px solid #333" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: "#8b3dff" }} />
            <h3 className="text-white font-semibold">Invite Accountability Partner</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Group type + name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Group Type</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setGroupType("pair"); if (selected.length > 1) setSelected(selected.slice(0, 1)); }}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={groupType === "pair"
                    ? { background: "#8b3dff", color: "#fff" }
                    : { background: "#1a1a1a", color: "#9ca3af", border: "1px solid #2a2a2a" }}
                >
                  Pair (2)
                </button>
                <button
                  onClick={() => setGroupType("pod")}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={groupType === "pod"
                    ? { background: "#8b3dff", color: "#fff" }
                    : { background: "#1a1a1a", color: "#9ca3af", border: "1px solid #2a2a2a" }}
                >
                  Pod (3+)
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Group Name (optional)</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Auto-named if blank"
                style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#fff" }}
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athletes by name or ring name…"
              className="pl-9"
              style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#fff" }}
            />
          </div>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                  style={{ background: "rgba(139,61,255,0.15)", color: "#c4a8ff", border: "1px solid rgba(139,61,255,0.3)" }}
                >
                  {s.name}
                  <button onClick={() => toggleSelect({ auth_user_id: s.id, wrestling_name: s.name, full_name: s.name })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Athlete list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-8">
              {search ? "No athletes found." : "No other trainees available."}
            </p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((t) => {
                const isSelected = selected.some((s) => s.id === t.auth_user_id);
                return (
                  <button
                    key={t.auth_user_id}
                    onClick={() => toggleSelect(t)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left"
                    style={{
                      background: isSelected ? "rgba(139,61,255,0.1)" : "#0a0a0a",
                      border: isSelected ? "1px solid rgba(139,61,255,0.3)" : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
                      <span className="text-xs font-bold text-white">
                        {(t.wrestling_name || t.full_name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {t.wrestling_name || t.full_name}
                      </p>
                      {t.wrestling_name && t.full_name && (
                        <p className="text-xs text-gray-600 truncate">{t.full_name}</p>
                      )}
                    </div>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isSelected ? "#8b3dff" : "transparent",
                        border: isSelected ? "none" : "1px solid #333",
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Button variant="outline" className="flex-1 border-gray-600 text-gray-300" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            style={{ background: "#8b3dff" }}
            onClick={handleInvite}
            disabled={submitting || selected.length === 0}
          >
            {submitting ? "Sending…" : `Invite ${selected.length || ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
