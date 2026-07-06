import React from "react";
import { CheckCircle, Video, ClipboardList, UserPlus, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function getEvent(item, type) {
  if (type === "checkin") return {
    icon: CheckCircle,
    color: "#10b981",
    text: `${item.trainee_name || "Someone"} checked in — ${item.session_type || "session"}`,
    date: item.check_in_time || item.check_in_date,
  };
  if (type === "video") return {
    icon: Video,
    color: "#8b3dff",
    text: `New video uploaded: ${item.title || "Untitled"}`,
    date: item.created_date,
  };
  if (type === "assignment") return {
    icon: ClipboardList,
    color: "#dc2626",
    text: `Assignment submitted: "${item.title || "Assignment"}"`,
    date: item.updated_date || item.created_date,
  };
  return null;
}

export default function ActivityFeed({ checkIns = [], videos = [], assignments = [] }) {
  const recentCheckIns = checkIns.slice(0, 5).map(c => ({ ...getEvent(c, "checkin"), id: c.id + "ci" }));
  const recentVideos = videos.slice(0, 3).map(v => ({ ...getEvent(v, "video"), id: v.id + "vi" }));
  const submittedAssignments = assignments.filter(a => a.status === "submitted").slice(0, 3).map(a => ({ ...getEvent(a, "assignment"), id: a.id + "as" }));

  const feed = [...recentCheckIns, ...recentVideos, ...submittedAssignments]
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  return (
    <div className="rounded-xl p-5" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-semibold">Live Activity Feed</p>
      {feed.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-600">
          <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map(({ icon: Icon, color, text, date, id }) => (
            <div key={id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${color}20` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 leading-snug">{text}</p>
                {date && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formatDistanceToNow(new Date(date), { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}