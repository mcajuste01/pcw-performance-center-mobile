import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Flag } from "lucide-react";

export default function CoachNotesCard({ notes }) {
  const list = (notes || []).slice(0, 4);
  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <StickyNote className="w-5 h-5" style={{ color: "#8b3dff" }} /> Coach Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {list.length > 0 ? (
          <div className="space-y-2">
            {list.map((n) => (
              <div key={n.id} className="p-3 rounded-lg border" style={{ background: "#0a0a0a", borderColor: n.is_red_flag ? "rgba(220,38,38,0.4)" : "#1f1f1f" }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] capitalize border-gray-700 text-gray-400">{n.category || "general"}</Badge>
                  {n.is_red_flag && <span className="flex items-center gap-1 text-[10px]" style={{ color: "#dc2626" }}><Flag className="w-3 h-3" /> Red Flag</span>}
                </div>
                <p className="text-sm text-gray-200">{n.note_text}</p>
                {n.coach_name && <p className="text-xs text-gray-600 mt-1">— {n.coach_name}{n.date ? ` · ${new Date(n.date).toLocaleDateString()}` : ""}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-sm text-center py-8">No coach notes yet.</p>
        )}
      </CardContent>
    </Card>
  );
}