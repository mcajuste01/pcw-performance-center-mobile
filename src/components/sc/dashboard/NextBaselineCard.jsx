import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, CalendarClock } from "lucide-react";

export default function NextBaselineCard({ latestTest, nextDate }) {
  const overdue = nextDate && new Date(nextDate) < new Date();
  return (
    <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" style={{ color: "#8b3dff" }} /> Next Baseline Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        {nextDate ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,61,255,0.15)" }}>
              <CalendarClock className="w-6 h-6" style={{ color: "#8b3dff" }} />
            </div>
            <div>
              <p className="text-white font-semibold">{new Date(nextDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
              <p className="text-xs" style={{ color: overdue ? "#dc2626" : "#6b7280" }}>
                {overdue ? "Overdue — schedule soon" : "Scheduled retest window"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-sm text-center py-6">No baseline test on record yet.</p>
        )}
        {latestTest && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">Last Test</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{new Date(latestTest.test_date).toLocaleDateString()}</span>
              <Badge variant="outline" className={`text-[10px] capitalize ${latestTest.status === "approved" ? "border-green-700 text-green-400" : "border-gray-700 text-gray-400"}`}>
                {latestTest.status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}