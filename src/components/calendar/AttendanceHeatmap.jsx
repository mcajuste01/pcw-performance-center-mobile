import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { format, subDays, isSameDay, startOfWeek, addDays } from "date-fns";

export default function AttendanceHeatmap({ checkIns = [] }) {
  const today = new Date();
  const weeks = 12; // Show 12 weeks
  const daysToShow = weeks * 7;

  // Generate dates for the heatmap
  const startDate = subDays(today, daysToShow - 1);
  const dates = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));

  // Count check-ins per day
  const getCheckInCount = (date) => {
    return checkIns.filter(c => {
      const checkInDate = new Date(c.check_in_date || c.check_in_time);
      return isSameDay(checkInDate, date);
    }).length;
  };

  // Get intensity level (0-4)
  const getIntensity = (count) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
  };

  const intensityColors = {
    0: "bg-gray-800",
    1: "bg-purple-900/50",
    2: "bg-purple-700/70",
    3: "bg-purple-600",
    4: "bg-purple-500",
  };

  // Group by week
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeksArray = [];
  for (let w = 0; w < weeks; w++) {
    const weekDates = dates.slice(w * 7, (w + 1) * 7);
    weeksArray.push(weekDates);
  }

  const totalCheckIns = checkIns.length;
  const currentStreak = checkIns.length > 0 ? (checkIns[0]?.streak_count || 0) : 0;

  return (
    <Card className="border-gray-800 bg-[#0b0b0b]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Attendance Heatmap
          </CardTitle>
          <span className="text-xs text-gray-500">{totalCheckIns} check-ins</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            {weekDays.map((day, i) => (
              <div key={day} className="h-3 text-[9px] text-gray-500 flex items-center">
                {i % 2 === 0 ? day : ""}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1 overflow-x-auto">
            {weeksArray.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((date, di) => {
                  const count = getCheckInCount(date);
                  const intensity = getIntensity(count);
                  const isToday = isSameDay(date, today);

                  return (
                    <div
                      key={di}
                      className={`w-3 h-3 rounded-sm ${intensityColors[intensity]} ${
                        isToday ? "ring-1 ring-white" : ""
                      } hover:ring-1 hover:ring-purple-400 transition-all cursor-pointer group relative`}
                      title={`${format(date, "MMM d, yyyy")}: ${count} session${count !== 1 ? "s" : ""}`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 border border-gray-700">
                        {format(date, "MMM d")}: {count} session{count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${intensityColors[level]}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">More</span>
        </div>
      </CardContent>
    </Card>
  );
}