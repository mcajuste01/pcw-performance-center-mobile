import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function ReminderSystem({ user }) {
  const { data: assignments = [] } = useQuery({
    queryKey: ['reminderAssignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await base44.entities.Assignment.filter({ trainee_id: user.id, status: 'assigned' });
      return toArray(res);
    },
    enabled: !!user?.id,
    refetchInterval: 3600000, // Check every hour
    initialData: [],
  });

  useEffect(() => {
    if (!user?.id || assignments.length === 0) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check for assignments due within 24 hours
    const urgentAssignments = assignments.filter(a => {
      if (!a.due_date) return false;
      const dueDate = new Date(a.due_date);
      return dueDate <= tomorrow && dueDate >= now;
    });

    // Check for overdue assignments
    const overdueAssignments = assignments.filter(a => {
      if (!a.due_date) return false;
      return new Date(a.due_date) < now;
    });

    if (overdueAssignments.length > 0) {
      toast.error(
        `You have ${overdueAssignments.length} overdue assignment${overdueAssignments.length > 1 ? 's' : ''}!`,
        {
          duration: 10000,
          action: {
            label: 'View',
            onClick: () => window.location.href = '/assignments'
          }
        }
      );
    } else if (urgentAssignments.length > 0) {
      toast.warning(
        `${urgentAssignments.length} assignment${urgentAssignments.length > 1 ? 's are' : ' is'} due within 24 hours`,
        {
          duration: 8000,
          action: {
            label: 'View',
            onClick: () => window.location.href = '/assignments'
          }
        }
      );
    }

    // Check if user hasn't checked in for 3+ days
    const lastCheckIn = user.last_seen_chat ? new Date(user.last_seen_chat) : null;
    if (lastCheckIn) {
      const daysSinceCheckIn = Math.floor((now - lastCheckIn) / (1000 * 60 * 60 * 24));
      if (daysSinceCheckIn >= 3) {
        toast.info(
          `You haven't checked in for ${daysSinceCheckIn} days. Keep your streak alive!`,
          {
            duration: 8000,
            action: {
              label: 'Check In',
              onClick: () => window.location.href = '/check-in'
            }
          }
        );
      }
    }
  }, [assignments, user]);

  return null; // This is a system component with no UI
}