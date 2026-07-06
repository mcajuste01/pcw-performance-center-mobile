import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, MapPin, Plus } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";

const EVENT_TYPE_COLOR = {
  show: "#dc2626",
  training: "#8b3dff",
  showcase: "#f59e0b",
  conditioning: "#10b981",
};

function getLabel(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return { label: "Today", color: "#10b981" };
  if (isTomorrow(d)) return { label: "Tomorrow", color: "#f59e0b" };
  return { label: format(d, "MMM d"), color: "#6b7280" };
}

export default function UpcomingEventsWidget({ events = [] }) {
  const navigate = useNavigate();
  const upcoming = events
    .filter(e => e.status === "upcoming")
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5);

  return (
    <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-semibold text-white">Upcoming Events</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
            {upcoming.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(createPageUrl("Events"))}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors hover:bg-white/5"
            style={{ color: "#8b3dff" }}>
            <Plus className="w-3 h-3" />
            New
          </button>
          <Link to={createPageUrl("Events")}>
            <span className="text-xs text-purple-400 hover:text-purple-300 transition-colors">View all →</span>
          </Link>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-gray-600">
          <Calendar className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map(event => {
            const { label, color } = getLabel(event.event_date);
            const typeColor = EVENT_TYPE_COLOR[event.event_type] || "#8b3dff";
            return (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg group transition-colors hover:bg-white/[0.03]"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: typeColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{event.event_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-2.5 h-2.5" />
                        {event.location}
                      </span>
                    )}
                    <span className="text-xs capitalize" style={{ color: typeColor }}>{event.event_type}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}