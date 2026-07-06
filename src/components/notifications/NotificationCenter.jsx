"use client";

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  MessageSquare,
  Users,
  AtSign,
  UserPlus,
  Megaphone,
  Pin,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X,
  ClipboardList,
  Video,
  CheckCircle,
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

const typeIcons = {
  direct_message: MessageSquare,
  group_message: Users,
  mention: AtSign,
  message_request: UserPlus,
  announcement: Megaphone,
  pinned_message: Pin,
  assignment_submitted: ClipboardList,
  video_uploaded: Video,
  check_in_pending: CheckCircle,
  attendance_verified: CheckCircle,
  coach_request: Shield,
};

const typeColors = {
  direct_message: "text-blue-400",
  group_message: "text-purple-400",
  mention: "text-yellow-400",
  message_request: "text-green-400",
  announcement: "text-red-400",
  pinned_message: "text-orange-400",
  assignment_submitted: "text-purple-400",
  video_uploaded: "text-pink-400",
  check_in_pending: "text-green-400",
  attendance_verified: "text-emerald-400",
  coach_request: "text-yellow-400",
};

export default function NotificationCenter({ userId }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const res = await base44.entities.Notification.filter(
        { user_id: userId },
        "-created_date",
        50
      );
      return toArray(res);
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, { read: true });
    },
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => base44.entities.Notification.update(n.id, { read: true }))
      );
    },
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(notifications.map((n) => base44.entities.Notification.delete(n.id)));
    },
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    } else if (notification.type === "direct_message" || notification.type === "message_request") {
      navigate(createPageUrl("DirectMessages"));
      setOpen(false);
    } else if (notification.channel_id) {
      navigate(createPageUrl("Chat"));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Open notifications"
          className="relative text-gray-400 hover:text-white p-3 min-h-12 min-w-12 flex items-center justify-center"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 md:w-96 p-0 bg-gray-900 border-gray-800 max-h-[70vh]"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-500" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-400 hover:text-white"
                onClick={() => markAllReadMutation.mutate()}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:text-white"
              onClick={() => {
                setOpen(false);
                navigate(createPageUrl("NotificationSettings"));
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const colorClass = typeColors[notification.type] || "text-gray-400";

                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-800/50 cursor-pointer transition-colors group ${
                      !notification.read ? "bg-purple-900/10" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          !notification.read ? "bg-purple-900/30" : "bg-gray-800"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium truncate ${
                              notification.read ? "text-gray-400" : "text-white"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                            >
                              <X className="w-3 h-3 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDistanceToNow(new Date(notification.created_date), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-gray-800">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-500 hover:text-red-400"
              onClick={() => clearAllMutation.mutate()}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}