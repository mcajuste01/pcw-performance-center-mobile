import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Upload, Play, Loader2, Sparkles, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function VideoAnalysis() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    video_type: 'drill',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: videos = [] } = useQuery({
    queryKey: ['videos', user?.id],
    queryFn: async () => {
      const res = await base44.entities.Video.filter({ trainee_id: user.id }, '-created_date');
      return toArray(res);
    },
    enabled: !!user,
    initialData: [],
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.title) {
      toast.error("Please provide a title and select a video file");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      const video = await base44.entities.Video.create({
        trainee_id: user.id,
        title: formData.title,
        video_url: file_url,
        video_type: formData.video_type,
        analyzed: false
      });

      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setSelectedFile(null);
      setFormData({ title: '', video_type: 'drill' });
      toast.success("Video uploaded successfully!");
      
      // Trigger AI analysis
      analyzeVideo(video.id, file_url);
    } catch (error) {
      toast.error("Failed to upload video");
    }
    setUploading(false);
  };

  const analyzeVideo = async (videoId, videoUrl) => {
    setAnalyzing(videoId);
    try {
      const analysisPrompt = `You are an expert wrestling coach analyzing a training video. 
      Provide detailed feedback on the following aspects (rate each 1-10):
      - Timing and pacing
      - Movement quality and technique
      - Ring presence and confidence
      - Character commitment
      
      Also provide:
      - 3-5 specific strengths
      - 3-5 areas for improvement
      - Overall score (1-10)
      - Motivational summary
      
      Be constructive, specific, and encouraging. Use wrestling terminology.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: [videoUrl],
        response_json_schema: {
          type: "object",
          properties: {
            timing: { type: "number" },
            movement: { type: "number" },
            ring_presence: { type: "number" },
            character: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            overall_score: { type: "number" },
            summary: { type: "string" }
          }
        }
      });

      const feedback = `**Overall Score: ${result.overall_score}/10**\n\n` +
                      `**Strengths:**\n${result.strengths.map(s => `- ${s}`).join('\n')}\n\n` +
                      `**Areas for Improvement:**\n${result.improvements.map(i => `- ${i}`).join('\n')}\n\n` +
                      `**Summary:** ${result.summary}`;

      await base44.entities.Video.update(videoId, {
        analyzed: true,
        ai_feedback: feedback,
        overall_score: result.overall_score,
        analysis_data: {
          timing: result.timing,
          movement: result.movement,
          ring_presence: result.ring_presence,
          character: result.character
        }
      });

      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success("AI analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze video");
    }
    setAnalyzing(null);
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Video className="w-8 h-8" style={{ color: '#8b3dff' }} />
            Video Analysis
          </h1>
          <p className="text-gray-400">Upload your videos and get AI-powered feedback</p>
        </div>

        {/* Upload Form */}
        <Card className="border-gray-800 mb-8" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5" style={{ color: '#8b3dff' }} />
              Upload New Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Video Title *</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="e.g., Training Session - Chain Wrestling"
                />
              </div>
              <div>
                <Label className="text-gray-300">Video Type</Label>
                <Select 
                  value={formData.video_type}
                  onValueChange={(value) => setFormData({ ...formData, video_type: value })}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="promo">Promo</SelectItem>
                    <SelectItem value="drill">Drill</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Video File (Max 100MB) *</Label>
              <div className="mt-2">
                <input 
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload">
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
                    {selectedFile ? (
                      <div>
                        <Play className="w-12 h-12 mx-auto mb-2" style={{ color: '#8b3dff' }} />
                        <p className="text-white font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                        <p className="text-white">Click to select video file</p>
                        <p className="text-sm text-gray-500 mt-1">MP4, MOV, AVI supported</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !formData.title || uploading}
              className="w-full"
              style={{ background: '#8b3dff' }}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading & Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upload & Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Video Library */}
        <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
          <CardHeader>
            <CardTitle className="text-white">Your Videos</CardTitle>
          </CardHeader>
          <CardContent>
            {videos.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="border-gray-800" style={{ background: '#0a0a0a' }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{video.title}</h3>
                          <p className="text-sm text-gray-400">
                            {video.video_type?.replace(/\b\w/g, l => l.toUpperCase())} • 
                            {new Date(video.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        {video.overall_score && (
                          <div className="text-center">
                            <p className="text-2xl font-bold" style={{ 
                              color: video.overall_score >= 7 ? '#8b3dff' : 
                                     video.overall_score >= 5 ? '#c0c0c0' : '#dc2626' 
                            }}>
                              {video.overall_score}
                            </p>
                            <p className="text-xs text-gray-500">/ 10</p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {analyzing === video.id && (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" style={{ color: '#8b3dff' }} />
                            <p className="text-sm text-gray-400">AI is analyzing your video...</p>
                          </div>
                        </div>
                      )}
                      
                      {video.analyzed && video.analysis_data && (
                        <div className="space-y-3 mb-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 rounded border border-gray-800">
                              <p className="text-xs text-gray-400">Timing</p>
                              <p className="text-lg font-bold" style={{ color: '#8b3dff' }}>
                                {video.analysis_data.timing}/10
                              </p>
                            </div>
                            <div className="p-2 rounded border border-gray-800">
                              <p className="text-xs text-gray-400">Movement</p>
                              <p className="text-lg font-bold" style={{ color: '#8b3dff' }}>
                                {video.analysis_data.movement}/10
                              </p>
                            </div>
                            <div className="p-2 rounded border border-gray-800">
                              <p className="text-xs text-gray-400">Ring Presence</p>
                              <p className="text-lg font-bold" style={{ color: '#dc2626' }}>
                                {video.analysis_data.ring_presence}/10
                              </p>
                            </div>
                            <div className="p-2 rounded border border-gray-800">
                              <p className="text-xs text-gray-400">Character</p>
                              <p className="text-lg font-bold" style={{ color: '#dc2626' }}>
                                {video.analysis_data.character}/10
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {video.ai_feedback && (
                        <div className="p-3 rounded border border-gray-800 mb-3" style={{ background: '#0f0f0f' }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: '#8b3dff' }}>
                            AI Feedback:
                          </p>
                          <p className="text-sm text-gray-300 whitespace-pre-line">
                            {video.ai_feedback}
                          </p>
                        </div>
                      )}

                      {video.coach_feedback && (
                        <div className="p-3 rounded border border-gray-800" style={{ background: '#0f0f0f' }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: '#dc2626' }}>
                            Coach Feedback:
                          </p>
                          <p className="text-sm text-gray-300">{video.coach_feedback}</p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          style={{ borderColor: '#8b3dff', color: '#8b3dff' }}
                          onClick={() => window.open(video.video_url, '_blank')}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Watch
                        </Button>
                        {!video.analyzed && !analyzing && (
                          <Button 
                            variant="outline"
                            size="sm"
                            style={{ borderColor: '#dc2626', color: '#dc2626' }}
                            onClick={() => analyzeVideo(video.id, video.video_url)}
                          >
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Analyze
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No videos uploaded yet. Start tracking your progress!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}