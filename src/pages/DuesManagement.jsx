import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  CreditCard,
  Shield,
  CheckCircle2,
  Ban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);
const monthLabel = (m) =>
  new Date(m + "-01T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
const shiftMonth = (m, delta) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const todayMonth = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
};

export default function DuesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selMonth, setSelMonth] = useState(todayMonth());

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: trainees = [] } = useQuery({
    queryKey: ["dues-trainees"],
    queryFn: async () => {
      const list = toArray(await base44.entities.UserProfile.filter({ role: "trainee" }));
      return list.filter((t) => t.tier !== "PCW Wrestler");
    },
  });

  const { data: duesRecords = [], isLoading } = useQuery({
    queryKey: ["dues-records", selMonth],
    queryFn: async () => toArray(await base44.entities.MonthlyDues.filter({ month: selMonth })),
    enabled: !!selMonth,
  });

  const getDues = (traineeId) => duesRecords.find((d) => d.trainee_id === traineeId);

  const toggleBlock = async (trainee) => {
    const existing = getDues(trainee.auth_user_id);
    try {
      if (existing) {
        await base44.entities.MonthlyDues.update(existing.id, {
          blocked: !existing.blocked,
          blocked_date: !existing.blocked ? new Date().toISOString().slice(0, 10) : null,
        });
      } else {
        await base44.entities.MonthlyDues.create({
          trainee_id: trainee.auth_user_id,
          trainee_name: trainee.wrestling_name || trainee.full_name,
          month: selMonth,
          blocked: true,
          blocked_date: new Date().toISOString().slice(0, 10),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["dues-records", selMonth] });
      toast({
        title: existing?.blocked ? "Unblocked" : "Blocked",
        description: trainee.wrestling_name || trainee.full_name,
      });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const markPaid = async (trainee) => {
    const existing = getDues(trainee.auth_user_id);
    try {
      if (existing) {
        await base44.entities.MonthlyDues.update(existing.id, {
          paid: true,
          paid_date: new Date().toISOString().slice(0, 10),
          confirmed_by: user?.id,
          blocked: false,
        });
      } else {
        await base44.entities.MonthlyDues.create({
          trainee_id: trainee.auth_user_id,
          trainee_name: trainee.wrestling_name || trainee.full_name,
          month: selMonth,
          paid: true,
          paid_date: new Date().toISOString().slice(0, 10),
          confirmed_by: user?.id,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["dues-records", selMonth] });
      toast({
        title: "Marked as paid",
        description: trainee.wrestling_name || trainee.full_name,
      });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const stats = {
    total: trainees.length,
    paid: duesRecords.filter((d) => d.paid).length,
    blocked: duesRecords.filter((d) => d.blocked).length,
    pending: trainees.length - duesRecords.filter((d) => d.paid).length,
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <CreditCard className="w-7 h-7" style={{ color: "#8b3dff" }} />
            Dues Management
          </h1>
          <p className="text-gray-400 text-sm">
            Verify monthly dues and manage trainee access blocks.
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelMonth(shiftMonth(selMonth, -1))}>
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <span className="text-white font-semibold">{monthLabel(selMonth)}</span>
          <Button variant="ghost" size="sm" onClick={() => setSelMonth(shiftMonth(selMonth, 1))}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Trainees" value={stats.total} color="#9ca3af" />
          <StatCard label="Paid" value={stats.paid} color="#10b981" />
          <StatCard label="Pending" value={stats.pending} color="#f59e0b" />
          <StatCard label="Blocked" value={stats.blocked} color="#dc2626" />
        </div>

        {/* Roster table */}
        <Card style={{ background: "#111", borderColor: "#1f1f1f" }}>
          <CardHeader>
            <CardTitle className="text-white text-sm">Trainee Dues Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
            ) : trainees.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No trainees found.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#1f1f1f" }}>
                {trainees.map((t) => {
                  const dues = getDues(t.auth_user_id);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {t.wrestling_name || t.full_name}
                          {t.tier && <span className="text-gray-500 ml-2">({t.tier})</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {dues?.paid ? (
                            <Badge className="bg-green-900/30 text-green-400 border-green-800/40">
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-900/20 text-yellow-500 border-yellow-800/30">
                              Not verified
                            </Badge>
                          )}
                          {dues?.blocked && (
                            <Badge className="bg-red-900/30 text-red-400 border-red-800/40">
                              Blocked
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!dues?.paid && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markPaid(t)}
                            className="gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={dues?.blocked ? "secondary" : "destructive"}
                          onClick={() => toggleBlock(t)}
                          className="gap-1"
                        >
                          {dues?.blocked ? (
                            <>
                              <Shield className="w-3.5 h-3.5" /> Unblock
                            </>
                            ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" /> Block
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "#1f1f1f", background: "#111" }}>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}