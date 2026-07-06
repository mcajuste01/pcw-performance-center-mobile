import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { PROGRESS_LEVELS, toArray } from "./constants";

export default function ProgressLevelsSection({ traineeId }) {
  const { data: profile } = useQuery({
    queryKey: ["perf-level-profile", traineeId],
    queryFn: () =>
      base44.entities.FitnessProfile.filter({ trainee_id: traineeId }),
    enabled: !!traineeId,
  });

  const currentLevel = toArray(profile)[0]?.current_level || "foundation";
  const currentIndex = PROGRESS_LEVELS.findIndex((l) => l.key === currentLevel);

  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {PROGRESS_LEVELS.map((lvl, idx) => {
            const isCurrent = lvl.key === currentLevel;
            const isPast = idx < currentIndex;
            return (
              <React.Fragment key={lvl.key}>
                <div className="flex flex-col items-center text-center min-w-[80px]">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition"
                    style={{
                      background: isCurrent ? `${lvl.color}25` : isPast ? `${lvl.color}15` : "#0a0a0a",
                      borderColor: isCurrent || isPast ? lvl.color : "#2a2a2a",
                      color: isCurrent || isPast ? lvl.color : "#4b5563",
                    }}
                  >
                    {lvl.order}
                  </div>
                  <p
                    className="text-[10px] mt-1 font-medium whitespace-nowrap"
                    style={{ color: isCurrent ? lvl.color : isPast ? "#9ca3af" : "#4b5563" }}
                  >
                    {lvl.name}
                  </p>
                </div>
                {idx < PROGRESS_LEVELS.length - 1 && (
                  <ChevronRight
                    className="w-4 h-4 flex-shrink-0 mt-[-12px]"
                    style={{ color: idx < currentIndex ? "#8b3dff" : "#2a2a2a" }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {PROGRESS_LEVELS[currentIndex] && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: "#0a0a0a" }}>
            <p className="text-sm" style={{ color: PROGRESS_LEVELS[currentIndex].color }}>
              {PROGRESS_LEVELS[currentIndex].description}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PROGRESS_LEVELS[currentIndex].focus.map((f) => (
                <span
                  key={f}
                  className="px-2 py-0.5 rounded-full text-[10px] text-gray-400"
                  style={{ background: "#1a1a1a" }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}