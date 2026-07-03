import { useEffect, useMemo, useState } from "react";
import {
  dashboardCards,
  friends,
  history,
  leaderboards,
  missions,
  playModes,
  quizMasters,
  samplePlayers,
  sampleQuestions,
  shopItems
} from "./data/mock";
import type { NavKey, PlayerState } from "./types";

const navItems: { key: NavKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "play", label: "Play" },
  { key: "tournament", label: "Tournament" },
  { key: "missions", label: "Missions" },
  { key: "history", label: "History" },
  { key: "leaderboards", label: "Leaderboards" },
  { key: "miniGames", label: "Mini Games" },
  { key: "statistics", label: "Statistics" },
  { key: "shop", label: "Shop" },
  { key: "rules", label: "Rules" },
  { key: "settings", label: "Settings" },
  { key: "profile", label: "Profile" },
  { key: "friends", label: "Friends" },
  { key: "creator", label: "Quiz Creator" }
];

const playerKeys = ["S", "D", "K", "L"] as const;

function App() {
  const [active, setActive] = useState<NavKey>("home");
  const [theme, setTheme] = useState<"night" | "light">("night");
  const [language, setLanguage] = useState("English");
  const [players, setPlayers] = useState<PlayerState[]>(samplePlayers);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [buzzedBy, setBuzzedBy] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(18);

  const question = sampleQuestions[questionIndex];
  const isMobile = useMemo(() => window.matchMedia("(max-width: 720px)").matches, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (active !== "play") {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      const index = playerKeys.findIndex((value) => value === key);
      if (index === -1 || buzzedBy) {
        return;
      }
      const player = players[index];
      setBuzzedBy(player.name);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, buzzedBy, players]);

  useEffect(() => {
    if (active !== "play") {
      return;
    }
    setTimeLeft(18);
    const timer = window.setInterval(() => {
      setTimeLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, questionIndex]);

  const nextQuestion = () => {
    setQuestionIndex((value) => (value + 1) % sampleQuestions.length);
    setBuzzedBy(null);
  };

  const rewardPlayer = (isCorrect: boolean) => {
    if (!buzzedBy) {
      return;
    }
    setPlayers((current) =>
      current.map((player) =>
        player.name === buzzedBy
          ? {
              ...player,
              score: player.score + (isCorrect ? 120 : -40),
              coins: player.coins + (isCorrect ? 12 : 0),
              xp: player.xp + (isCorrect ? 25 : 5),
              streak: isCorrect ? player.streak + 1 : 0
            }
          : player
      )
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar glass-panel">
        <div className="brand">
          <div className="brand-mark">QA</div>
          <div>
            <p>QUIZ ARENA</p>
            <span>Premium Multiplayer Quiz Game</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={item.key === active ? "nav-chip active" : "nav-chip"}
              onClick={() => setActive(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="quizmaster-card">
          <img src="/assets/img/quizmaster.png" alt="Official Quiz Master" />
          <div>
            <p>Official Quiz Master</p>
            <span>Always visible · permanent default host</span>
          </div>
        </div>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <div>
            <p className="eyebrow">Release Foundation</p>
            <h1>Quiz Arena Control Deck</h1>
          </div>
          <div className="topbar-actions">
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {["English", "Français", "العربية", "Español", "Deutsch"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button className="ghost-button" onClick={() => setTheme(theme === "night" ? "light" : "night")} type="button">
              {theme === "night" ? "Light Mode" : "Night Mode"}
            </button>
            <button className="primary-button" type="button">
              Sign In / Create Account
            </button>
          </div>
        </header>

        {active === "home" && (
          <section className="page-stack">
            <section className="hero glass-panel">
              <div className="hero-copy">
                <p className="eyebrow">Welcome Screen</p>
                <h2>The 2026 multiplayer quiz arena for local chaos, online rivalry, and creator-driven competition.</h2>
                <p className="body-copy">
                  This foundation delivers the visual identity, information architecture, and typed frontend scaffold for a production Quiz Arena build in React, Vite, TypeScript, and Supabase.
                </p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => setActive("play")} type="button">
                    Enter Play Hub
                  </button>
                  <button className="ghost-button" onClick={() => setActive("creator")} type="button">
                    Open Quiz Creator
                  </button>
                </div>
              </div>
              <div className="hero-stage">
                <div className="orbit orbit-a" />
                <div className="orbit orbit-b" />
                <div className="hero-core">BUZZ</div>
                <div className="status-card glass-panel">
                  <span>Live Systems</span>
                  <strong>Auth · Rooms · Rankings · Creator</strong>
                </div>
              </div>
            </section>

            <section className="dashboard-grid">
              {dashboardCards.map((card) => (
                <button key={card.key} className="dashboard-card glass-panel" onClick={() => setActive(card.key)} type="button">
                  <p>{card.eyebrow}</p>
                  <h3>{card.title}</h3>
                  <span>{card.description}</span>
                </button>
              ))}
            </section>
          </section>
        )}

        {active === "play" && (
          <section className="page-stack">
            <section className="section-head">
              <div>
                <p className="eyebrow">Play Page</p>
                <h2>Local, online, practice, AI challenge, custom, and community play in one hub.</h2>
              </div>
              <div className="pill-row">
                {playModes.map((mode) => (
                  <div className="pill-card glass-panel" key={mode.id}>
                    <span>{mode.tag}</span>
                    <strong>{mode.title}</strong>
                    <p>{mode.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="arena-layout">
              <div className="arena-primary glass-panel">
                <div className="arena-header">
                  <div>
                    <p className="eyebrow">Local Multiplayer Demo</p>
                    <h3>{question.prompt}</h3>
                  </div>
                  <div className={timeLeft <= 5 ? "timer-ring danger" : "timer-ring"}>{timeLeft}s</div>
                </div>
                <div className="answer-grid">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      className={
                        option === question.answer && buzzedBy
                          ? "answer-card correct"
                          : "answer-card"
                      }
                      onClick={() => {
                        if (!buzzedBy) return;
                        rewardPlayer(option === question.answer);
                      }}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="buzz-zone">
                  {isMobile ? (
                    <button className="mobile-buzz" onClick={() => !buzzedBy && setBuzzedBy("Mobile Player")} type="button">
                      BUZZ
                    </button>
                  ) : (
                    playerKeys.map((key, index) => (
                      <div className="key-lane" key={key}>
                        <strong>{key}</strong>
                        <span>{players[index].name}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="arena-footer">
                  <div className="announcement">
                    {buzzedBy ? `${buzzedBy} buzzed first. Validate the answer, then advance the round.` : "Waiting for the first buzz."}
                  </div>
                  <button className="primary-button" onClick={nextQuestion} type="button">
                    Next Question
                  </button>
                </div>
              </div>

              <div className="arena-side">
                <section className="glass-panel compact-panel">
                  <p className="eyebrow">Scoreboard</p>
                  {players.map((player) => (
                    <div className="score-row" key={player.id}>
                      <div>
                        <strong>{player.name}</strong>
                        <span>{player.xp} XP · {player.coins} coins</span>
                      </div>
                      <b>{player.score}</b>
                    </div>
                  ))}
                </section>
                <section className="glass-panel compact-panel">
                  <p className="eyebrow">Match Flow</p>
                  <ol className="flow-list">
                    <li>Lobby and player connection</li>
                    <li>Quiz Master introduction</li>
                    <li>Countdown and timed question</li>
                    <li>Buzz capture and answer validation</li>
                    <li>Scoreboard animation and rewards</li>
                    <li>History save and ranking update</li>
                  </ol>
                </section>
              </div>
            </section>
          </section>
        )}

        {active === "tournament" && (
          <SectionFrame
            eyebrow="Tournament"
            title="Free tournament creation with premium coin-powered staging."
            body="Bracket identity, custom banners, rewards, passwords, and advanced room settings belong to the premium tournament layer."
          >
            <div className="split-grid">
              <div className="glass-panel detail-card">
                <h3>Creation Tracks</h3>
                <ul className="plain-list">
                  <li>Free setup for public or private events</li>
                  <li>Premium cosmetics: banner, palette, logo, win burst</li>
                  <li>Advanced options: password, spectator rules, custom rewards</li>
                  <li>Host controls with reconnect-safe room state</li>
                </ul>
              </div>
              <div className="glass-panel detail-card">
                <h3>Monetization Ready</h3>
                <p>Coin sinks are scoped to presentation and event controls, not gameplay power. That keeps ranked integrity intact while supporting premium customization.</p>
              </div>
            </div>
          </SectionFrame>
        )}

        {active === "missions" && (
          <SectionFrame eyebrow="Missions" title="Daily, weekly, and seasonal progression with rewards that feel worth chasing." body="Mission state is designed to sync per user, support resets, and feed both XP and cosmetic economy loops.">
            <div className="list-grid">
              {missions.map((mission) => (
                <article className="glass-panel progress-card" key={mission.id}>
                  <div className="progress-head">
                    <div>
                      <p>{mission.cadence}</p>
                      <h3>{mission.title}</h3>
                    </div>
                    <strong>{mission.rewardCoins}c</strong>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${(mission.progress / mission.goal) * 100}%` }} />
                  </div>
                  <small>
                    {mission.progress} / {mission.goal} · {mission.rewardXp} XP
                  </small>
                </article>
              ))}
            </div>
          </SectionFrame>
        )}

        {active === "history" && (
          <SectionFrame eyebrow="History" title="Every match becomes an analytics-ready record." body="Mode, winner, score, reaction time, duration, and category are all preserved for history, profile, and leaderboard services.">
            <div className="table-card glass-panel">
              {history.map((entry) => (
                <div className="table-row" key={entry.id}>
                  <div>
                    <strong>{entry.mode}</strong>
                    <span>{entry.playedAt} · {entry.category}</span>
                  </div>
                  <div>{entry.winner}</div>
                  <div>{entry.score}</div>
                  <div>{entry.reactionMs} ms</div>
                </div>
              ))}
            </div>
          </SectionFrame>
        )}

        {active === "leaderboards" && (
          <SectionFrame eyebrow="Leaderboards" title="World, Morocco, and friends ladders with reaction speed at the center." body="The leaderboard model separates periodic snapshots from source match data so the app can scale without expensive recalculations on every screen render.">
            <div className="table-card glass-panel">
              {leaderboards.map((entry) => (
                <div className="table-row" key={entry.rank}>
                  <div>
                    <strong>#{entry.rank} {entry.player}</strong>
                    <span>{entry.region}</span>
                  </div>
                  <div>{entry.xp.toLocaleString()} XP</div>
                  <div>{entry.winRate}% WR</div>
                  <div>{entry.reactionMs} ms</div>
                </div>
              ))}
            </div>
          </SectionFrame>
        )}

        {active === "miniGames" && (
          <SectionFrame eyebrow="Mini Games" title="Short-form drills that feed coins and keep players warm." body="Mini games should be low-friction, mobile-friendly, and tied into the same reward ledger as main matches.">
            <div className="split-grid">
              <div className="glass-panel detail-card">
                <h3>Reaction Forge</h3>
                <p>Tap the pulse at exact timing windows to boost daily speed rewards.</p>
              </div>
              <div className="glass-panel detail-card">
                <h3>Memory Grid</h3>
                <p>Replay glowing sequences to earn extra tournament entry currency.</p>
              </div>
            </div>
          </SectionFrame>
        )}

        {active === "statistics" && (
          <SectionFrame eyebrow="Statistics" title="Clear, premium analytics instead of noisy charts." body="These cards map directly to profile modules and can later plug into real charting once telemetry is wired.">
            <div className="stats-grid">
              <StatCard label="Win Rate" value="69%" />
              <StatCard label="Fastest Buzz" value="242ms" />
              <StatCard label="Average Score" value="1,080" />
              <StatCard label="XP This Week" value="+2,480" />
              <StatCard label="Favorite Category" value="Science" />
              <StatCard label="World Record Watch" value="198ms" />
            </div>
          </SectionFrame>
        )}

        {active === "shop" && (
          <SectionFrame eyebrow="Shop" title="Cosmetic-first economy with clear rarity and level gating." body="Quiz Masters stay visual and audio only. Gameplay remains fair while the shop still feels aspirational.">
            <div className="list-grid">
              {shopItems.map((item) => (
                <article className="glass-panel shop-card" key={item.id}>
                  <p>{item.category}</p>
                  <h3>{item.name}</h3>
                  <span>{item.rarity}</span>
                  <strong>{item.price} coins</strong>
                  <button className="ghost-button" type="button">
                    {item.locked ? "Locked by Level" : "Preview"}
                  </button>
                </article>
              ))}
            </div>
          </SectionFrame>
        )}

        {active === "rules" && (
          <SectionFrame eyebrow="Rules" title="Game rules should feel readable, illustrated, and immediate." body="Important actions stay visible, timers remain obvious, and controls change gracefully between keyboard and touch.">
            <div className="split-grid">
              <div className="glass-panel detail-card">
                <h3>Desktop Controls</h3>
                <p>Player buzz keys are fixed to S, D, K, and L for consistent muscle memory and low latency local matches.</p>
              </div>
              <div className="glass-panel detail-card">
                <h3>Mobile Controls</h3>
                <p>Touch devices swap the keyboard layout for one large red buzz button while keeping the Quiz Master visible above the question.</p>
              </div>
            </div>
          </SectionFrame>
        )}

        {active === "settings" && (
          <SectionFrame eyebrow="Settings" title="Language, TTS, graphics, audio, and accessibility are first-class systems." body="The frontend already exposes the major preference clusters that should map to persistent Supabase user settings.">
            <div className="settings-grid">
              <SettingTile title="Language" value={language} />
              <SettingTile title="TTS Voice" value="Dynamic host voice" />
              <SettingTile title="Motion" value="Standard / Reduced" />
              <SettingTile title="Accessibility" value="Contrast, font, keyboard nav" />
              <SettingTile title="Graphics" value="Performance / Quality" />
              <SettingTile title="Audio" value="Music, SFX, voice mix" />
            </div>
          </SectionFrame>
        )}

        {active === "profile" && (
          <SectionFrame eyebrow="Profile" title="A player profile should show identity, mastery, and creator contribution at a glance." body="Level, coins, achievements, created quizzes, favorite language, and tournament wins all belong to the primary profile card stack.">
            <div className="split-grid">
              <div className="glass-panel detail-card">
                <h3>Player Snapshot</h3>
                <p>Level 12 · 4,280 coins · 18 badges · 6 tournament wins · 14 quizzes published.</p>
              </div>
              <div className="glass-panel detail-card">
                <h3>Quiz Masters</h3>
                {quizMasters.map((quizMaster) => (
                  <div className="mini-row" key={quizMaster.id}>
                    <div>
                      <strong>{quizMaster.name}</strong>
                      <span>{quizMaster.unlock}</span>
                    </div>
                    <small>{quizMaster.voice}</small>
                  </div>
                ))}
              </div>
            </div>
          </SectionFrame>
        )}

        {active === "friends" && (
          <SectionFrame eyebrow="Friends" title="Social presence supports invites, rooms, profile views, and activity trails." body="Realtime presence, requests, blocks, and private invites are broken into separate backend concerns for easier moderation and scale.">
            <div className="list-grid">
              {friends.map((friend) => (
                <article className="glass-panel friend-card" key={friend.id}>
                  <p>{friend.status}</p>
                  <h3>{friend.name}</h3>
                  <span>{friend.activity}</span>
                  <button className="ghost-button" type="button">Invite to Room</button>
                </article>
              ))}
            </div>
          </SectionFrame>
        )}

        {active === "creator" && (
          <SectionFrame eyebrow="Quiz Creator" title="JSON import, AI generation, and manual editing all converge into one creator workflow." body="The creator stack is structured around versioned quizzes, moderation, metadata, and flexible ingestion from documents or URLs.">
            <div className="split-grid">
              <div className="glass-panel detail-card">
                <h3>Creation Methods</h3>
                <ul className="plain-list">
                  <li>Manual visual editor with question bank support</li>
                  <li>JSON, CSV, Excel, PDF, and Word import pipeline</li>
                  <li>AI generation from topic, website, transcript, or document</li>
                  <li>Private or public publishing with moderation status</li>
                </ul>
              </div>
              <div className="glass-panel detail-card">
                <h3>Quiz Metadata</h3>
                <p>Title, description, category, language, difficulty, cover image, tags, visibility, version, estimated duration, and community rating are all modeled for persistence.</p>
              </div>
            </div>
          </SectionFrame>
        )}
      </main>
    </div>
  );
}

function SectionFrame({
  eyebrow,
  title,
  body,
  children
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-stack">
      <section className="section-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="body-copy">{body}</p>
        </div>
      </section>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function SettingTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="glass-panel setting-tile">
      <p>{title}</p>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
