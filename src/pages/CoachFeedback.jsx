import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Video, ClipboardList, BookOpen } from "lucide-react";

export default function CoachFeedback() {
  const [user, setUser] = useState(null);

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

  const { data: progressReports = [] } = useQuery({
    queryKey: ['progressReports', user?.id],
    queryFn: () => base44.entities.ProgressReport.filter({ trainee_id: user.id }, '-report_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', user?.id],
    queryFn: () => base44.entities.Assignment.filter({ trainee_id: user.id, status: 'graded' }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['videos', user?.id],
    queryFn: () => base44.entities.Video.filter({ trainee_id: user.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: trainingLogs = [] } = useQuery({
    queryKey: ['trainingLogs', user?.id],
    queryFn: () => base44.entities.TrainingLog.filter({ trainee_id: user.id }, '-date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const getCoachName = (coachId) => {
    const coach = allUsers.find(u => u.id === coachId);
    return coach?.wrestling_name || coach?.full_name || 'Coach';
  };

  const logsWithFeedback = trainingLogs.filter(log => log.coach_feedback);
  const videosWithFeedback = videos.filter(v => v.coach_feedback || v.ai_feedback);

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8" style={{ color: '#8b3dff' }} />
            Coach Feedback
          </h1>
          <p className="text-gray-400">All feedback and evaluations in one place</p>
        </div>

        {/* Progress Reports */}
        {progressReports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: '#8b3dff' }} />
              Progress Reports & Evaluations
            </h2>
            <div className="space-y-4">
              {progressReports.map((report) => (
                <Card key={report.id} className="border-gray-800" style={{ background: '#0f0f0f' }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={report.report_type === 'coach_evaluation' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'}>
                            {report.report_type === 'coach_evaluation' ? 'Coach Evaluation' : 'AI Report'}
                          </Badge>
                          {report.overall_grade && (
                            <Badge className="bg-green-900 text-green-300">
                              Grade: {report.overall_grade}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-white">
                          {new Date(report.report_date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </CardTitle>
                        {report.coach_id && (
                          <p className="text-sm text-gray-400 mt-1">By {getCoachName(report.coach_id)}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.coach_review && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Coach's Notes</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{report.coach_review}</p>
                      </div>
                    )}
                    {report.summary && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Summary</h4>
                        <p className="text-gray-300">{report.summary}</p>
                      </div>
                    )}
                    {report.strengths?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
                        <ul className="space-y-1">
                          {report.strengths.map((strength, idx) => (
                            <li key={idx} className="text-gray-300 flex gap-2">
                              <span style={{ color: '#8b3dff' }}>✓</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.areas_for_improvement?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-400 mb-2">Areas to Improve</h4>
                        <ul className="space-y-1">
                          {report.areas_for_improvement.map((area, idx) => (
                            <li key={idx} className="text-gray-300 flex gap-2">
                              <span style={{ color: '#dc2626' }}>→</span>
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.recommendations?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-purple-400 mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {report.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-gray-300 flex gap-2">
                              <span>•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Assignment Feedback */}
        {assignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" style={{ color: '#8b3dff' }} />
              Assignment Feedback
            </h2>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="border-gray-800" style={{ background: '#0f0f0f' }}>
                  <CardHeader>
                    <CardTitle className="text-white">{assignment.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-900 text-green-300">
                        Grade: {assignment.grade}/10
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {new Date(assignment.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Coach Feedback</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{assignment.feedback}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Video Feedback */}
        {videosWithFeedback.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Video className="w-5 h-5" style={{ color: '#8b3dff' }} />
              Video Analysis Feedback
            </h2>
            <div className="space-y-4">
              {videosWithFeedback.map((video) => (
                <Card key={video.id} className="border-gray-800" style={{ background: '#0f0f0f' }}>
                  <CardHeader>
                    <CardTitle className="text-white">{video.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {video.overall_score && (
                        <Badge className="bg-blue-900 text-blue-300">
                          Score: {video.overall_score}/10
                        </Badge>
                      )}
                      <span className="text-sm text-gray-400">
                        {new Date(video.created_date).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {video.coach_feedback && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Coach Feedback</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{video.coach_feedback}</p>
                      </div>
                    )}
                    {video.ai_feedback && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Analysis</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{video.ai_feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Training Log Feedback */}
        {logsWithFeedback.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: '#8b3dff' }} />
              Training Session Feedback
            </h2>
            <div className="space-y-4">
              {logsWithFeedback.map((log) => (
                <Card key={log.id} className="border-gray-800" style={{ background: '#0f0f0f' }}>
                  <CardHeader>
                    <CardTitle className="text-white capitalize">{log.drill_type.replace(/_/g, ' ')}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {log.coach_grade && (
                        <Badge className="bg-purple-900 text-purple-300">
                          Coach Grade: {log.coach_grade}/10
                        </Badge>
                      )}
                      <span className="text-sm text-gray-400">
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 whitespace-pre-wrap">{log.coach_feedback}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Feedback Message */}
        {progressReports.length === 0 && assignments.length === 0 && videosWithFeedback.length === 0 && logsWithFeedback.length === 0 && (
          <Card className="border-gray-800" style={{ background: '#0f0f0f' }}>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500 text-lg">No feedback received yet</p>
              <p className="text-gray-600 text-sm mt-2">Keep training and submitting work to receive coach feedback</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}