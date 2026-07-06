import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import ShowcaseFeedbackForm from "@/components/showcase/ShowcaseFeedbackForm";
import ShowcaseFeedbackList from "@/components/showcase/ShowcaseFeedbackList";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

export default function ShowcaseFeedback() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ["showcaseProfiles"],
    queryFn: async () => {
      const res = await base44.entities.UserProfile.list();
      return toArray(res);
    },
    initialData: [],
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ["showcaseFeedback"],
    enabled: !!user,
    queryFn: async () => {
      const res = await base44.entities.ShowcaseFeedback.list("-showcase_month");
      return toArray(res);
    },
    initialData: [],
  });

  const roles = user?.roles || (user?.role ? [user.role] : []);
  const isCoach = roles.includes("coach") || roles.includes("admin") || user?.role === "admin";

  const trainees = useMemo(
    () => profiles.filter((profile) => profile.role === "trainee"),
    [profiles]
  );

  // trainee_id on ShowcaseFeedback is the UserProfile record ID, not the auth user ID
  const myProfile = useMemo(() => profiles.find(p => p.auth_user_id === user?.id), [profiles, user]);

  const visibleFeedback = useMemo(() => {
    if (!user) return [];
    if (isCoach) return feedback;
    return feedback.filter(
      (item) => item.trainee_id === myProfile?.id && item.visibility === "trainee_visible"
    );
  }, [feedback, isCoach, user, myProfile]);

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-400" />
            Showcase Feedback
          </h1>
          <p className="text-gray-400 mt-2">Monthly showcase notes from coaches, visible to trainees.</p>
        </div>

        {isCoach && user && <ShowcaseFeedbackForm trainees={trainees} currentUser={user} />}

        <Card className="border-gray-800 bg-[#0f0f0f]">
          <CardHeader>
            <CardTitle className="text-white">{isCoach ? "All showcase feedback" : "My showcase feedback"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ShowcaseFeedbackList items={visibleFeedback} profiles={profiles} isCoachView={isCoach} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}