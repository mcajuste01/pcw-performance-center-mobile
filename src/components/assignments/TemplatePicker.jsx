import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

export default function TemplatePicker({ formData, onLoad, user }) {
  const [expanded, setExpanded] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["assignmentTemplates"],
    queryFn: async () => {
      const res = await base44.entities.AssignmentTemplate.list("-created_date", 100);
      return toArray(res);
    },
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (name) =>
      base44.entities.AssignmentTemplate.create({
        name,
        description: formData.description || "",
        tier: formData.tier || "All",
        assignment_type: formData.assignment_type || "drill",
        tags: formData.tags || [],
        reference_video_link: formData.reference_video_link || "",
        is_recurring: formData.is_recurring || false,
        recurrence_pattern: formData.recurrence_pattern || "weekly",
        created_by: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentTemplates"] });
      toast.success("Template saved!");
      setTemplateName("");
      setShowSaveForm(false);
    },
    onError: () => toast.error("Failed to save template"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AssignmentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignmentTemplates"] });
      toast.success("Template deleted");
    },
  });

  const loadTemplate = (id) => {
    const t = templates.find(t => t.id === id);
    if (!t) return;
    onLoad({
      ...formData,
      title: t.name,
      description: t.description || "",
      tier: t.tier || "All",
      assignment_type: t.assignment_type || "drill",
      tags: t.tags || [],
      reference_video_link: t.reference_video_link || "",
      is_recurring: t.is_recurring || false,
      recurrence_pattern: t.recurrence_pattern || "weekly",
    });
    toast.success(`Loaded template: ${t.name}`);
  };

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden" style={{ background: "#0a0a0a" }}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-900/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Bookmark className="w-4 h-4" style={{ color: "#8b3dff" }} />
          Drill Templates
          {templates.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(139,61,255,0.15)", color: "#a78bfa" }}>
              {templates.length}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-gray-800">
          {isLoading ? (
            <p className="text-xs text-gray-500 py-2">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">
              No templates yet. Fill out the form below and click "Save as Template" to create one.
            </p>
          ) : (
            <div className="space-y-1.5 pt-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    onClick={() => loadTemplate(t.id)}
                    className="flex-1 flex items-center gap-2 p-2 rounded-lg border border-gray-800 hover:border-purple-600/50 transition-colors text-left"
                    style={{ background: "#0f0f0f" }}
                  >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{t.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {t.assignment_type} · {t.tier}{t.tags?.length ? ` · ${t.tags.length} tag${t.tags.length !== 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(t.id)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showSaveForm ? (
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <Label className="text-gray-300 text-xs">Template Name</Label>
              <div className="flex gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="e.g., Weekly Promo Drill"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!templateName || saveMutation.isPending}
                  onClick={() => saveMutation.mutate(templateName)}
                  style={{ background: "#8b3dff" }}
                >
                  {saveMutation.isPending ? "…" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowSaveForm(true)}
              style={{ borderColor: "#8b3dff", color: "#a78bfa" }}
            >
              <BookmarkCheck className="w-3.5 h-3.5 mr-1.5" />
              Save current as template
            </Button>
          )}
        </div>
      )}
    </div>
  );
}