import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Heart, MessageCircle, Trophy, Flame, Zap, Star,
  Send, Users, TrendingUp, Award, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

const REACTION_EMOJIS = ["🔥", "💪", "🏆", "👏", "⚡", "🎯"];

function AvatarRing({ name, tier, size = 10 }) {
  const colors = { T1: "#8b3dff", T2: "#dc2626", T3: "#c0c0c0" };
  const color = colors[tier] || "#8b3dff";
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm`}
      style={{ background: `linear-gradient(135deg, ${color} 0%, #dc2626 100%)` }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function PostCard({ post, currentUserId, onReact, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const reactions = post.reactions || {};
  const comments = post.comments || [];
  const totalReactions = Object.values(reactions).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText("");
  };

  const hasReacted = (emoji) => {
    const reactors = reactions[emoji] || [];
    return reactors.includes(currentUserId);
  };

  return (
    <div className="rounded-xl overflow-hidden pcw-card-hover"
      style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <AvatarRing name={post.author_name} tier={post.author_tier} size={10} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{post.author_name || "Wrestler"}</span>
            {post.author_tier && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium tier-${post.author_tier.toLowerCase()}`}>
                {post.author_tier}
              </span>
            )}
            {post.post_type === "achievement" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                🏆 Achievement
              </span>
            )}
            {post.post_type === "streak" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)" }}>
                🔥 Streak
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-200 text-sm leading-relaxed">{post.content}</p>
        {post.milestone && (
          <div className="mt-3 p-3 rounded-lg flex items-center gap-3"
            style={{ background: "rgba(139,61,255,0.08)", border: "1px solid rgba(139,61,255,0.2)" }}>
            <span className="text-2xl">{post.milestone_icon || "⭐"}</span>
            <div>
              <p className="text-xs text-purple-400 font-medium">{post.milestone}</p>
              {post.milestone_value && <p className="text-white font-bold text-sm">{post.milestone_value}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
        {REACTION_EMOJIS.map((emoji) => {
          const count = (reactions[emoji] || []).length;
          const reacted = hasReacted(emoji);
          return (
            <button key={emoji}
              onClick={() => onReact(post.id, emoji)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all"
              style={{
                background: reacted ? "rgba(139,61,255,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${reacted ? "rgba(139,61,255,0.5)" : "rgba(255,255,255,0.08)"}`,
                color: reacted ? "#a78bfa" : "#6b7280",
              }}>
              {emoji} {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
        <button onClick={() => setShowComments(!showComments)}
          className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1">
          <MessageCircle className="w-3.5 h-3.5" />
          {comments.length > 0 ? comments.length : ""}
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {comments.map((c, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
                {(c.author_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-medium text-gray-300">{c.author_name} </span>
                <span className="text-xs text-gray-400">{c.text}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
              placeholder="Add a comment..."
              className="flex-1 text-xs bg-transparent text-gray-300 placeholder-gray-600 outline-none border-b pb-1"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <button onClick={handleComment} className="text-purple-400 hover:text-purple-300">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Community() {
  const [user, setUser] = useState(null);
  const [newPostText, setNewPostText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(console.error);
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: async () => {
      const res = await base44.entities.CommunityPost.list("-created_date", 50);
      return toArray(res);
    },
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["communityLeaderboard"],
    queryFn: async () => {
      const res = await base44.entities.User.list();
      return toArray(res)
        .filter(u => !u.roles?.includes("admin") && u.role !== "admin")
        .sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0))
        .slice(0, 5);
    },
    initialData: [],
  });

  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ["communityCheckIns"],
    queryFn: async () => {
      const res = await base44.entities.CheckIn.list("-check_in_time", 10);
      return toArray(res);
    },
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (content) => base44.entities.CommunityPost.create({
      author_id: user.id,
      author_name: user.wrestling_name || user.full_name,
      author_tier: user.tier || "T1",
      content,
      post_type: "regular",
      reactions: {},
      comments: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
      setNewPostText("");
      toast.success("Post shared!");
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ postId, emoji }) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const reactions = { ...(post.reactions || {}) };
      const reactors = [...(reactions[emoji] || [])];
      const idx = reactors.indexOf(user.id);
      if (idx > -1) reactors.splice(idx, 1);
      else reactors.push(user.id);
      reactions[emoji] = reactors;
      await base44.entities.CommunityPost.update(postId, { reactions });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, text }) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const comments = [...(post.comments || []), {
        author_id: user.id,
        author_name: user.wrestling_name || user.full_name,
        text,
        created_at: new Date().toISOString(),
      }];
      await base44.entities.CommunityPost.update(postId, { comments });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communityPosts"] }),
  });

  const handlePost = () => {
    if (!newPostText.trim()) return;
    createPostMutation.mutate(newPostText.trim());
  };

  const todayActive = recentCheckIns.filter(c =>
    c.check_in_date === new Date().toISOString().split("T")[0]
  ).length;

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-gray-500 uppercase tracking-widest">Community</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            The <span className="gradient-text">Mat</span>
          </h1>
          <p className="text-gray-500 mt-1">Share wins, celebrate streaks, build each other up.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">

            {/* Compose */}
            <div className="rounded-xl p-4" style={{ background: "#0f0f0f", border: "1px solid rgba(139,61,255,0.2)" }}>
              <div className="flex gap-3">
                {user && <AvatarRing name={user.wrestling_name || user.full_name} tier={user.tier} size={10} />}
                <div className="flex-1">
                  <Textarea
                    value={newPostText}
                    onChange={e => setNewPostText(e.target.value)}
                    placeholder="Share a win, drop some motivation, or call out a great session..."
                    className="bg-transparent border-0 text-gray-200 placeholder-gray-600 resize-none p-0 focus-visible:ring-0 text-sm"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex gap-1">
                      {REACTION_EMOJIS.slice(0, 4).map(e => (
                        <span key={e} className="text-lg cursor-pointer hover:scale-125 transition-transform"
                          onClick={() => setNewPostText(t => t + " " + e)}>{e}</span>
                      ))}
                    </div>
                    <Button size="sm" onClick={handlePost} disabled={!newPostText.trim() || createPostMutation.isPending}
                      style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl p-4 space-y-3" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="shimmer h-3 w-32 rounded" />
                      <div className="shimmer h-2.5 w-20 rounded" />
                    </div>
                  </div>
                  <div className="shimmer h-3 w-full rounded" />
                  <div className="shimmer h-3 w-3/4 rounded" />
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No posts yet. Be the first to share!</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} currentUserId={user?.id}
                  onReact={(postId, emoji) => reactMutation.mutate({ postId, emoji })}
                  onComment={(postId, text) => commentMutation.mutate({ postId, text })}
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Live Activity */}
            <div className="rounded-xl p-4" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Live Today</span>
              </div>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{todayActive}</p>
              <p className="text-xs text-gray-500 mt-0.5">wrestlers checked in</p>
              {recentCheckIns.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
                    {(c.trainee_name || "?")[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-400 truncate">{c.trainee_name}</span>
                  <span className="text-xs text-gray-600 ml-auto">{c.session_type || ""}</span>
                </div>
              ))}
            </div>

            {/* Streak Leaders */}
            <div className="rounded-xl p-4" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Streak Leaders</span>
              </div>
              <div className="space-y-2">
                {leaderboard.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-gray-600 font-mono">#{i + 1}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)" }}>
                      {(t.wrestling_name || t.full_name || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-300 flex-1 truncate">{t.wrestling_name || t.full_name}</span>
                    <span className="text-sm font-bold text-red-400">🔥{t.streak_count || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* XP Leaders */}
            <div className="rounded-xl p-4" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Top XP</span>
              </div>
              <div className="space-y-2">
                {[...leaderboard].sort((a,b) => (b.xp||0)-(a.xp||0)).slice(0,5).map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-gray-600 font-mono">#{i + 1}</span>
                    <span className="text-xs text-gray-300 flex-1 truncate">{t.wrestling_name || t.full_name}</span>
                    <span className="text-xs font-bold" style={{ color: "#8b3dff" }}>Lv.{t.level || 1}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
