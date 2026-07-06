"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  UserPlus,
  UserMinus,
  Shield,
  Search,
  Trash2,
  Crown,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ChannelSettingsModal({
  channel,
  profiles,
  currentUser,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}) {
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState(channel?.display_name || "");
  const [description, setDescription] = useState(channel?.description || "");
  const [icon, setIcon] = useState(channel?.icon || "👥");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = channel?.admins?.includes(currentUser?.id);
  const members = channel?.members || [];
  const admins = channel?.admins || [];

  const memberProfiles = members
    .map((id) => profiles.find((p) => p.auth_user_id === id))
    .filter(Boolean);

  const nonMembers = profiles.filter(
    (p) =>
      !members.includes(p.auth_user_id) &&
      p.auth_user_id !== currentUser?.id &&
      (p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.wrestling_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.ChatChannel.update(channel.id, {
        display_name: name,
        name: name.toLowerCase().replace(/\s+/g, "-"),
        description,
        icon,
      });
      toast.success("Channel updated");
      onUpdated?.();
    } catch (err) {
      toast.error("Failed to update channel");
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (userId) => {
    try {
      await base44.entities.ChatChannel.update(channel.id, {
        members: [...members, userId],
      });
      toast.success("Member added");
      onUpdated?.();
    } catch (err) {
      toast.error("Failed to add member");
    }
  };

  const removeMember = async (userId) => {
    if (admins.includes(userId) && admins.length === 1) {
      toast.error("Cannot remove the only admin");
      return;
    }
    try {
      await base44.entities.ChatChannel.update(channel.id, {
        members: members.filter((id) => id !== userId),
        admins: admins.filter((id) => id !== userId),
      });
      toast.success("Member removed");
      onUpdated?.();
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  const toggleAdmin = async (userId) => {
    const isCurrentlyAdmin = admins.includes(userId);
    if (isCurrentlyAdmin && admins.length === 1) {
      toast.error("Cannot remove the only admin");
      return;
    }
    try {
      await base44.entities.ChatChannel.update(channel.id, {
        admins: isCurrentlyAdmin
          ? admins.filter((id) => id !== userId)
          : [...admins, userId],
      });
      toast.success(isCurrentlyAdmin ? "Admin removed" : "Admin added");
      onUpdated?.();
    } catch (err) {
      toast.error("Failed to update admin");
    }
  };

  const deleteChannel = async () => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      await base44.entities.ChatChannel.delete(channel.id);
      toast.success("Group deleted");
      onDeleted?.();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to delete group");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" />
            {channel?.display_name} Settings
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeTab === "general"
                ? "bg-purple-900/30 text-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeTab === "members"
                ? "bg-purple-900/30 text-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Members ({members.length})
          </button>
        </div>

        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(-2))}
                className="w-14 h-14 text-2xl text-center bg-gray-800 border-gray-700"
                disabled={!isAdmin}
              />
              <Input
                placeholder="Group name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700"
                disabled={!isAdmin}
              />
            </div>

            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 resize-none h-20"
              disabled={!isAdmin}
            />

            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-800 text-red-400 hover:bg-red-900/20"
                  onClick={deleteChannel}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            {/* Add Members */}
            {isAdmin && (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search to add members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800 border-gray-700 pl-10"
                  />
                </div>
                {searchQuery && nonMembers.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1 mb-4">
                    {nonMembers.slice(0, 5).map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => addMember(profile.auth_user_id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800"
                      >
                        <UserPlus className="w-4 h-4 text-green-500" />
                        <span className="text-sm">
                          {profile.wrestling_name || profile.full_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Member List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {memberProfiles.map((profile) => {
                const isProfileAdmin = admins.includes(profile.auth_user_id);
                const isCurrentUser = profile.auth_user_id === currentUser?.id;

                return (
                  <div
                    key={profile.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)",
                      }}
                    >
                      {(profile.wrestling_name || profile.full_name || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {profile.wrestling_name || profile.full_name}
                        </span>
                        {isProfileAdmin && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-gray-500">(you)</span>
                        )}
                      </div>
                    </div>

                    {isAdmin && !isCurrentUser && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toggleAdmin(profile.auth_user_id)}
                          title={isProfileAdmin ? "Remove admin" : "Make admin"}
                        >
                          <Shield
                            className={`w-4 h-4 ${
                              isProfileAdmin ? "text-yellow-500" : "text-gray-500"
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                          onClick={() => removeMember(profile.auth_user_id)}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}