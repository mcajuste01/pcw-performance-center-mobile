import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Megaphone,
  AlertTriangle,
  Calendar,
  ClipboardList,
  TrendingUp,
  UserPlus,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

export default function CoachPanel({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [announcement, setAnnouncement] = useState("");

  const { data: trainees = [] } = useQuery({
    queryKey: ["coachTrainees"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.filter({ role: "trainee" }, "full_name", 500);
      return toArray(res);
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["coachAssignments"],
    queryFn: async () => {
      const res = await base44.entities.Assignment.list("-due_date", 50);
      return toArray(res);
    },
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["todayCheckIns"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await base44.entities.CheckIn.filter({ check_in_date: today });
      return toArray(res);
    },
  });

  const pendingAssignments = assignments.filter(a => a.status === "submitted");
  const overdueAssignments = assignments.filter(a => 
    a.status === "assigned" && new Date(a.due_date) < new Date()
  );

  const broadcastMutation = useMutation({
    mutationFn: async (message) => {
      await Promise.all(
        trainees.map((t) =>
          base44.entities.Notification.create({
            user_id: t.auth_user_id || t.id,
            type: "broadcast",
            title: "📢 Coach Announcement",
            message,
            sender_id: user?.id,
            read: false,
          }).catch(() => null)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`Announcement sent to ${trainees.length} trainees!`);
      setAnnouncement("");
      setActiveTab("overview");
    },
    onError: () => toast.error("Failed to send announcement"),
  });

  const handleBroadcast = () => {
    if (!announcement.trim()) {
      toast.error("Write a message first");
      return;
    }
    broadcastMutation.mutate(announcement.trim());
  };

  return (
    <Card className="border-gray-800 bg-gradient-to-br from-purple-900/20 to-red-900/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Coach Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Active Trainees"
                value={trainees.length}
                icon={Users}
                color="text-blue-400"
              />
              <StatCard
                label="Today's Attendance"
                value={checkIns.length}
                icon={Calendar}
                color="text-green-400"
              />
              <StatCard
                label="Pending Reviews"
                value={pendingAssignments.length}
                icon={ClipboardList}
                color="text-orange-400"
              />
              <StatCard
                label="Overdue"
                value={overdueAssignments.length}
                icon={AlertTriangle}
                color="text-red-400"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setActiveTab("broadcast")}>
                <Megaphone className="w-4 h-4 mr-2" />
                Announce
              </Button>
              <Button size="sm" variant="outline" className="border-gray-600" onClick={() => navigate(createPageUrl("RoleManagement"))}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
              <Button size="sm" variant="outline" className="border-gray-600" onClick={() => navigate(createPageUrl("CreateAssignment"))}>
                <ClipboardList className="w-4 h-4 mr-2" />
                Assign
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="roster">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {trainees.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                        {(t.wrestling_name || t.full_name || "?")[0]}
                      </div>
                      <div>
                       <p className="text-sm text-white">{t.wrestling_name || t.full_name}</p>
                       {t.wrestling_name && t.wrestling_name !== t.full_name && (
                         <p className="text-xs text-gray-400">{t.full_name}</p>
                       )}
                       <p className="text-xs text-gray-500">{t.tier || "T1"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {t.tier || "T1"}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="grading">
            <ScrollArea className="h-[300px]">
              {pendingAssignments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending submissions</p>
              ) : (
                <div className="space-y-2">
                  {pendingAssignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                    >
                      <div>
                        <p className="text-sm text-white">{a.title}</p>
                        <p className="text-xs text-gray-500">
                          Submitted {format(new Date(a.updated_date), "MMM d")}
                        </p>
                      </div>
                      <Button size="sm" className="bg-purple-600" onClick={() => navigate(createPageUrl("Assignments"))}>
                        Grade
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="broadcast">
            <div className="space-y-4">
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Write an announcement to all trainees..."
                className="w-full h-24 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <div className="flex gap-2">
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleBroadcast}
                  disabled={!announcement.trim() || broadcastMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {broadcastMutation.isPending ? "Sending..." : "Send Announcement"}
                </Button>
                <Button variant="outline" className="border-gray-600" onClick={() => navigate(createPageUrl("Events"))}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Event
                </Button>
              </div>
              <p className="text-xs text-gray-500">Sends a notification to all {trainees.length} trainees.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}