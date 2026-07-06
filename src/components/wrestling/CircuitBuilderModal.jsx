import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, X, Flame, Search } from "lucide-react";
import { PROGRESS_LEVELS, getLevelInfo } from "@/components/perflab/constants";
import { WRESTLING_DRILLS, DRILL_CATEGORIES, getDrillCategory, toArray } from "./wrestlingDrills";

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function CircuitBuilderModal({ open, onClose, coachId, trainees, level, onSaved, preselectedTrainee }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(level || "foundation");
  const [selectedTrainee, setSelectedTrainee] = useState("");
  const [circuitRounds, setCircuitRounds] = useState(1);
  const [restBetween, setRestBetween] = useState(60);
  const [drills, setDrills] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setSelectedLevel(level || "foundation");
      setSelectedTrainee(preselectedTrainee || "");
      setCircuitRounds(1);
      setRestBetween(60);
      setDrills([]);
      setSearch("");
      setActiveCat("all");
    }
  }, [open, level, preselectedTrainee]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.ConditioningCircuit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wrestling-circuits"] });
      toast({ title: "Circuit created & assigned!" });
      onSaved?.();
      onClose();
    },
    onError: (err) =>
      toast({ title: "Failed to create circuit", description: err.message, variant: "destructive" }),
  });

  const addDrill = (d) =>
    setDrills((prev) => [...prev, { ...d, rounds: 1 }]);

  const updateDrill = (idx, field, value) =>
    setDrills((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: field === "name" ? value : Number(value) || 0 } : d))
    );

  const removeDrill = (idx) =>
    setDrills((prev) => prev.filter((_, i) => i !== idx));

  const filteredLibrary = WRESTLING_DRILLS.filter((d) => {
    const matchCat = activeCat === "all" || d.category === activeCat;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalSeconds = drills.reduce(
    (sum, d) => sum + ((d.work_seconds + d.rest_seconds) * (d.rounds || 1)),
    0
  ) * circuitRounds + restBetween * (circuitRounds - 1);

  const handleSubmit = () => {
    if (!title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    if (drills.length === 0) return toast({ title: "Add at least one drill", variant: "destructive" });
    const traineeProfile = toArray(trainees).find((t) => t.auth_user_id === selectedTrainee);
    mutation.mutate({
      title: title.trim(),
      description,
      coach_id: coachId,
      trainee_id: selectedTrainee || "",
      trainee_name: traineeProfile?.wrestling_name || traineeProfile?.full_name || "",
      level: selectedLevel,
      drills: drills.map((d) => ({
        name: d.name,
        category: d.category,
        work_seconds: Number(d.work_seconds) || 30,
        rest_seconds: Number(d.rest_seconds) || 15,
        rounds: Number(d.rounds) || 1,
      })),
      circuit_rounds: Number(circuitRounds) || 1,
      rest_between_rounds_seconds: Number(restBetween) || 60,
      total_seconds: Math.round(totalSeconds),
      status: "active",
    });
  };

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";
  const lvl = getLevelInfo(selectedLevel);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Flame className="w-5 h-5" style={{ color: lvl.color }} />
            Build Conditioning Circuit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Assign to Trainee</Label>
              <select
                value={selectedTrainee}
                onChange={(e) => setSelectedTrainee(e.target.value)}
                className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}
              >
                <option value="">Template (no trainee)</option>
                {toArray(trainees).map((t) => (
                  <option key={t.id} value={t.auth_user_id}>
                    {t.wrestling_name || t.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Target Level</Label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}
              >
                {PROGRESS_LEVELS.map((l) => (
                  <option key={l.key} value={l.key}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-xs">Circuit Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Foundation Explosive Power Circuit"
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div>
            <Label className="text-gray-300 text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goal of this circuit..."
              className={`mt-1 ${inputCls}`}
              rows={2}
            />
          </div>

          {/* Drill Library */}
          <div>
            <Label className="text-gray-300 text-xs mb-2 block">Drill Library — tap to add</Label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drills..."
                className={`pl-9 ${inputCls} text-sm`}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                onClick={() => setActiveCat("all")}
                className="px-2.5 py-1 rounded-full text-[11px] border transition"
                style={activeCat === "all"
                  ? { background: "rgba(255,255,255,0.1)", borderColor: "#444", color: "#fff" }
                  : { background: "transparent", borderColor: "#2a2a2a", color: "#6b7280" }}
              >All</button>
              {DRILL_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveCat(c.key)}
                  className="px-2.5 py-1 rounded-full text-[11px] border transition"
                  style={activeCat === c.key
                    ? { background: `${c.color}22`, borderColor: `${c.color}66`, color: c.color }
                    : { background: "transparent", borderColor: "#2a2a2a", color: "#6b7280" }}
                >{c.name}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {filteredLibrary.map((d) => {
                const cat = getDrillCategory(d.category);
                const added = drills.some((x) => x.name === d.name);
                return (
                  <button
                    key={d.name}
                    onClick={() => !added && addDrill(d)}
                    disabled={added}
                    className="text-left p-2 rounded-lg border transition"
                    style={added
                      ? { background: "#0a0a0a", borderColor: "#1f1f1f", opacity: 0.4, cursor: "default" }
                      : { background: "#0a0a0a", borderColor: "#2a2a2a", cursor: "pointer" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                      <span className="text-white text-xs font-medium truncate">{d.name}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-0.5">{fmt(d.work_seconds)} work / {fmt(d.rest_seconds)} rest</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected drills */}
          {drills.length > 0 && (
            <div>
              <Label className="text-gray-300 text-xs mb-2 block">Circuit Sequence ({drills.length})</Label>
              <div className="space-y-1.5">
                {drills.map((d, idx) => {
                  const cat = getDrillCategory(d.category);
                  return (
                    <div key={idx} className="p-2.5 rounded-lg border" style={{ background: "#0a0a0a", borderColor: "#2a2a2a" }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-white text-xs font-medium">
                          <span className="text-gray-600">{idx + 1}.</span>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                          {d.name}
                        </span>
                        <button onClick={() => removeDrill(idx)} className="text-gray-600 hover:text-red-400 p-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-gray-600">Work (s)</span>
                          <Input type="number" value={d.work_seconds} onChange={(e) => updateDrill(idx, "work_seconds", e.target.value)} className={`${inputCls} text-xs h-8`} />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600">Rest (s)</span>
                          <Input type="number" value={d.rest_seconds} onChange={(e) => updateDrill(idx, "rest_seconds", e.target.value)} className={`${inputCls} text-xs h-8`} />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-600">Rounds</span>
                          <Input type="number" value={d.rounds} onChange={(e) => updateDrill(idx, "rounds", e.target.value)} className={`${inputCls} text-xs h-8`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Circuit settings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-300 text-xs">Circuit Rounds</Label>
              <Input type="number" value={circuitRounds} onChange={(e) => setCircuitRounds(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Rest Between (s)</Label>
              <Input type="number" value={restBetween} onChange={(e) => setRestBetween(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Est. Total</Label>
              <div className="mt-1 px-3 py-2 rounded-md text-sm font-semibold" style={{ background: `${lvl.color}15`, color: lvl.color }}>
                {fmt(totalSeconds)}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending} style={{ background: lvl.color }}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Create Circuit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}