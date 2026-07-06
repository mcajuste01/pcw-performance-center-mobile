import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

export default function BroadcastMessage({ user }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [targetTier, setTargetTier] = useState('all');
  const [messageType, setMessageType] = useState('message');
  const [asAnnouncement, setAsAnnouncement] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForBroadcast'],
    queryFn: async () => {
      const res = await base44.entities.User.list();
      return toArray(res);
    },
    initialData: [],
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async ({ message, tier, type, asAnnouncement }) => {
      const trainees = toArray(allUsers).filter(u => {
        const isTrainee = !u.roles?.includes('coach') && !u.roles?.includes('admin') && u.role !== 'admin';
        if (!isTrainee) return false;
        if (tier === 'all') return true;
        return u.tier === tier;
      });

      if (asAnnouncement) {
        // Post to announcements channel
        const channels = await base44.entities.ChatChannel.list();
        const channelArray = toArray(channels);
        const announcementChannel = channelArray.find(ch => ch.name === 'announcements');
        
        if (announcementChannel) {
          await base44.entities.ChatMessage.create({
            channel_id: announcementChannel.id,
            author_id: user.id,
            content: `📢 ${tier === 'all' ? 'All Trainees' : tier} | ${message}`,
          });
        }
      }

      // Send direct messages to all targeted trainees
      const messagePromises = trainees.map(trainee => 
        base44.entities.DirectMessage.create({
          sender_id: user.id,
          recipient_id: trainee.id,
          message: message,
          message_type: type,
          accepted: true,
          thread_id: `broadcast_${user.id}_${trainee.id}_${Date.now()}`
        })
      );

      await Promise.all(messagePromises);
      return trainees.length;
    },
    onSuccess: (count) => {
      toast.success(`Broadcast sent to ${count} trainee${count !== 1 ? 's' : ''}`);
      setMessage('');
      setTargetTier('all');
      setMessageType('message');
      setAsAnnouncement(false);
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to send broadcast");
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    sendBroadcastMutation.mutate({ 
      message, 
      tier: targetTier, 
      type: messageType,
      asAnnouncement 
    });
  };

  const targetCount = toArray(allUsers).filter(u => {
    const isTrainee = !u.roles?.includes('coach') && !u.roles?.includes('admin') && u.role !== 'admin';
    if (!isTrainee) return false;
    if (targetTier === 'all') return true;
    return u.tier === targetTier;
  }).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button style={{ background: '#8b3dff' }}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Broadcast Message
        </Button>
      </DialogTrigger>
      <DialogContent className="border-gray-800" style={{ background: '#0f0f0f' }}>
        <DialogHeader>
          <DialogTitle className="text-white">Broadcast Message</DialogTitle>
          <DialogDescription className="text-gray-400">
            Send a message to multiple trainees at once
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-gray-300">Target Group</Label>
            <Select value={targetTier} onValueChange={setTargetTier}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trainees ({targetCount})</SelectItem>
                <SelectItem value="T1">Tier 1 Only</SelectItem>
                <SelectItem value="T2">Tier 2 Only</SelectItem>
                <SelectItem value="T3">Tier 3 Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Message Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message">Regular Message</SelectItem>
                <SelectItem value="feedback">Feedback/Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="announcement"
              checked={asAnnouncement}
              onCheckedChange={setAsAnnouncement}
            />
            <Label htmlFor="announcement" className="text-gray-300 text-sm cursor-pointer">
              Also post in #announcements channel
            </Label>
          </div>

          <div>
            <Label className="text-gray-300">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="bg-gray-900 border-gray-700 text-white h-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be sent as a direct message to {targetCount} trainee{targetCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            style={{ borderColor: '#666', color: '#999' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendBroadcastMutation.isPending || !message.trim()}
            style={{ background: '#8b3dff' }}
          >
            {sendBroadcastMutation.isPending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Broadcast
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}