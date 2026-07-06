import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

export default function SessionScheduler({ trainee, onSchedule }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    proposed_date: '',
    duration_minutes: 60,
    notes: ''
  });

  const handleSubmit = () => {
    if (!formData.proposed_date) {
      toast.error("Please select a date and time");
      return;
    }

    onSchedule({
      trainee_id: trainee.id,
      ...formData
    });
    setOpen(false);
    setFormData({ proposed_date: '', duration_minutes: 60, notes: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" style={{ borderColor: '#8b3dff', color: '#8b3dff' }}>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent style={{ background: '#0f0f0f', border: '1px solid #333' }}>
        <DialogHeader>
          <DialogTitle className="text-white">Schedule 1-on-1 Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-gray-300">Session Date & Time *</Label>
            <Input
              type="datetime-local"
              value={formData.proposed_date}
              onChange={(e) => setFormData({ ...formData, proposed_date: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Duration (minutes) *</Label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div>
            <Label className="text-gray-300">Session Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="What will you work on in this session?"
              className="bg-gray-900 border-gray-700 text-white h-24"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} style={{ borderColor: '#666', color: '#999' }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} style={{ background: '#8b3dff' }}>
              Schedule Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}