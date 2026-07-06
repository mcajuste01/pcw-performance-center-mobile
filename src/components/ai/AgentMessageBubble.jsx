import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronRight, CheckCircle, Loader2, XCircle, Wrench } from "lucide-react";

const STATUS_CONFIG = {
  pending: { icon: Loader2, color: "#6b7280", label: "Queued", spin: true },
  running: { icon: Loader2, color: "#f59e0b", label: "Running", spin: true },
  in_progress: { icon: Loader2, color: "#f59e0b", label: "Working", spin: true },
  completed: { icon: CheckCircle, color: "#10b981", label: "Done", spin: false },
  success: { icon: CheckCircle, color: "#10b981", label: "Success", spin: false },
  failed: { icon: XCircle, color: "#dc2626", label: "Failed", spin: false },
  error: { icon: XCircle, color: "#dc2626", label: "Error", spin: false },
};

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const rawStatus = toolCall.status || "pending";
  const cfg = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  let results = toolCall.results;
  let parsedResults = results;
  if (typeof results === "string") {
    try { parsedResults = JSON.parse(results); } catch { parsedResults = results; }
  }

  const isFailed = rawStatus === "failed" || rawStatus === "error" ||
    (typeof results === "string" && /error|failed/i.test(results)) ||
    (parsedResults?.success === false);

  const displayProjection = toolCall.display_projection || {};
  const hideDetails = displayProjection.hide_details && displayProjection.details_redacted;
  const stateLabel = isFailed
    ? (displayProjection.error_label || "Failed")
    : (cfg.spin ? (displayProjection.active_label || cfg.label) : (displayProjection.label || cfg.label));

  const fnName = toolCall.name || "Tool";
  const fnLabel = fnName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  let parsedArgs = toolCall.arguments_string;
  if (typeof parsedArgs === "string") {
    try { parsedArgs = JSON.parse(parsedArgs); } catch { /* keep raw */ }
  }

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-400 transition-colors"
        style={{ cursor: hideDetails ? "default" : "pointer" }}
      >
        {!hideDetails && (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
        <Icon className={`w-3 h-3 ${cfg.spin ? "animate-spin" : ""}`} style={{ color: isFailed ? "#dc2626" : cfg.color }} />
        <Wrench className="w-3 h-3" />
        <span className="font-medium" style={{ color: isFailed ? "#dc2626" : cfg.color }}>{fnLabel}</span>
        <span className="text-gray-600">— {stateLabel}</span>
      </button>
      {expanded && !hideDetails && (
        <div className="mt-1.5 ml-6 space-y-1.5">
          {parsedArgs && (
            <div>
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Parameters</p>
              <pre className="text-gray-400 text-[11px] bg-black/40 rounded p-2 overflow-x-auto max-h-32">
{typeof parsedArgs === "string" ? parsedArgs : JSON.stringify(parsedArgs, null, 2)}
              </pre>
            </div>
          )}
          {parsedResults != null && (
            <div>
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Result</p>
              <pre className="text-gray-400 text-[11px] bg-black/40 rounded p-2 overflow-x-auto max-h-40">
{typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentMessageBubble({ message }) {
  const isUser = message.role === "user";
  const isContext = isUser && message.content?.startsWith("[Context]");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] rounded-2xl px-4 py-2.5"
        style={{
          background: isUser
            ? "linear-gradient(135deg, #8b3dff, #6d28d9)"
            : "#1a1a1a",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {isUser ? (
          <p className="text-sm text-white whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="text-sm text-gray-200 prose prose-sm prose-invert max-w-none
            [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5
            [&_code]:bg-black/40 [&_code]:px-1 [&_code]:rounded [&_code]:text-purple-300
            [&_pre]:bg-black/40 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs
            [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-2
            [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2
            [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-1.5
            [&_strong]:text-white [&_a]:text-purple-400">
            <ReactMarkdown>{message.content || ""}</ReactMarkdown>
          </div>
        )}
        {message.tool_calls?.map((tc, i) => (
          <ToolCallDisplay key={i} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}