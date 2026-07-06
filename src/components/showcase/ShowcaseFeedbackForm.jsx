import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ShowcaseFeedbackForm({ trainees, currentUser }) {
  const queryClient = useQueryClient();
  const defaultMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [form, setForm] = useState({
    trainee_id: "",
    showcase_month: defaultMonth,
    title: "Monthly Showcase Feedback",
    strengths: "",
    areas_to_improve: "",
    coach_notes: "",
    score: "",
    visibility: "trainee_visible",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.ShowcaseFeedback.create({
        trainee_id: form.trainee_id,
        coach_id: currentUser.id,
        showcase_month: form.showcase_month,
        title: form.title,
        strengths: form.strengths,
        areas_to_improve: form.areas_to_improve,
        coach_notes: form.coach_notes,
        visibility: form.visibility,
        ...(form.score ? { score: Number(form.score) } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcaseFeedback"] });
      toast.success("Showcase feedback saved");
      setForm((prev) => ({
        ...prev,
        trainee_id: "",
        strengths: "",
        areas_to_improve: "",
        coach_notes: "",
        score: "",
      }));
    },
  });

  return (
    <Card className="border-gray-800 bg-[#0f0f0f]">
      <CardHeader>
        <CardTitle className="text-white">Submit showcase feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Trainee</Label>
            <Select value={form.trainee_id} onValueChange={(value) => setForm({ ...form, trainee_id: value })}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select trainee" />
              </SelectTrigger>
              <SelectContent>
                {trainees.map((trainee) => (
                  <SelectItem key={trainee.id} value={trainee.id}>
                    {trainee.wrestling_name || trainee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-300">Showcase month</Label>
            <Input
              type="month"
              value={form.showcase_month}
              onChange={(e) => setForm({ ...form, showcase_month: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Score</Label>
            <Input
              type="number"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <Label className="text-gray-300">Strengths</Label>
          <Textarea
            value={form.strengths}
            onChange={(e) => setForm({ ...form, strengths: e.target.value })}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div>
          <Label className="text-gray-300">Areas to improve</Label>
          <Textarea
            value={form.areas_to_improve}
            onChange={(e) => setForm({ ...form, areas_to_improve: e.target.value })}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div>
          <Label className="text-gray-300">Coach notes</Label>
          <Textarea
            value={form.coach_notes}
            onChange={(e) => setForm({ ...form, coach_notes: e.target.value })}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div>
          <Label className="text-gray-300">Visibility</Label>
          <Select value={form.visibility} onValueChange={(value) => setForm({ ...form, visibility: value })}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trainee_visible">Visible to trainee</SelectItem>
              <SelectItem value="private">Private coach note</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => createMutation.mutate()}
          disabled={!form.trainee_id || !form.showcase_month || !form.title || createMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {createMutation.isPending ? "Saving..." : "Save feedback"}
        </Button>
      </CardContent>
    </Card>
  );
}