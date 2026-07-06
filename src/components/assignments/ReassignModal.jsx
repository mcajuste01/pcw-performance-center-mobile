import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";

export default function ReassignModal({ assignment, assignments, user, profiles = [], onClose }) {
  const queryClient = useQueryClient();
  const allAssignments = assignments || (assignment ? [assignment] : []);
  const [tier, setTier] = useState(allAssignments[0]?.tier || "All");
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [dueDate, setDueDate] = useState(assignment?.due_date || "");
  const [search, setSearch] = useState("");

  const trainees = profiles
    .filter(p => p.role === "trainee")
    .filter(p => !search || (p.wrestling_name || p.full_name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.wrestling_name || a.full_name || "").localeCompare(b.wrestling_name || b.full_name || ""));

  const reassignMutation = useMutation({
    mutationFn: async () => {
      const payloads = [];
      allAssignments.forEach(a => {
        const basePayload = {
          title: a.title,
          description: a.description,
          tier,
          assignment_type: a.assignment_type,
          reference_video_link: a.reference_video_link || undefined,
          resource_ids: a.resource_ids || [],
          action_link: a.action_link || null,
          tags: a.tags?.length ? a.tags : undefined,
          coach_id: user?.id,
          status: "assigned",
          submission_status: "not_started",
          due_date: dueDate || undefined,
        };
        if (selectedTrainees.length > 0) {
          selectedTrainees.forEach(tid => payloads.push({ ...basePayload, trainee_id: tid }));
        } else {
          payloads.push({ ...basePayload, trainee_id: null });
        }
      });
      return await base44.entities.Assignment.bulkCreate(payloads);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      const count = Array.isArray(res) ? res.length : 1;
      const label = allAssignments.length > 1 ? `${allAssignments.length} assignments` : "Assignment";
      toast.success(`${label} re-assigned to ${count} ${count === 1 ? "recipient" : "recipients"}`);
      onClose();
    },
  });

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleTrainee = (id) => {
    setSelectedTrainees(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0f0f0f", border: "1px solid rgba(139,61,255,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Rajdhani, sans-serif" }}>Re-assign Assignment</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {allAssignments.length > 1 ? `${allAssignments.length} assignments selected` : assignment?.title}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Members</SelectItem>
                <SelectItem value="T1">T1</SelectItem>
                <SelectItem value="T2">T2</SelectItem>
                <SelectItem value="T3">T3</SelectItem>
                <SelectItem value="Graduated">Graduated</SelectItem>
                <SelectItem value="PCW Wrestler">PCW Wrestlers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Due Date</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white" />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-2 block">
              Specific Trainees <span className="text-gray-600 font-normal">(optional — creates one copy per trainee)</span>
            </Label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search trainees..."
                className="bg-gray-900 border-gray-700 text-white pl-9 h-9" />
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto rounded-lg border border-gray-800 bg-[#0a0a0a] p-2">
              {trainees.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No trainees found</p>
              ) : trainees.map(p => {
                const checked = selectedTrainees.includes(p.auth_user_id);
                return (
                  <label key={p.id} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-900">
                    <input type="checkbox" checked={checked} onChange={() => toggleTrainee(p.auth_user_id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{p.wrestling_name || p.full_name}</p>
                      <p className="text-xs text-gray-500">{p.tier}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {selectedTrainees.length > 0 && (
              <p className="text-xs mt-2" style={{ color: "#a78bfa" }}>
                {selectedTrainees.length} selected — will create {selectedTrainees.length} assignment{selectedTrainees.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Button variant="outline" onClick={onClose} style={{ borderColor: "#555", color: "#999" }}>Cancel</Button>
          <Button onClick={() => reassignMutation.mutate()} disabled={reassignMutation.isPending}
            style={{ background: "#8b3dff" }}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            {reassignMutation.isPending ? "Re-assigning..." : "Re-assign"}
          </Button>
        </div>
      </div>
    </div>
  );
}