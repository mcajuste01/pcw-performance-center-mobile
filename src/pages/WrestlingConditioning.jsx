import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Flame, Plus, Play, Trash2, CheckCircle2, ChevronDown, ChevronRight, Clock, Dumbbell, Search,
} from "lucide-react";
import CircuitBuilderModal from "@/components/wrestling/CircuitBuilderModal";
import CircuitRunner from "@/components/wrestling/CircuitRunner";
import { PROGRESS_LEVELS, getLevelInfo } from "@/components/perflab/constants";
import { WRESTLING_DRILLS, DRILL_CATEGORIES, getDrillCategory, toArray } from "@/components/wrestling/wrestlingDrills";

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function WrestlingConditioning() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeLevel, setActiveLevel] = useState("foundation");
  const [modalOpen, setModalOpen] = useState(false);
  const [runnerCircuit, setRunnerCircuit] = useState(null);
  const [expandedCats, setExpandedCats] = useState({ all: true });
  const [drillSearch, setDrillSearch] = useState("");

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: traineeProfiles = [] } = useQuery({
    queryKey: ["wrestling-roster"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" });
      return toArray(res);
    },
  });

  const { data: circuits = [] } = useQuery({
    queryKey: ["wrestling-circuits"],
    queryFn: async () => {
      const res = await base44.entities.ConditioningCircuit.filter({}, "-created_date");
      return toArray(res);
    },
  });

  const isCoach = user?.role === "coach" || user?.role === "admin";

  const circuitsByLevel = useMemo(() => {
    const map = {};
    PROGRESS_LEVELS.forEach((l) => (map[l.key] = []));
    circuits.forEach((c) => { if (map[c.level]) map[c.level].push(c); });
    return map;
  }, [circuits]);

  const myCircuits = useMemo(
    () => circuits.filter((c) => c.trainee_id === user?.id && c.completion_status !== "completed"),
    [circuits, user]
  );
  const myCompleted = useMemo(
    () => circuits.filter((c) => c.trainee_id === user?.id && c.completion_status === "completed"),
    [circuits, user]
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ConditioningCircuit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wrestling-circuits"] });
      toast({ title: "Circuit deleted" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (circuit) =>
      base44.entities.ConditioningCircuit.update(circuit.id, {
        completion_status: "completed",
        completed_date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      toast({ title: "Circuit complete! 🔥" });
      queryClient.invalidateQueries({ queryKey: ["wrestling-circuits"] });
    },
  });

  const toggleCat = (key) =>
    setExpandedCats((prev) => ({ ...prev, [key]: !prev[key] }));

  const filteredDrills = WRESTLING_DRILLS.filter((d) =>
    d.name.toLowerCase().includes(drillSearch.toLowerCase()) ||
    d.description.toLowerCase().includes(drillSearch.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Flame className="w-8 h-8 text-red-500 animate-pulse" />
      </div>
    );
  }

  // ---------- TRAINEE VIEW ----------
  if (!isCoach) {
    return (
      <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
        <div className="max-w-5xl mx-auto space-y-6">
          <Header />

          {/* Assigned circuits */}
          <div>
            <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" /> My Assigned Circuits
            </h2>
            {myCircuits.length === 0 ? (
              <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
                <CardContent className="py-10 text-center">
                  <Flame className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No circuits assigned yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {myCircuits.map((c) => <CircuitCard key={c.id} circuit={c} onRun={() => setRunnerCircuit(c)} onComplete={() => completeMutation.mutate(c)} />)}
              </div>
            )}
          </div>

          {myCompleted.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed ({myCompleted.length})
              </p>
              <div className="space-y-1.5">
                {myCompleted.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-800" style={{ background: "#0a0a0a" }}>
                    <span className="text-gray-300 text-sm">{c.title}</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DrillLibrary
            drills={filteredDrills}
            expandedCats={expandedCats}
            toggleCat={toggleCat}
            search={drillSearch}
            setSearch={setDrillSearch}
          />
        </div>

        {runnerCircuit && (
          <CircuitRunner
            circuit={runnerCircuit}
            open={!!runnerCircuit}
            onClose={() => setRunnerCircuit(null)}
            onComplete={() => completeMutation.mutate(runnerCircuit)}
          />
        )}
      </div>
    );
  }

  // ---------- COACH VIEW ----------
  const levelCircuits = circuitsByLevel[activeLevel] || [];

  return (
    <div className="min-h-full p-4 md:p-8 overflow-auto" style={{ background: "#0a0a0a" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Header />
          <Button
            onClick={() => setModalOpen(true)}
            className="text-white font-semibold px-6"
            style={{ background: "linear-gradient(135deg, #dc2626, #8b3dff)" }}
          >
            <Plus className="w-4 h-4 mr-2" /> Build Circuit
          </Button>
        </div>

        {/* Level Tabs */}
        <div className="flex flex-wrap gap-2">
          {PROGRESS_LEVELS.map((l) => {
            const count = (circuitsByLevel[l.key] || []).length;
            return (
              <button
                key={l.key}
                onClick={() => setActiveLevel(l.key)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all border flex items-center gap-2"
                style={activeLevel === l.key
                  ? { background: `${l.color}22`, borderColor: `${l.color}66`, color: l.color }
                  : { background: "#1a1a1a", borderColor: "#2a2a2a", color: "#9ca3af" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                {l.name}
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Circuits at this level */}
        <div>
          {levelCircuits.length === 0 ? (
            <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardContent className="py-10 text-center">
                <Flame className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No circuits built for {getLevelInfo(activeLevel).name} yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {levelCircuits.map((c) => (
                <CircuitCard
                  key={c.id}
                  circuit={c}
                  showTrainee
                  onRun={() => setRunnerCircuit(c)}
                  onDelete={() => deleteMutation.mutate(c.id)}
                  onComplete={() => completeMutation.mutate(c)}
                />
              ))}
            </div>
          )}
        </div>

        <DrillLibrary
          drills={filteredDrills}
          expandedCats={expandedCats}
          toggleCat={toggleCat}
          search={drillSearch}
          setSearch={setDrillSearch}
        />
      </div>

      <CircuitBuilderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        coachId={user.id}
        trainees={traineeProfiles}
        level={activeLevel}
        onSaved={() => {}}
      />

      {runnerCircuit && (
        <CircuitRunner
          circuit={runnerCircuit}
          open={!!runnerCircuit}
          onClose={() => setRunnerCircuit(null)}
        />
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-5 h-5 text-red-500" />
        <span className="text-xs text-gray-500 uppercase tracking-widest">Wrestling Conditioning</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
        Conditioning Drills
      </h1>
      <p className="text-gray-500 text-sm mt-1">Wrestling-specific drill library and timed conditioning circuits</p>
    </div>
  );
}

function CircuitCard({ circuit, showTrainee, onRun, onDelete, onComplete }) {
  const lvl = getLevelInfo(circuit.level);
  const drills = circuit.drills || [];
  const workCount = drills.reduce((s, d) => s + (d.rounds || 1), 0);
  return (
    <Card className="border-gray-800 pcw-card-hover" style={{ background: "#0f0f0f" }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: lvl.color }} />
              {circuit.title}
            </CardTitle>
            {showTrainee && circuit.trainee_name && (
              <p className="text-xs text-gray-500 mt-0.5">{circuit.trainee_name}</p>
            )}
          </div>
          {circuit.completion_status === "completed" && (
            <Badge className="bg-green-600/20 text-green-300 border border-green-600/30">Done</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {circuit.description && <p className="text-xs text-gray-400">{circuit.description}</p>}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" style={{ color: lvl.color }} />{drills.length} drills</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(circuit.total_seconds || 0)}</span>
          {circuit.circuit_rounds > 1 && <span className="flex items-center gap-1"><Play className="w-3 h-3" />{circuit.circuit_rounds}× rounds</span>}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {drills.slice(0, 4).map((d, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${getDrillCategory(d.category).color}15`, color: getDrillCategory(d.category).color }}>
              {d.name}
            </span>
          ))}
          {drills.length > 4 && <span className="text-[10px] text-gray-600">+{drills.length - 4} more</span>}
        </div>
        <div className="flex items-center gap-2 pt-1">
          {circuit.completion_status !== "completed" && (
            <>
              <Button size="sm" className="text-white h-7 text-xs" style={{ background: lvl.color }} onClick={onRun}>
                <Play className="w-3 h-3 mr-1" /> Run
              </Button>
              <Button size="sm" variant="outline" className="border-green-800 text-green-400 hover:bg-green-900/20 h-7 text-xs" onClick={onComplete}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
              </Button>
            </>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" className="text-gray-500 hover:text-red-400 h-7 text-xs px-2 ml-auto" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DrillLibrary({ drills, expandedCats, toggleCat, search, setSearch }) {
  return (
    <div>
      <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
        <Dumbbell className="w-5 h-5 text-purple-400" /> Drill Library
      </h2>
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drills..."
          className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-800 bg-[#0a0a0a] text-white text-sm"
        />
      </div>
      <div className="space-y-2">
        {DRILL_CATEGORIES.map((cat) => {
          const catDrills = drills.filter((d) => d.category === cat.key);
          if (catDrills.length === 0) return null;
          const expanded = expandedCats[cat.key];
          const CatIcon = cat.icon;
          return (
            <div key={cat.key} className="rounded-lg border border-gray-800 overflow-hidden" style={{ background: "#0f0f0f" }}>
              <button
                onClick={() => toggleCat(cat.key)}
                className="w-full flex items-center justify-between p-3"
              >
                <span className="flex items-center gap-2">
                  <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                  <span className="text-white text-sm font-semibold">{cat.name}</span>
                  <span className="text-[10px] text-gray-600">({catDrills.length})</span>
                </span>
                {expanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
              </button>
              {expanded && (
                <div className="px-3 pb-3 space-y-1.5">
                  <p className="text-xs text-gray-500 mb-2">{cat.description}</p>
                  {catDrills.map((d) => (
                    <div key={d.name} className="p-2.5 rounded-lg border" style={{ background: "#0a0a0a", borderColor: "#1f1f1f" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{d.name}</span>
                        <span className="text-xs text-gray-500">{fmt(d.work_seconds)} / {fmt(d.rest_seconds)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
                      {d.tips && <p className="text-[10px] text-gray-600 mt-1 italic">💡 {d.tips}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}