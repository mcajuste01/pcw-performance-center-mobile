import React, { useState, useEffect } from "react";
import { Trophy, Sparkles } from "lucide-react";

export default function XPProgressRing({ xp = 0, level = 1, size = 80, showLabel = true }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const xpForLevel = (lvl) => lvl * 500;
  const xpNeeded = xpForLevel(level);
  const currentLevelXP = xp % xpNeeded;
  const progress = xpNeeded > 0 ? (currentLevelXP / xpNeeded) * 100 : 0;

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Level up animation
  useEffect(() => {
    if (xp > 0 && currentLevelXP === 0) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [level]);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Level up celebration */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center animate-ping">
          <Sparkles className="w-full h-full text-yellow-400" />
        </div>
      )}

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-800"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#xpGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b3dff" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Trophy className="w-4 h-4 text-purple-400 mb-0.5" />
        <span className="text-sm font-bold text-white">{level}</span>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
          <p className="text-[10px] text-gray-400">
            {currentLevelXP}/{xpNeeded} XP
          </p>
        </div>
      )}
    </div>
  );
}