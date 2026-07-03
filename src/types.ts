export type NavKey =
  | "home"
  | "play"
  | "tournament"
  | "missions"
  | "history"
  | "leaderboards"
  | "miniGames"
  | "statistics"
  | "shop"
  | "rules"
  | "settings"
  | "profile"
  | "friends"
  | "creator";

export type ModeCard = {
  id: string;
  title: string;
  description: string;
  tag: string;
};

export type DashboardCard = {
  key: NavKey;
  title: string;
  eyebrow: string;
  description: string;
};

export type Mission = {
  id: string;
  title: string;
  cadence: "Daily" | "Weekly" | "Seasonal";
  progress: number;
  goal: number;
  rewardCoins: number;
  rewardXp: number;
};

export type MatchHistory = {
  id: string;
  mode: string;
  winner: string;
  score: string;
  reactionMs: number;
  duration: string;
  category: string;
  playedAt: string;
};

export type ShopItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  rarity: string;
  locked?: boolean;
};

export type Friend = {
  id: string;
  name: string;
  status: "Online" | "In Match" | "Idle";
  activity: string;
};

export type QuizMaster = {
  id: string;
  name: string;
  voice: string;
  unlock: string;
  tone: string;
};

export type LeaderboardEntry = {
  rank: number;
  player: string;
  region: string;
  xp: number;
  winRate: number;
  reactionMs: number;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  category: string;
};

export type PlayerState = {
  id: string;
  name: string;
  score: number;
  coins: number;
  xp: number;
  streak: number;
};
