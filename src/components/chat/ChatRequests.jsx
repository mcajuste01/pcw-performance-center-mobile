"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, X } from "lucide-react";

export default function ChatRequests({
  me,
  requests,
  profiles,
  onAccept,
  onDecline,
  onBack,
}) {
  const getSender = (req) => {
    const senderId = req.participants?.find((p) => p !== me?.id);
    return profiles?.find((p) => p.auth_user_id === senderId);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-400">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <h2 className="text-xl font-bold text-white">Message Requests</h2>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500">No pending message requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const sender = getSender(req);
            const initials = (sender?.wrestling_name || sender?.full_name || "?")
              .charAt(0)
              .toUpperCase();

            return (
              <div
                key={req.id}
                className="border border-gray-800 rounded-xl p-4 bg-gray-900/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)" }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {sender?.wrestling_name || sender?.full_name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sender?.email || "Wants to message you"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => onAccept(req)}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => onDecline(req)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}