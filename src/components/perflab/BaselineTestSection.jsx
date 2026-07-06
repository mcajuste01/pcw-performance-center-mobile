import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ClipboardCheck, Plus, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { TEST_FIELDS, PROGRESS_LEVELS, toArray } from "./constants";

export default function BaselineTestSection({ traineeId, traineeName, isCoach }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    test_date: new Date().toISOString().slice(0, 10),
    test_type: "baseline",
  });

  const { data: tests = [], refetch } = useQuery({
    queryKey: ["baseline-tests", traineeId],
    queryFn: () =>
      base44.entities.BaselineTest.filter({ trainee_id: traineeId }, "-test_date"),
    enabled: !!traineeId,
  });
  const testList = toArray(tests);

  const mutation = useMutation({
    mutationFn: (data) =>
      base44.entities.BaselineTest.create({
        ...data,
        trainee_id: traineeId,
        trainee_name: traineeName,
      }),
    onSuccess: () => {
      toast({ title: "Test saved!" });
      setOpen(false);
      setForm({ test_date: new Date().toISOString().slice(0, 10), test_type: "baseline" });
      refetch();
    },
    onError: (e) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, level }) =>
      base44.entities.BaselineTest.update(id, {
        status: "approved",
        assigned_level: level,
      }),
    onSuccess: () => {
      toast({ title: "Test approved & level assigned!" });
      refetch();
    },
  });

  const inputCls = "bg-[#0a0a0a] border-gray-800 text-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" style={{ color: "#3b82f6" }} />
          Baseline Testing
        </h3>
        <Button onClick={() => setOpen(!open)} size="sm" style={{ background: "#8b3dff" }}>
          <Plus className="w-4 h-4 mr-1" /> {open ? "Close" : "Log Test"}
        </Button>
      </div>

      {open && (
        <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-xs">Date</Label>
                <Input
                  type="date"
                  value={form.test_date}
                  onChange={(e) => setForm({ ...form, test_date: e.target.value })}
                  className={`mt-1 ${inputCls}`}
                />
              </div>
              <div>
                <Label className="text-gray-300 text-xs">Type</Label>
                <select
                  value={form.test_type}
                  onChange={(e) => setForm({ ...form, test_type: e.target.value })}
                  className={`w-full mt-1 rounded-md border border-gray-800 ${inputCls} px-3 py-2 text-sm`}
                >
                  <option value="baseline">Baseline</option>
                  <option value="retest">Monthly Retest</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TEST_FIELDS.map((f) => (
                <div key={f.key}>
                  <Label className="text-gray-300 text-xs">{f.label}</Label>
                  <Input
                    type="number"
                    placeholder={f.placeholder}
                    value={form[f.key] || ""}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: parseFloat(e.target.value) || undefined })
                    }
                    className={`mt-1 ${inputCls}`}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Cardio Test Result</Label>
              <Input
                placeholder="e.g. 8:30 mile, beep test level 9"
                value={form.cardio_test || ""}
                onChange={(e) => setForm({ ...form, cardio_test: e.target.value })}
                className={`mt-1 ${inputCls}`}
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs">Mobility Notes</Label>
              <Textarea
                placeholder="Mobility observations..."
                value={form.mobility_notes || ""}
                onChange={(e) => setForm({ ...form, mobility_notes: e.target.value })}
                className={`mt-1 ${inputCls}`}
                rows={2}
              />
            </div>
            <Button
              onClick={() => mutation.mutate(form)}
              disabled={mutation.isPending}
              style={{ background: "#8b3dff" }}
            >
              {mutation.isPending ? "Saving..." : "Save Test Results"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {testList.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            No tests logged yet. Take a baseline test to get started.
          </p>
        ) : (
          testList.map((test) => (
            <Card key={test.id} className="border-gray-800" style={{ background: "#0f0f0f" }}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="capitalize border-gray-700 text-gray-400"
                    >
                      {test.test_type}
                    </Badge>
                    <span className="text-gray-400 text-sm">
                      {new Date(test.test_date).toLocaleDateString()}
                    </span>
                    {test.status === "approved" ? (
                      <Badge className="bg-green-900/30 text-green-400 border border-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-800 text-yellow-500">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                  {test.assigned_level && (
                    <Badge
                      style={{
                        background: `${PROGRESS_LEVELS.find((l) => l.key === test.assigned_level)?.color}25`,
                        color: PROGRESS_LEVELS.find((l) => l.key === test.assigned_level)?.color,
                      }}
                    >
                      {PROGRESS_LEVELS.find((l) => l.key === test.assigned_level)?.name}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {TEST_FIELDS.map((f) => (
                    <div key={f.key} className="text-center p-2 rounded-lg" style={{ background: "#0a0a0a" }}>
                      <p className="text-white font-bold">{test[f.key] ?? "—"}</p>
                      <p className="text-[10px] text-gray-500">{f.label.split(" (")[0]}</p>
                    </div>
                  ))}
                </div>
                {test.mobility_notes && (
                  <p className="text-xs text-gray-500 mt-2">Mobility: {test.mobility_notes}</p>
                )}
                {isCoach && test.status !== "approved" && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">Assign level:</span>
                    {PROGRESS_LEVELS.map((lvl) => (
                      <button
                        key={lvl.key}
                        onClick={() =>
                          approveMutation.mutate({ id: test.id, level: lvl.key })
                        }
                        className="px-2 py-0.5 rounded-full text-[10px] border transition"
                        style={{ background: "#0a0a0a", color: lvl.color, borderColor: `${lvl.color}50` }}
                      >
                        {lvl.name}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}