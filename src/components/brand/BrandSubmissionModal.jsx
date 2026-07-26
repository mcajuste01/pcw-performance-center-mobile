import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { BRAND_TYPES } from "./brandConstants";

export default function BrandSubmissionModal({ assignment, open, onClose, onSubmitted }) {
  const [contentText, setContentText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const typeMeta = BRAND_TYPES[assignment?.type] || BRAND_TYPES.other;
  const isFileBased = ["promo_video", "photo_submission"].includes(assignment?.type);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(res.file_url);
      toast.success("File uploaded");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (isFileBased && !fileUrl) { toast.error("Please upload a file"); return; }
    if (!isFileBased && !contentText.trim()) { toast.error("Please enter your content"); return; }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke("submitBrandAssignment", {
        assignment_id: assignment.id,
        content_url: fileUrl || null,
        content_text: contentText || null,
      });
      toast.success("Submission sent!");
      onSubmitted?.(res.data?.submission);
      handleClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setContentText(""); setFileUrl(""); onClose();
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg" style={{ background: "#0f0f0f", border: "1px solid #333" }}>
        <DialogHeader>
          <DialogTitle className="text-white">Submit: {assignment.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isFileBased && (
            <div>
              <Label className="text-gray-300">{typeMeta.label} File</Label>
              <div className="mt-2 flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed" style={{ borderColor: "#444", background: "#0a0a0a" }}>
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{fileUrl ? "File uploaded ✓" : "Choose file"}</span>
                  <input type="file" accept={assignment.type === "promo_video" ? "video/*" : "image/*"} className="hidden" onChange={handleFile} disabled={uploading} />
                </label>
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
              </div>
            </div>
          )}
          <div>
            <Label className="text-gray-300">{isFileBased ? "Notes (optional)" : "Content"}</Label>
            <Textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder={isFileBased ? "Add any notes about your submission..." : "Write your bio, gimmick pitch, or content here..."}
              className="bg-gray-900 border-gray-700 text-white mt-2 min-h-[120px]"
            />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.08)" }}>
            <Shield className="w-4 h-4 text-yellow-500 shrink-0" />
            <p className="text-xs text-gray-400">If you are a minor, your submission will require guardian consent before it can be approved for posting.</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} style={{ borderColor: "#666", color: "#999" }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || uploading} style={{ background: "#8b3dff" }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}