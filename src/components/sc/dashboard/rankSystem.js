// Performance XP -> Rank ladder (7 ranks)
export const RANKS = [
  { key: "recruit", name: "Recruit", min: 0, color: "#9ca3af" },
  { key: "prospect", name: "Prospect", min: 300, color: "#60a5fa" },
  { key: "competitor", name: "Competitor", min: 800, color: "#34d399" },
  { key: "performer", name: "Performer", min: 1500, color: "#a78bfa" },
  { key: "contender", name: "Contender", min: 2500, color: "#fbbf24" },
  { key: "champion", name: "Champion", min: 4000, color: "#f87171" },
  { key: "elite", name: "Elite", min: 6000, color: "#8b3dff" },
];

export function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) if (xp >= r.min) rank = r;
  return rank;
}

export function getNextRank(xp) {
  for (const r of RANKS) if (xp < r.min) return r;
  return null;
}

export function getRankProgress(xp) {
  const rank = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return { pct: 100, into: xp - rank.min, needed: 0, next: null, rank };
  const into = xp - rank.min;
  const span = next.min - rank.min;
  return {
    pct: Math.min(100, Math.round((into / span) * 100)),
    into,
    needed: span,
    next,
    rank,
  };
}