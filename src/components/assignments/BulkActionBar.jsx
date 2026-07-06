import React from "react";
import { motion } from "framer-motion";
import { Archive, ArchiveRestore, UserPlus, CheckCheck, X } from "lucide-react";

export default function BulkActionBar({
  selectedCount,
  onSelectAll,
  onClear,
  onArchive,
  onReassign,
  isArchiving,
  isArchivedView = false,
}) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-2xl"
    >
      <div className="rounded-xl border shadow-2xl flex items-center gap-1.5 p-2"
        style={{ background: "#131313", borderColor: "rgba(139,61,255,0.3)" }}>
        <div className="flex items-center gap-2 px-3 flex-shrink-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(139,61,255,0.15)" }}>
            <span className="text-xs font-bold" style={{ color: "#a78bfa" }}>{selectedCount}</span>
          </div>
          <span className="text-sm text-gray-300 hidden sm:inline">selected</span>
        </div>

        <div className="flex-1" />

        <button onClick={onSelectAll}
          className="px-3 py-2 rounded-lg text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-1.5">
          <CheckCheck className="w-3.5 h-3.5" /> <span className="hidden sm:inline">All</span>
        </button>

        <button onClick={onArchive} disabled={isArchiving}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
          {isArchivedView ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          {isArchiving ? "..." : isArchivedView ? "Restore" : "Archive"}
        </button>

        <button onClick={onReassign}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
          <UserPlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Re-assign</span>
        </button>

        <button onClick={onClear}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}