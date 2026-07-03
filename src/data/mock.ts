import type {
  DashboardCard,
  Friend,
  LeaderboardEntry,
  MatchHistory,
  Mission,
  ModeCard,
  PlayerState,
  QuizMaster,
  QuizQuestion,
  ShopItem
} from "../types";

export const dashboardCards: DashboardCard[] = [
  { key: "play", title: "Play", eyebrow: "Live Match", description: "Launch local, online, practice, AI challenge, and community quiz sessions." },
  { key: "tournament", title: "Tournament", eyebrow: "Competitive", description: "Create free tournaments and unlock premium staging options with coins." },
  { key: "missions", title: "Missions", eyebrow: "Progression", description: "Track daily, weekly, and seasonal objectives that fuel XP and cosmetics." },
  { key: "history", title: "History", eyebrow: "Archive", description: "Review complete match logs with winners, timing, categories, and rewards." },
  { key: "leaderboards", title: "Leaderboards", eyebrow: "Ranked", description: "Compare world, Morocco, and friends rankings by speed, wins, and XP." },
  { key: "miniGames", title: "Mini Games", eyebrow: "Warmup", description: "Earn extra coins through reaction drills and memory rounds." },
  { key: "statistics", title: "Statistics", eyebrow: "Analytics", description: "Visualize buzz speed, favorite categories, scores, and progression curves." },
  { key: "shop", title: "Shop", eyebrow: "Cosmetics", description: "Spend coins on quiz masters, themes, titles, frames, and premium effects." },
  { key: "rules", title: "Rules", eyebrow: "Onboarding", description: "Explain game flow with clear timing, scoring, and joker behavior." },
  { key: "settings", title: "Settings", eyebrow: "Control", description: "Language, TTS, graphics, accessibility, motion, and audio presets." },
  { key: "profile", title: "Profile", eyebrow: "Identity", description: "Showcase your avatar, achievements, badges, creations, and favorite language." },
  { key: "friends", title: "Friends", eyebrow: "Social", description: "Handle requests, invites, online presence, and recent team activity." }
];

export const playModes: ModeCard[] = [
  { id: "local", title: "Local Multiplayer", description: "Desktop uses S, D, K, L. Mobile shifts to one giant red buzz button.", tag: "Same Device" },
  { id: "online", title: "Online Multiplayer", description: "Quick match, private rooms, invite codes, friends invites, and spectator support.", tag: "Realtime" },
  { id: "practice", title: "Practice", description: "Low-pressure solo training with category targeting and streak bonuses.", tag: "Solo" },
  { id: "ai", title: "AI Challenge", description: "Face adaptive quiz pacing and post-answer explanations from the Quiz Master.", tag: "Smart" },
  { id: "custom", title: "Custom Quiz", description: "Load your private quiz packs or tournament rule sets instantly.", tag: "Creator" },
  { id: "community", title: "Community Quizzes", description: "Discover trending multilingual quizzes from the public library.", tag: "Explore" }
];

export const missions: Mission[] = [
  { id: "m1", title: "Land 15 fast buzzes under 450ms", cadence: "Daily", progress: 9, goal: 15, rewardCoins: 120, rewardXp: 90 },
  { id: "m2", title: "Win 3 matches in Morocco ranking queue", cadence: "Weekly", progress: 1, goal: 3, rewardCoins: 450, rewardXp: 300 },
  { id: "m3", title: "Publish a bilingual quiz pack", cadence: "Seasonal", progress: 1, goal: 1, rewardCoins: 800, rewardXp: 600 }
];

export const history: MatchHistory[] = [
  { id: "h1", mode: "Online Ranked", winner: "Sara Volt", score: "1280 - 1170", reactionMs: 344, duration: "11m 24s", category: "Science", playedAt: "2026-07-02 21:14" },
  { id: "h2", mode: "Local Arena", winner: "You", score: "920 - 880 - 700 - 640", reactionMs: 291, duration: "8m 09s", category: "General Knowledge", playedAt: "2026-07-02 18:33" },
  { id: "h3", mode: "Tournament Semi Final", winner: "Nayla Prism", score: "1420 - 1180", reactionMs: 309, duration: "13m 02s", category: "History", playedAt: "2026-07-01 22:08" }
];

export const shopItems: ShopItem[] = [
  { id: "s1", name: "Neon Atlas Frame", category: "Frame", price: 420, rarity: "Epic" },
  { id: "s2", name: "Pulse Core Buzzer", category: "Buzz Button", price: 300, rarity: "Rare" },
  { id: "s3", name: "Aurora Arena Theme", category: "Theme", price: 850, rarity: "Legendary" },
  { id: "s4", name: "Astra Host", category: "Quiz Master", price: 1100, rarity: "Legendary", locked: true }
];

export const friends: Friend[] = [
  { id: "f1", name: "Nayla Prism", status: "Online", activity: "Browsing tournament rooms" },
  { id: "f2", name: "Youssef Drift", status: "In Match", activity: "Ranked duel on World ladder" },
  { id: "f3", name: "Sara Volt", status: "Idle", activity: "Published a new cinema quiz" }
];

export const quizMasters: QuizMaster[] = [
  { id: "qm-default", name: "Default Quiz Master", voice: "Fr / En dynamic host", unlock: "Always available", tone: "The official forever host for every arena." },
  { id: "qm-astra", name: "Astra Host", voice: "Cinematic AI alto", unlock: "Unlock shop at level 7", tone: "Elegant holographic presenter with cooler pacing." },
  { id: "qm-rift", name: "Rift Marshal", voice: "Deep command voice", unlock: "Shop purchase after level 12", tone: "Sharper countdown cues and intense intros." }
];

export const leaderboards: LeaderboardEntry[] = [
  { rank: 1, player: "Aya Nova", region: "World", xp: 58200, winRate: 78, reactionMs: 242 },
  { rank: 2, player: "You", region: "Morocco", xp: 41240, winRate: 69, reactionMs: 279 },
  { rank: 3, player: "Nayla Prism", region: "Friends", xp: 40510, winRate: 67, reactionMs: 286 }
];

export const samplePlayers: PlayerState[] = [
  { id: "p1", name: "S Player", score: 620, coins: 48, xp: 210, streak: 2 },
  { id: "p2", name: "D Player", score: 540, coins: 34, xp: 180, streak: 1 },
  { id: "p3", name: "K Player", score: 710, coins: 60, xp: 240, streak: 3 },
  { id: "p4", name: "L Player", score: 390, coins: 25, xp: 140, streak: 0 }
];

export const sampleQuestions: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "Which city is the capital of Morocco?",
    options: ["Casablanca", "Rabat", "Tangier", "Marrakesh"],
    answer: "Rabat",
    category: "Geography"
  },
  {
    id: "q2",
    prompt: "How many milliseconds are stored for reaction time precision in Quiz Arena?",
    options: ["10", "100", "1000", "Unlimited"],
    answer: "1000",
    category: "Platform Rules"
  },
  {
    id: "q3",
    prompt: "Which unlock level opens the purchasable Quiz Master shop?",
    options: ["3", "5", "7", "10"],
    answer: "7",
    category: "Progression"
  }
];
