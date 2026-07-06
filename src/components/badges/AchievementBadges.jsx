import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Flame,
  Award,
  Mic,
  Heart,
  Calendar,
  Star,
  Zap,
  Trophy,
  Target,
  Dumbbell,
  Users,
  Crown,
} from "lucide-react";

const badgeDefinitions = [
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "7 day check-in streak",
    icon: Flame,
    color: "from-orange-500 to-red-500",
    requirement: (stats) => stats.streak >= 7,
  },
  {
    id: "streak_30",
    name: "Monthly Monster",
    description: "30 day check-in streak",
    icon: Flame,
    color: "from-orange-400 to-yellow-500",
    requirement: (stats) => stats.streak >= 30,
    rare: true,
  },
  {
    id: "first_bump",
    name: "First Bump",
    description: "Complete your first training session",
    icon: Dumbbell,
    color: "from-blue-500 to-cyan-500",
    requirement: (stats) => stats.checkIns >= 1,
  },
  {
    id: "promo_beast",
    name: "Promo Beast",
    description: "Complete 5 promo assignments",
    icon: Mic,
    color: "from-purple-500 to-pink-500",
    requirement: (stats) => stats.promoAssignments >= 5,
  },
  {
    id: "cardio_king",
    name: "Cardio King",
    description: "Log 10+ hours of conditioning",
    icon: Heart,
    color: "from-red-500 to-pink-500",
    requirement: (stats) => stats.conditioningHours >= 10,
  },
  {
    id: "perfect_attendance",
    name: "Perfect Attendance",
    description: "Attend all sessions in a month",
    icon: Calendar,
    color: "from-green-500 to-emerald-500",
    requirement: (stats) => stats.perfectMonth,
    rare: true,
  },
  {
    id: "match_ready",
    name: "Match Ready",
    description: "Get approved for your first match",
    icon: Star,
    color: "from-yellow-400 to-orange-500",
    requirement: (stats) => stats.matchReady,
    rare: true,
  },
  {
    id: "high_scorer",
    name: "High Performer",
    description: "Average score of 8+ on assignments",
    icon: Target,
    color: "from-indigo-500 to-purple-500",
    requirement: (stats) => stats.avgScore >= 8,
  },
  {
    id: "team_player",
    name: "Team Player",
    description: "Help 5 other trainees",
    icon: Users,
    color: "from-cyan-500 to-blue-500",
    requirement: (stats) => stats.helpedOthers >= 5,
  },
  {
    id: "level_10",
    name: "Rising Star",
    description: "Reach Level 10",
    icon: Trophy,
    color: "from-yellow-500 to-amber-500",
    requirement: (stats) => stats.level >= 10,
  },
  {
    id: "level_25",
    name: "Ring General",
    description: "Reach Level 25",
    icon: Crown,
    color: "from-amber-400 to-yellow-300",
    requirement: (stats) => stats.level >= 25,
    legendary: true,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Check in before 7 AM",
    icon: Zap,
    color: "from-orange-400 to-yellow-400",
    requirement: (stats) => stats.earlyCheckIn,
  },
];

export default function AchievementBadges({ stats = {} }) {
  const earnedBadges = badgeDefinitions.filter(b => b.requirement(stats));
  const lockedBadges = badgeDefinitions.filter(b => !b.requirement(stats));

  return (
    <Card className="border-gray-800 bg-[#050505]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Achievement Badges
          <span className="text-sm text-gray-500 font-normal ml-2">
            {earnedBadges.length}/{badgeDefinitions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Earned</p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {earnedBadges.map((badge) => (
                <BadgeItem key={badge.id} badge={badge} earned />
              ))}
            </div>
          </div>
        )}

        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Locked</p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {lockedBadges.map((badge) => (
                <BadgeItem key={badge.id} badge={badge} earned={false} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BadgeItem({ badge, earned }) {
  const Icon = badge.icon;

  return (
    <div
      className={`group relative flex flex-col items-center p-3 rounded-xl transition-all ${
        earned
          ? "bg-gray-800/50 hover:bg-gray-800"
          : "bg-gray-900/30 opacity-40"
      }`}
    >
      {/* Badge icon */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
          earned
            ? `bg-gradient-to-br ${badge.color}`
            : "bg-gray-800"
        } ${badge.legendary ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-black" : ""} ${
          badge.rare ? "ring-1 ring-purple-400" : ""
        }`}
      >
        <Icon className={`w-6 h-6 ${earned ? "text-white" : "text-gray-600"}`} />
      </div>

      {/* Badge name */}
      <p className={`text-xs text-center font-medium ${earned ? "text-white" : "text-gray-600"}`}>
        {badge.name}
      </p>

      {/* Rarity indicator */}
      {badge.legendary && earned && (
        <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 bg-yellow-500 text-black rounded-full font-bold">
          ★
        </span>
      )}
      {badge.rare && !badge.legendary && earned && (
        <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 bg-purple-500 text-white rounded-full">
          R
        </span>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap transition-opacity">
        <p className="text-xs text-white font-medium">{badge.name}</p>
        <p className="text-[10px] text-gray-400">{badge.description}</p>
      </div>
    </div>
  );
}

export function BadgeDisplay({ badgeId, size = "md" }) {
  const badge = badgeDefinitions.find(b => b.id === badgeId);
  if (!badge) return null;

  const Icon = badge.icon;
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-gradient-to-br ${badge.color}`}
      title={badge.name}
    >
      <Icon className="w-1/2 h-1/2 text-white" />
    </div>
  );
}