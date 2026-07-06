import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Video,
  FileText,
  ClipboardList,
  Mic,
  Search,
  Play,
  ExternalLink,
  Dumbbell,
  Upload,
  Paperclip,
} from "lucide-react";

const toArray = (v) => Array.isArray(v) ? v : (v?.items || []);

export default function ResourceCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newResource, setNewResource] = useState({ title: "", comment: "", file_url: "", assignment_ids: [] });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const isCoach = user?.roles?.includes('coach') || user?.roles?.includes('admin') || user?.role === 'admin';

  const { data: curriculum = [] } = useQuery({
    queryKey: ["curriculum"],
    queryFn: async () => {
      const res = await base44.entities.Curriculum.list("order_index");
      return toArray(res);
    },
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const res = await base44.entities.Video.list("-created_date", 50);
      return toArray(res);
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const res = await base44.entities.Assignment.list("-created_date", 50);
      return toArray(res);
    },
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const res = await base44.entities.Resource.list("-created_date", 100);
      return toArray(res);
    },
    initialData: [],
  });

  const createResourceMutation = useMutation({
    mutationFn: async (data) => {
      const created = await base44.entities.Resource.create(data);
      await Promise.all((data.assignment_ids || []).map(async (assignmentId) => {
        const assignment = assignments.find((item) => item.id === assignmentId);
        const currentIds = assignment?.resource_ids || [];
        if (!currentIds.includes(created.id)) {
          await base44.entities.Assignment.update(assignmentId, {
            resource_ids: [...currentIds, created.id]
          });
        }
      }));
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setNewResource({ title: "", comment: "", file_url: "", assignment_ids: [] });
    },
  });

  const handleUploadFile = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setNewResource((prev) => ({ ...prev, file_url }));
    setUploading(false);
  };

  const filteredCurriculum = curriculum.filter(c =>
    (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter(v =>
    (v.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: "all", label: "All", icon: BookOpen },
    { id: "videos", label: "Videos", icon: Video },
    { id: "drills", label: "Drills", icon: Dumbbell },
    { id: "promos", label: "Promos", icon: Mic },
    { id: "lessons", label: "Lessons", icon: FileText },
  ];

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "radial-gradient(circle at top, #111 0%, #000 60%)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-400" />
            Resource Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Videos, drills, lessons, and promo templates all in one place
          </p>
        </div>

        {isCoach && (
          <Card className="border-gray-800 bg-[#0b0b0b] mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Upload Resource
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Resource title"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
              <Input
                type="file"
                onChange={(e) => e.target.files?.[0] && handleUploadFile(e.target.files[0])}
                className="bg-gray-900 border-gray-700 text-white"
                disabled={uploading}
              />
              <Input
                placeholder="Coach comment"
                value={newResource.comment}
                onChange={(e) => setNewResource({ ...newResource, comment: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
              />
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-gray-800 bg-black p-3">
                {assignments.map((assignment) => {
                  const checked = newResource.assignment_ids.includes(assignment.id);
                  return (
                    <label key={assignment.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setNewResource({
                            ...newResource,
                            assignment_ids: e.target.checked
                              ? [...newResource.assignment_ids, assignment.id]
                              : newResource.assignment_ids.filter((id) => id !== assignment.id)
                          });
                        }}
                      />
                      <span className="text-sm text-white">{assignment.title}</span>
                    </label>
                  );
                })}
              </div>
              <Button
                onClick={() => createResourceMutation.mutate({
                  title: newResource.title,
                  comment: newResource.comment,
                  file_url: newResource.file_url,
                  uploaded_by: user.id,
                  assignment_ids: newResource.assignment_ids
                })}
                disabled={!newResource.title || !newResource.file_url || createResourceMutation.isPending || uploading}
                style={{ background: '#8b3dff' }}
              >
                Save Resource
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-700 text-white"
          />
        </div>

        {/* Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 mb-6">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Curriculum items */}
              {filteredCurriculum.slice(0, 6).map((item) => (
                <ResourceCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  type="lesson"
                  level={item.level}
                  category={item.category}
                />
              ))}

              {/* Videos */}
              {filteredVideos.slice(0, 6).map((video) => (
                <ResourceCard
                  key={video.id}
                  title={video.title}
                  description={video.description}
                  type="video"
                  url={video.url}
                />
              ))}

              {resources.slice(0, 6).map((resource) => (
                <ResourceCard
                  key={resource.id}
                  title={resource.title}
                  description={resource.comment || resource.description}
                  type="lesson"
                  url={resource.file_url || resource.link_url}
                  category={resource.assignment_ids?.length ? 'attached' : 'resource'}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => (
                <ResourceCard
                  key={video.id}
                  title={video.title}
                  description={video.description}
                  type="video"
                  url={video.url}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drills">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCurriculum
                .filter(c => c.category === "fundamentals" || c.category === "technical")
                .map((item) => (
                  <ResourceCard
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    type="drill"
                    level={item.level}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="promos">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCurriculum
                .filter(c => c.category === "character" || c.category === "performance")
                .map((item) => (
                  <ResourceCard
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    type="promo"
                    level={item.level}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="lessons">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCurriculum.map((item) => (
                <ResourceCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  type="lesson"
                  level={item.level}
                  category={item.category}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ResourceCard({ title, description, type, level, category, url }) {
  const typeConfig = {
    video: { icon: Video, color: "text-red-400", bg: "bg-red-500/10" },
    lesson: { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
    drill: { icon: Dumbbell, color: "text-green-400", bg: "bg-green-500/10" },
    promo: { icon: Mic, color: "text-purple-400", bg: "bg-purple-500/10" },
  };

  const config = typeConfig[type] || typeConfig.lesson;
  const Icon = config.icon;

  return (
    <Card className="border-gray-800 bg-[#0b0b0b] hover:border-purple-600/50 transition-all group cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {level && (
                <Badge variant="outline" className="text-[10px] capitalize">
                  {level}
                </Badge>
              )}
              {category && (
                <Badge variant="outline" className="text-[10px] capitalize">
                  {category}
                </Badge>
              )}
            </div>
          </div>
          {type === "video" && (
            <Play className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}