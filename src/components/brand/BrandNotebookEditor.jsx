import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toArray } from "./brandConstants";

export default function BrandNotebookEditor({ athleteId, athleteName, userId, userFullName }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ persona_name: "", catchphrases: "", gimmick_notes: "", entrance_ideas: "" });
  const [saving, setSaving] = useState(false);
  const [entryId, setEntryId] = useState(null);

  const { data: entries = [] } = useQuery({
    queryKey: ["brand-notebook", athleteId],
    queryFn: async () => {
      const res = await base44.entities.BrandNotebookEntry.filter({ athlete_id: athleteId });
      return toArray(res);
    },
    enabled: !!athleteId,
  });

  useEffect(() => {
    if (entries.length > 0) {
      const e = entries[0];
      setEntryId(e.id);
      setForm({
        persona_name: e.persona_name || "",
        catchphrases: e.catchphrases || "",
        gimmick_notes: e.gimmick_notes || "",
        entrance_ideas: e.entrance_ideas || "",
      });
    } else {
      setEntryId(null);
      setForm({ persona_name: "", catchphrases: "", gimmick_notes: "", entrance_ideas: "" });
    }
  }, [entries]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        athlete_id: athleteId,
        athlete_name: athleteName,
        last_updated_by: userId,
        last_updated_by_name: userFullName || "",
      };
      if (entryId) {
        await base44.entities.BrandNotebookEntry.update(entryId, payload);
      } else {
        await base44.entities.BrandNotebookEntry.create(payload);
      }
      toast.success("Notebook saved!");
      queryClient.invalidateQueries({ queryKey: ["brand-notebook", athleteId] });
    } catch (err) {
      toast.error("Failed to save notebook");
    } finally {
      setSaving(false);
    }
  };

  if (!athleteId) {
    return <p className="text-gray-500 text-sm text-center py-8">Select a trainee to view their brand notebook</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" style={{ color: "#8b3dff" }} />
          <h3 className="text-white font-semibold text-sm">Brand Notebook — {athleteName}</h3>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} style={{ background: "#8b3dff" }}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </Button>
      </div>
      <div className="grid gap-3">
        <div>
          <Label className="text-gray-300 text-xs">Persona Name</Label>
          <Input value={form.persona_name} onChange={e => setForm({ ...form, persona_name: e.target.value })} placeholder="Ring name / persona" className="bg-gray-900 border-gray-700 text-white mt-1" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs">Catchphrases</Label>
          <Textarea value={form.catchphrases} onChange={e => setForm({ ...form, catchphrases: e.target.value })} placeholder="Signature lines and catchphrases..." className="bg-gray-900 border-gray-700 text-white mt-1 min-h-[60px]" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs">Gimmick Notes</Label>
          <Textarea value={form.gimmick_notes} onChange={e => setForm({ ...form, gimmick_notes: e.target.value })} placeholder="Character concept, alignment, backstory..." className="bg-gray-900 border-gray-700 text-white mt-1 min-h-[80px]" />
        </div>
        <div>
          <Label className="text-gray-300 text-xs">Entrance Ideas</Label>
          <Textarea value={form.entrance_ideas} onChange={e => setForm({ ...form, entrance_ideas: e.target.value })} placeholder="Music, moves, staging..." className="bg-gray-900 border-gray-700 text-white mt-1 min-h-[60px]" />
        </div>
      </div>
    </div>
  );
}