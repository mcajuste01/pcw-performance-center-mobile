import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, CheckCircle2, X } from "lucide-react";
import { getDrillCategory } from "./wrestlingDrills";

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

// Build a flat timeline of intervals from the circuit drills + rounds
function buildTimeline(circuit) {
  const baseDrills = circuit.drills || [];
  const rounds = circuit.circuit_rounds || 1;
  const restBetween = circuit.rest_between_rounds_seconds || 0;
  const timeline = [];
  for (let r = 0; r < rounds; r++) {
    baseDrills.forEach((d, i) => {
      const rounds2 = d.rounds || 1;
      for (let k = 0; k < rounds2; k++) {
        timeline.push({ type: "work", seconds: d.work_seconds, drill: d, round: r + 1 });
        timeline.push({ type: "rest", seconds: d.rest_seconds, drill: d, round: r + 1 });
      }
    });
    if (r < rounds - 1 && restBetween > 0) {
      timeline.push({ type: "round_rest", seconds: restBetween, drill: null, round: r + 1 });
    }
  }
  return timeline;
}

export default function CircuitRunner({ circuit, open, onClose, onComplete }) {
  const timeline = React.useMemo(() => buildTimeline(circuit), [circuit]);
  const [stepIdx, setStepIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (open && timeline.length > 0) {
      setStepIdx(0);
      setRemaining(timeline[0].seconds);
      setRunning(true);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [open, circuit]);

  useEffect(() => {
    if (!running || stepIdx >= timeline.length) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          const nextIdx = stepIdx + 1;
          if (nextIdx >= timeline.length) {
            setRunning(false);
            return 0;
          }
          setStepIdx(nextIdx);
          return timeline[nextIdx].seconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, stepIdx, timeline]);

  if (!circuit) return null;

  const current = timeline[stepIdx];
  const isFinished = stepIdx >= timeline.length || (stepIdx === timeline.length - 1 && remaining === 0 && !running);

  const phaseColor = current?.type === "work"
    ? getDrillCategory(current.drill.category).color
    : current?.type === "round_rest" ? "#3b82f6" : "#6b7280";

  const handleSkip = () => {
    const nextIdx = stepIdx + 1;
    if (nextIdx >= timeline.length) {
      setRunning(false);
      setRemaining(0);
    } else {
      setStepIdx(nextIdx);
      setRemaining(timeline[nextIdx].seconds);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md"
        style={{ background: "#0a0a0a", border: `1px solid ${phaseColor}55` }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-center text-base">{circuit.title}</DialogTitle>
        </DialogHeader>

        {isFinished ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-3" style={{ color: "#10b981" }} />
            <p className="text-white text-xl font-bold">Circuit Complete!</p>
            <p className="text-gray-500 text-sm mt-1">You pushed through all {timeline.filter((t) => t.type === "work").length} work intervals.</p>
            <Button
              className="mt-5 text-white font-semibold px-6"
              style={{ background: "#10b981" }}
              onClick={() => { onComplete?.(); onClose(); }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Circuit Complete
            </Button>
          </div>
        ) : current ? (
          <div className="py-4">
            {/* Phase label */}
            <div className="text-center mb-2">
              <span
                className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{ background: `${phaseColor}22`, color: phaseColor }}
              >
                {current.type === "work" ? "Work" : current.type === "rest" ? "Rest" : "Round Break"}
              </span>
              {current.round > 1 && (
                <p className="text-[10px] text-gray-600 mt-1">Round {current.round}</p>
              )}
            </div>

            {/* Drill name */}
            <p className="text-center text-white text-2xl font-bold mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>
              {current.drill?.name || "Recover"}
            </p>
            {current.drill?.description && current.type === "work" && (
              <p className="text-center text-gray-500 text-xs mb-4 px-4">{current.drill.description}</p>
            )}

            {/* Countdown */}
            <div
              className="mx-auto rounded-2xl flex items-center justify-center mb-5"
              style={{
                width: 180, height: 180,
                background: `radial-gradient(circle, ${phaseColor}22 0%, transparent 70%)`,
                border: `2px solid ${phaseColor}55`,
              }}
            >
              <span className="text-6xl font-black" style={{ color: phaseColor, fontFamily: "Rajdhani, sans-serif" }}>
                {fmt(remaining)}
              </span>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {timeline.map((t, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === stepIdx ? 20 : 8,
                    background: i < stepIdx ? "#10b981" : i === stepIdx ? phaseColor : "#2a2a2a",
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300"
                onClick={() => setRunning(!running)}
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300"
                onClick={handleSkip}
              >
                <SkipForward className="w-4 h-4" /> Skip
              </Button>
              <Button
                variant="ghost"
                className="text-gray-500"
                onClick={onClose}
              >
                <X className="w-4 h-4" /> Exit
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}