import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function AssignmentTemplate({ onApplyTemplate }) {
  const [open, setOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    title: '',
    description: '',
    assignment_type: 'drill',
  });
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const templates = [
    {
      id: 'promo-basics',
      name: 'Promo Basics',
      title: 'Record a 2-minute promo',
      description: 'Create a compelling 2-minute promo introducing your character. Focus on clarity, emotion, and delivery.',
      assignment_type: 'promo',
    },
    {
      id: 'bump-drill',
      name: 'Bump Practice',
      title: 'Complete 50 bumps',
      description: 'Practice proper bump technique. Record yourself doing 10 back bumps and 10 side bumps for review.',
      assignment_type: 'drill',
    },
    {
      id: 'cardio-test',
      name: 'Cardio Assessment',
      title: 'Complete conditioning circuit',
      description: 'Complete the standard conditioning circuit: 5 rounds of burpees, rope work, and running the ropes.',
      assignment_type: 'conditioning',
    },
    {
      id: 'match-study',
      name: 'Match Analysis',
      title: 'Analyze a classic match',
      description: 'Watch the assigned match and write a detailed analysis covering psychology, storytelling, and technique.',
      assignment_type: 'match_study',
    },
  ];

  const applyTemplate = (template) => {
    onApplyTemplate(template);
    setOpen(false);
    toast.success('Template applied');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" style={{ borderColor: '#8b3dff', color: '#8b3dff' }}>
          <FileText className="w-4 h-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="border-gray-800 max-w-2xl" style={{ background: '#0f0f0f' }}>
        <DialogHeader>
          <DialogTitle className="text-white">Assignment Templates</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose a template to quickly create common assignments
          </DialogDescription>
        </DialogHeader>
        
        {!showCreate ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {templates.map(template => (
              <div
                key={template.id}
                className="p-4 rounded-lg border border-gray-800 hover:border-purple-500 transition-colors cursor-pointer"
                style={{ background: '#0a0a0a' }}
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{template.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{template.title}</p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{template.description}</p>
                    <span className="text-xs px-2 py-1 rounded mt-2 inline-block"
                          style={{ background: 'rgba(139, 61, 255, 0.2)', color: '#8b3dff' }}>
                      {template.assignment_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Template Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Assignment Title</Label>
              <Input
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white h-24"
              />
            </div>
            <div>
              <Label className="text-gray-300">Type</Label>
              <Select value={newTemplate.assignment_type} onValueChange={(v) => setNewTemplate({ ...newTemplate, assignment_type: v })}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promo">Promo</SelectItem>
                  <SelectItem value="drill">Drill</SelectItem>
                  <SelectItem value="conditioning">Conditioning</SelectItem>
                  <SelectItem value="psychology">Psychology</SelectItem>
                  <SelectItem value="match_study">Match Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}