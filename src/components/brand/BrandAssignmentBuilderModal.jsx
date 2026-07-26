import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Users, Loader2, Search, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BRAND_TYPES, toArray } from "./brandConstants";

export default function BrandAssignmentBuilderModal({ user, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "promo_video", due_date: "" });
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: trainees = [] } = useQuery({
    queryKey: ["brand-trainees"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" });
      return toArray(res);
    },
  });

  const filtered = trainees.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.wrestling_name || "").toLowerCase().includes(q) || (t.full_name || "").toLowerCase().includes(q);
  });

  const toggleTrainee = (id) => {
    setSelectedTrainees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!form.title || selectedTrainees.length === 0) {
      toast.error("Title and at least one trainee are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("createBrandAssignment", {
        ...form,
        trainee_ids: selectedTrainees,
        assigned_by_name: user?.full_name || "",
      });
      toast.success(`${selectedTrainees.length} assignment${selectedTrainees.length > 1 ? "s" : ""} created!`);
      onCreated?.(res.data?.created);
      setOpen(false);
      setForm({ title: "", description: "", type: "promo_video", due_date: "" });
      setSelectedTrainees([]);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create assignments");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" style={{ background: "#8b3dff" }}>
          <Megaphone className="w-4 h-4 mr-2" /> New Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "#0f0f0f", border: "1px solid #333" }}>
        <DialogHeader>
          <DialogTitle className="text-white">Create Brand Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-300">Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Weekly Promo Cut" className="bg-gray-900 border-gray-700 text-white mt-1.5" />
          </div>
          <div>
            <Label className="text-gray-300">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What should the athlete submit?" className="bg-gray-900 border-gray-700 text-white mt-1.5 min-h-[80px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BRAND_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="bg-gray-900 border-gray-700 text-white mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-gray-300 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Assign To ({selectedTrainees.length} selected)</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trainees..." className="bg-gray-900 border-gray-700 text-white pl-9" />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1 rounded-lg border border-gray-800 p-2" style={{ background: "#0a0a0a" }}>
              {filtered.map(t => {
                const isSelected = selectedTrainees.includes(t.auth_user_id);
                return (
                  <button key={t.id} onClick={() => toggleTrainee(t.auth_user_id)} className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition" style={{ background: isSelected ? "rgba(139,61,255,0.1)" : "transparent" }}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0`} style={{ borderColor: isSelected ? "#8b3dff" : "#444", background: isSelected ? "#8b3dff" : "transparent" }}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-white">{t.wrestling_name || t.full_name}</span>
                    {t.tier && <span className="text-[10px] text-gray-500 ml-auto">{t.tier}</span>}
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="text-center text-gray-500 text-xs py-4">No trainees found</p>}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} style={{ borderColor: "#666", color: "#999" }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} style={{ background: "#8b3dff" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Create ${selectedTrainees.length > 1 ? `${selectedTrainees.length} Assignments` : "Assignment"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}