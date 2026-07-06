import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Scale } from "lucide-react";
import BodyProgressChart from "./BodyProgressChart";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);
const SC_TYPES = ["strength", "conditioning"];

export default function TraineeSCDetail({
  open,
  onClose,
  trainee,
  onAssignRoutine,
  onLogStats,
}) {
  const traineeId = trainee?.auth_user_id;

  const { data: stats = [] } = useQuery({
    queryKey: ["body-stats", traineeId],
    queryFn: () =>
      traineeId
        ? base44.entities.BodyStat.filter({ trainee_id: traineeId }, "date", 50)
        : [],
    enabled: !!traineeId && open,
    initialData: [],
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["sc-trainee-logs", traineeId],
    queryFn: () =>
      traineeId
        ? base44.entities.TrainingLog.filter(
            { trainee_id: traineeId },
            "-date",
            20
          )
        : [],
    enabled: !!traineeId && open,
    initialData: [],
  });

  const scLogs = toArray(logs).filter((l) => SC_TYPES.includes(l.drill_type));
  const statCount = toArray(stats).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
        style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {trainee?.wrestling_name || trainee?.full_name}
            {trainee?.tier && (
              <Badge
                variant="outline"
                className="text-[10px] border-gray-700 text-gray-400"
              >
                {trainee.tier}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div
              className="p-3 rounded-lg border border-gray-800 text-center"
              style={{ background: "#0a0a0a" }}
            >
              <Scale className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-white font-bold text-lg">{statCount}</p>
              <p className="text-[10px] text-gray-500">Stat Entries</p>
            </div>
            <div
              className="p-3 rounded-lg border border-gray-800 text-center"
              style={{ background: "#0a0a0a" }}
            >
              <Dumbbell className="w-5 h-5 mx-auto mb-1 text-gray-500" />
              <p className="text-white font-bold text-lg">{scLogs.length}</p>
              <p className="text-[10px] text-gray-500">S&C Sessions</p>
            </div>
            <div
              className="p-3 rounded-lg border border-gray-800 text-center"
              style={{ background: "#0a0a0a" }}
            >
              <p className="text-white font-bold text-lg">
                {scLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0)}
              </p>
              <p className="text-[10px] text-gray-500">Total Minutes</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onAssignRoutine?.(trainee)}
              className="flex-1"
              style={{ background: "#8b3dff" }}
            >
              <Dumbbell className="w-4 h-4 mr-1" /> Assign Routine
            </Button>
            <Button
              onClick={() => onLogStats?.(trainee)}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300"
            >
              <Scale className="w-4 h-4 mr-1" /> Log Body Stats
            </Button>
          </div>
          <BodyProgressChart traineeId={traineeId} compact />
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">
              Recent S&C Sessions
            </p>
            {scLogs.length > 0 ? (
              <div className="space-y-2">
                {scLogs.slice(0, 6).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-gray-800 flex items-center justify-between"
                    style={{ background: "#0a0a0a" }}
                  >
                    <div>
                      <span className="text-white font-medium text-sm capitalize">
                        {log.drill_type}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(log.date).toLocaleDateString()} ·{" "}
                        {log.duration_minutes || 0} min
                      </p>
                    </div>
                    {log.intensity && (
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize border-gray-700 text-gray-400"
                      >
                        {log.intensity}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center py-4">
                No S&C sessions logged.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}