import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, ArrowLeft, Paperclip, RefreshCw, Tag, Users } from "lucide-react";
import ActionLinkPicker from "@/components/assignments/ActionLinkPicker";
import TemplatePicker from "@/components/assignments/TemplatePicker";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { addWeeks, addMonths, format, parseISO } from "date-fns";

export default function CreateAssignment() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tier: 'All',
    due_date: '',
    assignment_type: 'promo',
    reference_video_link: '',
    resource_ids: [],
    action_link: null,
    is_recurring: false,
    recurrence_pattern: 'weekly',
    recurrence_end_date: '',
    tags: [],
    trainee_ids: []
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check for edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const isEditMode = !!editId;

  // Load existing assignment for editing
  useEffect(() => {
    if (!editId) return;
    base44.entities.Assignment.filter({ id: editId }).then(res => {
      const arr = Array.isArray(res) ? res : (res?.items || []);
      const a = arr[0];
      if (!a) return;
      setFormData({
        title: a.title || '',
        description: a.description || '',
        tier: a.tier || 'All',
        due_date: a.due_date || '',
        assignment_type: a.assignment_type || 'promo',
        reference_video_link: a.reference_video_link || '',
        resource_ids: a.resource_ids || [],
        action_link: a.action_link || null,
        is_recurring: a.is_recurring || false,
        recurrence_pattern: a.recurrence_pattern || 'weekly',
        recurrence_end_date: a.recurrence_end_date || '',
        tags: a.tags || [],
        trainee_ids: [],
      });
    }).catch(console.error);
  }, [editId]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        const hasCoachRole = currentUser.roles?.includes('coach') || currentUser.roles?.includes('admin') || currentUser.role === 'admin';
        if (!hasCoachRole) {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await base44.entities.Resource.list('-created_date', 100);
      return Array.isArray(res) ? res : (res?.items || []);
    },
    initialData: [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfilesCreateAssignment'],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.list();
      return Array.isArray(res) ? res : (res?.items || []);
    },
    initialData: [],
  });

  const trainees = profiles
    .filter(p => p.role === "trainee")
    .sort((a, b) => (a.wrestling_name || a.full_name || "").localeCompare(b.wrestling_name || b.full_name || ""));

  // Generate recurring due dates from a start date
  const getRecurringDates = (startDate, pattern, endDate) => {
    const dates = [];
    let current = parseISO(startDate);
    const end = parseISO(endDate);
    let instance = 1;
    while (current <= end) {
      dates.push({ date: format(current, 'yyyy-MM-dd'), instance });
      if (pattern === 'weekly') current = addWeeks(current, 1);
      else if (pattern === 'biweekly') current = addWeeks(current, 2);
      else if (pattern === 'monthly') current = addMonths(current, 1);
      instance++;
    }
    return dates;
  };

  const updateAssignmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.update(editId, {
      title: data.title,
      description: data.description,
      tier: data.tier,
      assignment_type: data.assignment_type,
      reference_video_link: data.reference_video_link,
      resource_ids: data.resource_ids,
      action_link: data.action_link,
      tags: data.tags?.length ? data.tags : undefined,
      due_date: data.due_date,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAssignments'] });
      toast.success("Assignment updated!");
      navigate(createPageUrl("Assignments"));
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data) => {
      const groupId = data.is_recurring ? `recurring-${Date.now()}` : undefined;

      let instances = [{ date: data.due_date, instance: 1 }];
      if (data.is_recurring && data.due_date && data.recurrence_end_date) {
        instances = getRecurringDates(data.due_date, data.recurrence_pattern, data.recurrence_end_date);
      }

      const basePayload = {
        title: data.title,
        description: data.description,
        tier: data.tier,
        assignment_type: data.assignment_type,
        reference_video_link: data.reference_video_link,
        resource_ids: data.resource_ids,
        action_link: data.action_link,
        tags: data.tags?.length ? data.tags : undefined,
        coach_id: user.id,
        trainee_id: null,
        status: 'assigned',
        submission_status: 'not_started',
        is_recurring: data.is_recurring,
        recurrence_pattern: data.is_recurring ? data.recurrence_pattern : undefined,
        recurrence_end_date: data.is_recurring ? data.recurrence_end_date : undefined,
        recurrence_group_id: groupId,
      };

      const traineeIds = data.trainee_ids || [];
      const recipients = traineeIds.length > 0 ? traineeIds : [null];

      const created = await Promise.all(
        instances.flatMap(({ date, instance }) =>
          recipients.map(traineeId =>
            base44.entities.Assignment.create({
              ...basePayload,
              due_date: date,
              recurrence_instance: instance,
              trainee_id: traineeId,
              title: instances.length > 1 ? `${data.title} (${instance}/${instances.length})` : data.title,
            })
          )
        )
      );

      // Link resources to first instance only
      await Promise.all((data.resource_ids || []).map(async (resourceId) => {
        const resource = resources.find((item) => item.id === resourceId);
        const currentAssignmentIds = resource?.assignment_ids || [];
        if (!currentAssignmentIds.includes(created[0].id)) {
          await base44.entities.Resource.update(resourceId, {
            assignment_ids: [...currentAssignmentIds, created[0].id]
          });
        }
      }));

      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      const count = created.length;
      toast.success(count > 1 ? `${count} recurring assignments created!` : "Assignment created successfully!");
      navigate(createPageUrl("Assignments"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.tier) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!isEditMode && formData.is_recurring && (!formData.due_date || !formData.recurrence_end_date)) {
      toast.error("Recurring assignments require a first due date and an end date");
      return;
    }
    if (isEditMode) {
      updateAssignmentMutation.mutate(formData);
    } else {
      createAssignmentMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Assignments"))}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assignments
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ClipboardList className="w-8 h-8" style={{ color: '#8b3dff' }} />
            {isEditMode ? 'Edit Task' : 'Create Task'}
          </h1>
          <p className="text-gray-400">{isEditMode ? 'Update assignment details' : 'Assign tasks to trainees by tier'}</p>
        </div>

        {!isEditMode && (
          <div className="mb-6">
            <TemplatePicker formData={formData} onLoad={setFormData} user={user} />
          </div>
        )}

        <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <CardTitle className="text-white">Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-gray-300">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="e.g., Record a 2-minute promo"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-300">Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white h-32"
                  placeholder="Detailed instructions for the task..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Tier *</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Members</SelectItem>
                      <SelectItem value="T1">T1 — Fundamentals</SelectItem>
                      <SelectItem value="T2">T2 — Intermediate</SelectItem>
                      <SelectItem value="T3">T3 — Advanced</SelectItem>
                      <SelectItem value="Graduated">Graduated</SelectItem>
                      <SelectItem value="PCW Wrestler">PCW Wrestlers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">Task Type *</Label>
                  <Select
                    value={formData.assignment_type}
                    onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promo">Promo</SelectItem>
                      <SelectItem value="drill">Drill</SelectItem>
                      <SelectItem value="conditioning">Conditioning</SelectItem>
                      <SelectItem value="psychology">Psychology</SelectItem>
                      <SelectItem value="match_study">Match Study</SelectItem>
                      <SelectItem value="in_app_task">In-App Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!isEditMode && (
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4" />
                    Assign to Specific Trainees <span className="text-gray-600 font-normal">(optional)</span>
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">Leave empty to assign tier-wide. Selecting trainees creates one copy per trainee.</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border border-gray-800 bg-[#0a0a0a] p-2">
                    {trainees.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No trainees found</p>
                    ) : trainees.map(p => {
                      const checked = formData.trainee_ids.includes(p.auth_user_id);
                      return (
                        <label key={p.id} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-900">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                trainee_ids: e.target.checked
                                  ? [...formData.trainee_ids, p.auth_user_id]
                                  : formData.trainee_ids.filter(id => id !== p.auth_user_id)
                              });
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{p.wrestling_name || p.full_name}</p>
                            <p className="text-xs text-gray-500">{p.tier}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {formData.trainee_ids.length > 0 && (
                    <p className="text-xs mt-2" style={{ color: '#a78bfa' }}>
                      {formData.trainee_ids.length} trainee{formData.trainee_ids.length !== 1 ? 's' : ''} selected
                      {formData.is_recurring && formData.due_date && formData.recurrence_end_date
                        ? ` × ${getRecurringDates(formData.due_date, formData.recurrence_pattern, formData.recurrence_end_date).length} dates`
                        : ''}
                    </p>
                  )}
                </div>
              )}

              <ActionLinkPicker
                value={formData.action_link}
                onChange={(link) => setFormData({
                  ...formData,
                  action_link: link,
                  assignment_type: link ? 'in_app_task' : formData.assignment_type
                })}
              />

              <div>
                <Label className="text-gray-300">First Due Date {formData.is_recurring ? '*' : '(Optional)'}</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  required={formData.is_recurring}
                />
              </div>

              <div>
                <Label className="text-gray-300 flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4" />
                  Tags <span className="text-gray-600 font-normal">(comma-separated, optional)</span>
                </Label>
                <Input
                  value={(formData.tags || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="e.g. Weekly Drills, Certification, Monthly Theory"
                />
                {formData.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(139,61,255,0.2)', color: '#a78bfa' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recurring Toggle */}
              <div className="rounded-lg border border-gray-800 p-4 space-y-4" style={{ background: '#0a0a0a' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" style={{ color: '#8b3dff' }} />
                    <Label className="text-gray-200 font-medium">Recurring Assignment</Label>
                  </div>
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(val) => setFormData({ ...formData, is_recurring: val })}
                  />
                </div>
                {formData.is_recurring && (
                  <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                    <div>
                      <Label className="text-gray-300">Repeat Every</Label>
                      <Select
                        value={formData.recurrence_pattern}
                        onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Every Week</SelectItem>
                          <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                          <SelectItem value="monthly">Every Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Repeat Until *</Label>
                      <Input
                        type="date"
                        value={formData.recurrence_end_date}
                        onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                        required
                        min={formData.due_date}
                      />
                    </div>
                    {formData.due_date && formData.recurrence_end_date && (
                      <div className="md:col-span-2 text-xs px-3 py-2 rounded" style={{ background: 'rgba(139,61,255,0.1)', color: '#a78bfa' }}>
                        {(() => {
                          const dates = getRecurringDates(formData.due_date, formData.recurrence_pattern, formData.recurrence_end_date);
                          return `${dates.length} assignment${dates.length !== 1 ? 's' : ''} will be created`;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.assignment_type === 'match_study' && (
                <div>
                  <Label className="text-gray-300">Reference Video Link (Optional)</Label>
                  <Input
                    value={formData.reference_video_link}
                    onChange={(e) => setFormData({ ...formData, reference_video_link: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Add a YouTube or Drive link for trainees to study</p>
                </div>
              )}

              <div>
                <Label className="text-gray-300 flex items-center gap-2 mb-2">
                  <Paperclip className="w-4 h-4" />
                  Attach Resources
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-gray-800 bg-[#0a0a0a] p-3">
                  {resources.length > 0 ? resources.map((resource) => {
                    const checked = formData.resource_ids.includes(resource.id);
                    return (
                      <label key={resource.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              resource_ids: e.target.checked
                                ? [...formData.resource_ids, resource.id]
                                : formData.resource_ids.filter((id) => id !== resource.id)
                            });
                          }}
                        />
                        <div>
                          <p className="text-sm text-white">{resource.title}</p>
                          {resource.comment && <p className="text-xs text-gray-500 mt-1">{resource.comment}</p>}
                        </div>
                      </label>
                    );
                  }) : (
                    <p className="text-sm text-gray-500">No resources available yet in the Resource Center.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("Assignments"))}
                  style={{ borderColor: '#666', color: '#999' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
                  style={{ background: '#8b3dff' }}
                >
                  {(createAssignmentMutation.isPending || updateAssignmentMutation.isPending) ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save Changes' : formData.is_recurring ? 'Create Recurring Tasks' : 'Create Task'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}