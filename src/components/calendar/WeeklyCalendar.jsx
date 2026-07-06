import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle, X, Flame } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

export default function WeeklyCalendar({ checkIns = [], streak = 0 }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Parse date strings as local time to avoid UTC offset shifting the day
  const parseLocalDate = (str) => {
    if (!str) return null;
    if (str.includes('T')) return new Date(str); // full ISO with time, use as-is
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const hasCheckIn = (date) => {
    return checkIns.some(c => {
      const checkInDate = parseLocalDate(c.check_in_date || c.check_in_time);
      return checkInDate && isSameDay(checkInDate, date);
    });
  };

  const sessionsThisWeek = days.filter(d => hasCheckIn(d)).length;
  const weeklyGoal = 3;
  const goalMet = sessionsThisWeek >= weeklyGoal;

  return (
    <Card className="border-gray-800 bg-[#0b0b0b]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            My Week
          </CardTitle>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-white">{streak} day streak</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            const checked = hasCheckIn(day);
            const isPast = day < today && !isToday;

            return (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 mb-1">
                  {format(day, "EEE")}
                </span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    checked
                      ? "bg-gradient-to-br from-purple-600 to-red-600"
                      : isToday
                      ? "border-2 border-purple-500 bg-purple-900/20"
                      : isPast
                      ? "bg-gray-800/50"
                      : "bg-gray-800/30"
                  }`}
                >
                  {checked ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : isPast ? (
                    <X className="w-4 h-4 text-gray-600" />
                  ) : (
                    <span className={`text-sm ${isToday ? "text-purple-400 font-bold" : "text-gray-500"}`}>
                      {format(day, "d")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly progress */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Weekly Goal</span>
            <span className={`text-xs font-medium ${goalMet ? "text-green-400" : "text-gray-400"}`}>
              {sessionsThisWeek}/{weeklyGoal} sessions
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goalMet ? "bg-green-500" : "bg-purple-600"
              }`}
              style={{ width: `${Math.min((sessionsThisWeek / weeklyGoal) * 100, 100)}%` }}
            />
          </div>
          {goalMet && (
            <p className="text-xs text-green-400 mt-2 text-center">
              🎉 Weekly goal achieved!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}