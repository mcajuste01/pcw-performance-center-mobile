import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function NotificationBell({ user }) {
  const { data: unreadDMs = [] } = useQuery({
    queryKey: ['unreadDirectMessages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const messages = await base44.entities.DirectMessage.filter({
        recipient_id: user.id,
        read: false
      }, '-created_date', 10);
      return toArray(messages);
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
    initialData: [],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForNotifications'],
    queryFn: async () => {
      const res = await base44.entities.User.list();
      return toArray(res);
    },
    initialData: [],
  });

  const { data: recentAssignments = [] } = useQuery({
    queryKey: ['recentAssignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const last24h = new Date();
      last24h.setHours(last24h.getHours() - 24);
      
      const assignments = await base44.entities.Assignment.filter({
        trainee_id: user.id,
      }, '-created_date', 5);
      
      return toArray(assignments).filter(a => 
        new Date(a.created_date) >= last24h
      );
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
    initialData: [],
  });

  const totalNotifications = unreadDMs.length + recentAssignments.length;

  if (totalNotifications === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-400 hover:text-white"
        >
          <Bell className="w-5 h-5" />
          {totalNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-600 text-white h-5 min-w-[20px] flex items-center justify-center text-xs p-0">
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 border-gray-800"
        style={{ background: '#0a0a0a' }}
      >
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Notifications</h3>
          <p className="text-xs text-gray-500">{totalNotifications} unread</p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {unreadDMs.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-400 px-2 mb-2">Direct Messages</p>
              {unreadDMs.map((msg) => {
                const sender = allUsers.find(u => u.id === msg.sender_id);
                return (
                  <Link
                    key={msg.id}
                    to={createPageUrl("DirectMessages")}
                    className="block p-3 rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                           style={{ background: 'linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)' }}>
                        <span className="text-white text-xs font-bold">
                          {(sender?.wrestling_name || sender?.full_name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {sender?.wrestling_name || sender?.full_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {msg.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(msg.created_date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          
          {recentAssignments.length > 0 && (
            <div className="p-2 border-t border-gray-800">
              <p className="text-xs font-semibold text-gray-400 px-2 mb-2">New Assignments</p>
              {recentAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={createPageUrl("Assignments")}
                  className="block p-3 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <p className="text-sm font-medium text-white">{assignment.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    New assignment • {assignment.tier}
                  </p>
                  {assignment.due_date && (
                    <p className="text-xs text-gray-600 mt-1">
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}