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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, X, Users, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CreateGroupModal({ profiles, currentUser, onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("👥");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredProfiles = profiles.filter(
    (p) =>
      p.auth_user_id !== currentUser?.id &&
      !selectedMembers.includes(p.auth_user_id) &&
      (p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.wrestling_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("Please add at least one member");
      return;
    }

    setCreating(true);
    try {
      const channel = await base44.entities.ChatChannel.create({
        name: name.toLowerCase().replace(/\s+/g, "-"),
        display_name: name,
        description,
        icon,
        channel_type: "group",
        members: [currentUser.id, ...selectedMembers],
        admins: [currentUser.id],
        pinned_messages: [],
      });

      toast.success("Group created!");
      setOpen(false);
      resetForm();
      onCreated?.(channel);
    } catch (err) {
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setIcon("👥");
    setSelectedMembers([]);
    setSearchQuery("");
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getProfile = (userId) => profiles.find((p) => p.auth_user_id === userId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Create Group Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Icon & Name */}
          <div className="flex gap-3">
            <div className="relative">
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(-2))}
                className="w-14 h-14 text-2xl text-center bg-gray-800 border-gray-700"
                maxLength={2}
              />
            </div>
            <Input
              placeholder="Group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700"
            />
          </div>

          {/* Description */}
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-gray-800 border-gray-700 resize-none h-20"
          />

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((userId) => {
                const profile = getProfile(userId);
                return (
                  <div
                    key={userId}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 rounded-full text-sm"
                  >
                    <span>{profile?.wrestling_name || profile?.full_name}</span>
                    <button onClick={() => toggleMember(userId)}>
                      <X className="w-3 h-3 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Member Search */}
          <div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search members to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-700 pl-10"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredProfiles.slice(0, 10).map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => toggleMember(profile.auth_user_id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)",
                    }}
                  >
                    {(profile.wrestling_name || profile.full_name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {profile.wrestling_name || profile.full_name}
                    </p>
                    {profile.tier && (
                      <p className="text-xs text-gray-500">{profile.tier}</p>
                    )}
                  </div>
                </button>
              ))}
              {filteredProfiles.length === 0 && searchQuery && (
                <p className="text-sm text-gray-500 text-center py-2">
                  No members found
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-gray-700"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}