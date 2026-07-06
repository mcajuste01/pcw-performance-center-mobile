import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "What should I work on this week?",
  "How can I improve my cardio?",
  "Show me stretches for tight hips",
  "Am I ready for my first match?",
  "What workouts can I do at home?",
];

export default function AICoachSection({ traineeId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("aiPerformanceCoach", {
        question,
        trainee_id: traineeId,
      });
      setMessages([
        ...newMessages,
        { role: "assistant", content: res.data?.response || "I couldn't generate a response." },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <Bot className="w-5 h-5" style={{ color: "#8b3dff" }} />
        AI Performance Coach
      </h3>

      <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
        <CardContent className="pt-4">
          <div className="space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-gray-400 text-sm mb-3">
                  Ask me anything about your training. I use your actual data to give personalized advice.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="px-3 py-1.5 rounded-full text-xs border transition hover:border-purple-500"
                      style={{ background: "#0a0a0a", color: "#9ca3af", borderColor: "#2a2a2a" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user" ? "bg-purple-600/20 text-white" : "bg-[#1a1a1a] text-gray-200"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-gray-400 text-sm">Analyzing your data...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          <div className="flex gap-2 mt-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI coach..."
              rows={1}
              className="bg-[#0a0a0a] border-gray-800 text-white resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
            />
            <Button
              onClick={() => ask(input)}
              disabled={loading || !input.trim()}
              style={{ background: "#8b3dff" }}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}