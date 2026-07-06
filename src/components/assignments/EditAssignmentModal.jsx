import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditAssignmentModal({ assignment, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: assignment.title || "",
    description: assignment.description || "",
    tier: assignment.tier || "All",
    assignment_type: assignment.assignment_type || "promo",
    due_date: assignment.due_date || "",
    reference_video_link: assignment.reference_video_link || "",
    tags: (assignment.tags || []).join(", "),
  });

  const updateMutation = useMutation({
    mutationFn: () => base44.entities.Assignment.update(assignment.id, {
      title: form.title,
      description: form.description,
      tier: form.tier,
      assignment_type: form.assignment_type,
      due_date: form.due_date || undefined,
      reference_video_link: form.reference_video_link || undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAssignments"] });
      toast.success("Assignment updated!");
      onClose();
    },
  });

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0f0f0f", border: "1px solid rgba(139,61,255,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Rajdhani, sans-serif" }}>Edit Assignment</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Title</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white" />
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white resize-none" rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Tier</Label>
              <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
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
              <Label className="text-gray-400 text-xs mb-1 block">Type</Label>
              <Select value={form.assignment_type} onValueChange={v => setForm({ ...form, assignment_type: v })}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="promo">Promo</SelectItem>
                  <SelectItem value="drill">Drill</SelectItem>
                  <SelectItem value="conditioning">Conditioning</SelectItem>
                  <SelectItem value="psychology">Psychology</SelectItem>
                  <SelectItem value="match_study">Match Study</SelectItem>
                  <SelectItem value="in_app_task">In-App Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Due Date</Label>
            <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white" />
          </div>

          {form.assignment_type === "match_study" && (
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Reference Video Link</Label>
              <Input value={form.reference_video_link} onChange={e => setForm({ ...form, reference_video_link: e.target.value })}
                placeholder="https://youtube.com/..."
                className="bg-gray-900 border-gray-700 text-white" />
            </div>
          )}

          <div>
            <Label className="text-gray-400 text-xs mb-1 block">Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g. Weekly Drills, Certification"
              className="bg-gray-900 border-gray-700 text-white" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Button variant="outline" onClick={onClose} style={{ borderColor: "#555", color: "#999" }}>Cancel</Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !form.title}
            style={{ background: "#8b3dff" }}>
            <Save className="w-4 h-4 mr-1.5" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}