import React from "react";
import AgentChat from "@/components/ai/AgentChat";

export default function VisitorGuide() {
  return (
    <AgentChat
      agentName="visitor_guide"
      title="PCW Visitor Guide"
      subtitle="New to PCW? Ask about our program, tiers, training, and how to get started"
      accentColor="#dc2626"
    />
  );
}