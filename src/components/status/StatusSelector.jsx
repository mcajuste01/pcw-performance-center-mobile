import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Circle, Moon, MinusCircle, Clock } from "lucide-react";

const statuses = [
  { value: "online", label: "Online", color: "bg-green-500", icon: Circle },
  { value: "away", label: "Away", color: "bg-yellow-500", icon: Clock },
  { value: "dnd", label: "Do Not Disturb", color: "bg-red-500", icon: MinusCircle },
  { value: "offline", label: "Appear Offline", color: "bg-gray-500", icon: Moon },
];

export default function StatusSelector({ currentStatus = "online", onStatusChange }) {
  const [status, setStatus] = useState(currentStatus);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
    try {
      await base44.auth.updateMe({ status: newStatus });
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const current = statuses.find(s => s.value === status) || statuses[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 transition-colors">
          <span className={`w-3 h-3 rounded-full ${current.color} ring-2 ring-black`} />
          <span className="text-xs text-gray-400">{current.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-900 border-gray-700">
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => handleStatusChange(s.value)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800"
          >
            <span className={`w-3 h-3 rounded-full ${s.color}`} />
            <span className="text-white">{s.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StatusIndicator({ status = "offline", size = "sm" }) {
  const sizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };
  
  const colorClasses = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-gray-500",
  };

  return (
    <span 
      className={`${sizeClasses[size]} ${colorClasses[status] || colorClasses.offline} rounded-full ring-2 ring-black`}
    />
  );
}