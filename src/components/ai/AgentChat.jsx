import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Send, MessageSquare, Sparkles, Loader2,
  ChevronLeft, Trash2, Bot
} from "lucide-react";
import AgentMessageBubble from "./AgentMessageBubble";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

export default function AgentChat({ agentName, title, subtitle, initialContextMessage, accentColor = "#8b3dff" }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      const res = await base44.agents.listConversations({ agent_name: agentName });
      const convs = toArray(res).sort((a, b) =>
        new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0)
      );
      setConversations(convs);
      if (convs.length > 0 && !activeId) {
        setActiveId(convs[0].id);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [agentName]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    base44.agents.getConversation(activeId).then(conv => {
      setMessages(conv?.messages || []);
    }).catch(console.error);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const unsubscribe = base44.agents.subscribeToConversation(activeId, (data) => {
      setMessages(data.messages || []);
      const lastMsg = data.messages?.[data.messages.length - 1];
      if (lastMsg?.role === "assistant" && !lastMsg.tool_calls?.some(tc =>
        ["pending", "running", "in_progress"].includes(tc.status))) {
        setSending(false);
      }
    });
    return () => { try { unsubscribe(); } catch {} };
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: agentName,
        metadata: { name: `New Chat · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}` },
      });
      setConversations(prev => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
      setShowSidebar(false);

      if (initialContextMessage) {
        setSending(true);
        await base44.agents.addMessage(conv, {
          role: "user",
          content: initialContextMessage,
        });
      }
    } catch (e) {
      console.error("Failed to create conversation:", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const messageText = input.trim();
    setInput("");

    if (!activeId) {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: agentName,
          metadata: { name: messageText.substring(0, 50) },
        });
        setConversations(prev => [conv, ...prev]);
        setActiveId(conv.id);

        const fullMessage = initialContextMessage
          ? `${initialContextMessage}\n\n${messageText}`
          : messageText;

        setMessages([{ role: "user", content: messageText }]);
        setSending(true);
        await base44.agents.addMessage(conv, { role: "user", content: fullMessage });
      } catch (e) {
        console.error("Failed:", e);
        setSending(false);
      }
    } else {
      const conv = conversations.find(c => c.id === activeId);
      setMessages(prev => [...prev, { role: "user", content: messageText }]);
      setSending(true);
      try {
        await base44.agents.addMessage(conv, { role: "user", content: messageText });
      } catch (e) {
        console.error("Failed to send:", e);
        setSending(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0a0a0a" }}>
      {/* Conversation sidebar */}
      <div className={`
        ${showSidebar ? "absolute inset-0 z-40 flex" : "hidden"} md:relative md:flex md:inset-auto md:z-auto
        flex-col w-72 flex-shrink-0 border-r border-white/5
      `} style={{ background: "#080808" }}>
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversations</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-white"
              onClick={handleNewConversation}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 md:hidden"
              onClick={() => setShowSidebar(false)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1,2,3].map(i => <div key={i} className="shimmer h-10 rounded-lg" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-gray-700 mb-2" />
              <p className="text-xs text-gray-600">No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button key={conv.id} onClick={() => { setActiveId(conv.id); setShowSidebar(false); }}
                className="w-full text-left p-2.5 rounded-lg transition-all"
                style={{
                  background: conv.id === activeId ? "rgba(139,61,255,0.12)" : "transparent",
                  border: conv.id === activeId ? "1px solid rgba(139,61,255,0.3)" : "1px solid transparent",
                }}>
                <p className="text-sm text-gray-300 truncate font-medium">
                  {conv.metadata?.name || "Untitled"}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {conv.updated_date ? new Date(conv.updated_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 flex-shrink-0"
          style={{ background: "#0f0f0f" }}>
          <button className="md:hidden text-gray-500 hover:text-white"
            onClick={() => setShowSidebar(true)}>
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`, boxShadow: `0 0 20px ${accentColor}30` }}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{title}</h1>
              {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs"
              onClick={handleNewConversation}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`, border: `1px solid ${accentColor}30` }}>
                <Sparkles className="w-8 h-8" style={{ color: accentColor }} />
              </div>
              <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                {title}
              </h2>
              <p className="text-sm text-gray-500 max-w-xs">{subtitle}</p>
              <Button className="mt-4" size="sm" onClick={handleNewConversation}
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Start Chatting
              </Button>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <AgentMessageBubble key={i} message={msg} />
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full"
                          style={{ background: accentColor, animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5 flex-shrink-0" style={{ background: "#0f0f0f" }}>
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI coach anything..."
              className="bg-gray-900 border-gray-700 text-white text-sm resize-none min-h-[44px] max-h-32"
              rows={1}
              style={{ flex: 1 }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}