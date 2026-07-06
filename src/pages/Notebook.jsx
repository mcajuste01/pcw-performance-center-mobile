import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, X, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

export default function Notebook() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    entry_type: 'general',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: entries = [] } = useQuery({
    queryKey: ['notebookEntries', user?.id],
    queryFn: async () => {
      const res = await base44.entities.NotebookEntry.filter({ trainee_id: user.id }, '-created_date');
      return toArray(res);
    },
    enabled: !!user,
    initialData: [],
  });

  const createEntryMutation = useMutation({
    mutationFn: (data) => base44.entities.NotebookEntry.create({
      ...data,
      trainee_id: user.id
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebookEntries'] });
      setShowForm(false);
      setFormData({
        entry_type: 'general',
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
      });
      toast.success("Entry saved!");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createEntryMutation.mutate(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'drill': return { bg: 'rgba(139, 61, 255, 0.2)', text: '#8b3dff' };
      case 'promo': return { bg: 'rgba(220, 38, 38, 0.2)', text: '#dc2626' };
      case 'injury': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      case 'match_reflection': return { bg: 'rgba(192, 192, 192, 0.2)', text: '#c0c0c0' };
      default: return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' };
    }
  };

  const filteredEntries = filterType === 'all' 
    ? (entries || [])
    : (entries || []).filter(e => e.entry_type === filterType);

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8" style={{ color: '#8b3dff' }} />
              Training Notebook
            </h1>
            <p className="text-gray-400">Your personal wrestling journal</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} style={{ background: '#8b3dff' }}>
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>

        {/* Entry Form */}
        {showForm && (
          <Card className="border-gray-800 mb-8" style={{ background: '#0f0f0f' }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                New Notebook Entry
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Entry Type *</Label>
                    <Select
                      value={formData.entry_type}
                      onValueChange={(value) => setFormData({ ...formData, entry_type: value })}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drill">Drill Notes</SelectItem>
                        <SelectItem value="promo">Promo Notes</SelectItem>
                        <SelectItem value="injury">Injury Log</SelectItem>
                        <SelectItem value="match_reflection">Match Reflection</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Date *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Entry title..."
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white h-40"
                    placeholder="Write your notes..."
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Tags</Label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {(formData.tags || []).map((tag, idx) => (
                      <Badge key={idx} className="bg-purple-900 text-purple-300">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-2">×</button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="Add tags..."
                    />
                    <Button type="button" onClick={addTag} variant="outline" style={{ borderColor: '#8b3dff', color: '#8b3dff' }}>
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                          style={{ borderColor: '#666', color: '#999' }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEntryMutation.isPending}
                          style={{ background: '#8b3dff' }}>
                    {createEntryMutation.isPending ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'drill', 'promo', 'injury', 'match_reflection', 'general'].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              onClick={() => setFilterType(type)}
              style={filterType === type ? { background: '#8b3dff' } : { borderColor: '#666', color: '#999' }}
            >
              {type === 'all' ? 'All' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          {(filteredEntries || []).map((entry) => {
            const typeColors = getTypeColor(entry.entry_type);
            return (
              <Card key={entry.id} className="border-gray-800" style={{ background: '#0f0f0f' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ background: typeColors.bg, color: typeColors.text }}>
                          {entry.entry_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(entry.date || entry.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-white text-xl">{entry.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 whitespace-pre-wrap mb-3">{entry.content}</p>
                  {entry.tags?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {entry.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-gray-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {(filteredEntries || []).length === 0 && (
            <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-500">No entries yet. Start writing!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}