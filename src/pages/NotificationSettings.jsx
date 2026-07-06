"use client";

import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  MessageSquare,
  Users,
  AtSign,
  UserPlus,
  Megaphone,
  Pin,
  VolumeX,
  Volume2,
  Save,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const toArray = (v) => (Array.isArray(v) ? v : v?.items || []);

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    direct_messages: true,
    group_messages: true,
    mentions: true,
    message_requests: true,
    announcements: true,
    pinned_messages: true,
    muted_channels: [],
  });

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: existingPrefs } = useQuery({
    queryKey: ["notificationPrefs", user?.id],
    queryFn: async () => {
      const res = await base44.entities.NotificationPreferences.filter({
        user_id: user.id,
      });
      const arr = toArray(res);
      return arr[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["chatChannels"],
    queryFn: async () => {
      const res = await base44.entities.ChatChannel.list("order");
      return toArray(res);
    },
  });

  useEffect(() => {
    if (existingPrefs) {
      setPreferences({
        direct_messages: existingPrefs.direct_messages ?? true,
        group_messages: existingPrefs.group_messages ?? true,
        mentions: existingPrefs.mentions ?? true,
        message_requests: existingPrefs.message_requests ?? true,
        announcements: existingPrefs.announcements ?? true,
        pinned_messages: existingPrefs.pinned_messages ?? true,
        muted_channels: existingPrefs.muted_channels || [],
      });
    }
  }, [existingPrefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (existingPrefs) {
        await base44.entities.NotificationPreferences.update(existingPrefs.id, {
          ...preferences,
        });
      } else {
        await base44.entities.NotificationPreferences.create({
          user_id: user.id,
          ...preferences,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notificationPrefs"]);
      toast.success("Preferences saved");
    },
    onError: () => toast.error("Failed to save preferences"),
  });

  const toggleChannelMute = (channelId) => {
    setPreferences((prev) => ({
      ...prev,
      muted_channels: prev.muted_channels.includes(channelId)
        ? prev.muted_channels.filter((id) => id !== channelId)
        : [...prev.muted_channels, channelId],
    }));
  };

  const notificationTypes = [
    {
      key: "direct_messages",
      icon: MessageSquare,
      title: "Direct Messages",
      description: "Get notified when you receive a new direct message",
    },
    {
      key: "group_messages",
      icon: Users,
      title: "Group Messages",
      description: "Get notified for new messages in group chats you're in",
    },
    {
      key: "mentions",
      icon: AtSign,
      title: "Mentions",
      description: "Get notified when someone mentions you in a chat",
    },
    {
      key: "message_requests",
      icon: UserPlus,
      title: "Message Requests",
      description: "Get notified for new message requests",
    },
    {
      key: "announcements",
      icon: Megaphone,
      title: "Announcements",
      description: "Get notified for new announcements",
    },
    {
      key: "pinned_messages",
      icon: Pin,
      title: "Pinned Messages",
      description: "Get notified when a message is pinned in your channels",
    },
  ];

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-purple-500" />
              Notification Settings
            </h1>
            <p className="text-gray-400 text-sm">
              Manage how and when you receive notifications
            </p>
          </div>
        </div>

        {/* Notification Types */}
        <Card className="bg-gray-900/50 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">Notification Types</CardTitle>
            <CardDescription>Choose which notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationTypes.map(({ key, icon: Icon, title, description }) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{title}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences[key]}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Muted Channels */}
        <Card className="bg-gray-900/50 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <VolumeX className="w-5 h-5 text-gray-500" />
              Muted Channels
            </CardTitle>
            <CardDescription>
              Mute specific channels to stop receiving notifications from them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {channels.map((channel) => {
                  const isMuted = preferences.muted_channels.includes(channel.id);
                  return (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <span>{channel.icon || "#"}</span>
                        <span className="text-white">{channel.display_name}</span>
                        {channel.channel_type === "group" && (
                          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                            Group
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${isMuted ? "text-red-400" : "text-gray-400"}`}
                        onClick={() => toggleChannelMute(channel.id)}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
                {channels.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No channels available</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}