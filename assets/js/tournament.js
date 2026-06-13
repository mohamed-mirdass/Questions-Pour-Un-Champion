/* ============================================================
   TOURNAMENT.JS — Quiz Arena Mode Tournoi
   Logique complète : setup → bracket → matchs → palmarès
   ============================================================ */

/* ────────────────────────────────────────────
   STATE
──────────────────────────────────────────── */
const TRN_MATCH_TOTAL_Q = 7;
const TRN_WIN_TARGET = 4;
const TRN_MIN_POOL = 32;

function trnShuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function trnBuildQuestionPool(theme, level) {
  const picked = [];
  const seen = new Set();
  const add = list => {
    list.forEach(q => {
      const key = `${q.theme}|${q.level}|${q.q}`;
      if (!seen.has(key)) {
        picked.push(q);
        seen.add(key);
      }
    });
  };

  if (theme === 'Tous') add(questions.filter(q => q.level === level));
  else add(questions.filter(q => q.theme === theme && q.level === level));
  if (picked.length < TRN_MIN_POOL && theme !== 'Tous') add(questions.filter(q => q.theme === theme));
  if (picked.length < TRN_MIN_POOL) add(questions.filter(q => q.level === level));
  if (picked.length < TRN_MIN_POOL) add(questions);

  return trnShuffle(picked);
}

const TRN = {
  players: [],        // [{name, totalScore, correct, wrong, matchWins}]
  level: null,
  theme: null,
  questions: [],      // pool de questions mélangées

  // Structure du bracket
  // matches: [{id, label, p1idx, p2idx, score1, score2, winner, loser, done}]
  matches: [],
  currentMatchIdx: 0,

  // Match en cours
  match: {
    p1: 0, p2: 1,
    score1: 0, score2: 0,
    questions: [],
    qIdx: 0,
    totalQ: TRN_MATCH_TOTAL_Q,          // meilleur de 7
    activePlayer: null, // 0 = p1, 1 = p2, null = personne
    buzzLocked: false,
    timerInterval: null,
    timeLeft: 0,
    maxTime: 20,
    phase: 'waiting',   // waiting | question | answer | done
  },

  // Résultats tournoi
  standings: [],  // [1er, 2e, 3e, 4e]
};

/* ────────────────────────────────────────────
   INIT / SETUP
──────────────────────────────────────────── */
let trnLevel = null;
let trnTheme = null;

function selectTrnLevel(btn) {
  document.querySelectorAll('#trnLevelGroup .sel-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  trnLevel = btn.dataset.val;
}
function selectTrnTheme(btn) {
  document.querySelectorAll('#trnThemeGroup .sel-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  trnTheme = btn.dataset.val;
}

function startTournament() {
  // Validation
  const names = ['tp1','tp2','tp3','tp4'].map(id => document.getElementById(id).value.trim());
  if (names.some(n => !n)) { toast('Remplis les 4 noms !', 'error'); return; }
  if (!trnLevel) { toast('Choisis un niveau !', 'error'); return; }
  if (!trnTheme) { toast('Choisis un thème !', 'error'); return; }

  // Init players
  TRN.players = names.map(name => ({
    name, totalScore: 0, correct: 0, wrong: 0, matchWins: 0
  }));
  TRN.level = trnLevel;
  TRN.theme = trnTheme;

  TRN.questions = trnBuildQuestionPool(trnTheme, trnLevel);

  // Build matches
  // 0 = SF-A (J1 vs J2), 1 = SF-B (J3 vs J4), 2 = 3rd place, 3 = Finale
  TRN.matches = [
    { id: 0, label: 'Demi-finale A', emoji: '⚔️', p1: 0, p2: 1, score1: 0, score2: 0, winner: null, loser: null, done: false },
    { id: 1, label: 'Demi-finale B', emoji: '⚔️', p1: 2, p2: 3, score1: 0, score2: 0, winner: null, loser: null, done: false },
    { id: 2, label: 'Match 3e place', emoji: '🥉', p1: null, p2: null, score1: 0, score2: 0, winner: null, loser: null, done: false },
    { id: 3, label: 'Finale', emoji: '🏆', p1: null, p2: null, score1: 0, score2: 0, winner: null, loser: null, done: false },
  ];
  TRN.currentMatchIdx = 0;

  // Animate to bracket
  trnShowScreen('trnCountdownScreen');
  trnCountdownToStart(() => {
    buildBracket();
    trnShowScreen('tournamentBracket');
  });
}

/* ────────────────────────────────────────────
   BRACKET BUILD
──────────────────────────────────────────── */
function buildBracket() {
  const m = TRN.matches;
  const p = TRN.players;

  const getPlayerName = (idx) => idx !== null ? p[idx].name : '???';
  const getScore = (match, side) => match.done ? (side === 1 ? match.score1 : match.score2) : '';

  let html = `
    <div class="bracket-col">
      ${renderBracketMatch(m[0], 'Demi-finale A')}
      ${renderBracketMatch(m[2], 'Match 3e place')}
    </div>
    <div class="bracket-center">
      <div class="bracket-connector"></div>
      <div class="bracket-final-badge">🏆 Finale</div>
      <div class="bracket-connector"></div>
    </div>
    <div class="bracket-col">
      ${renderBracketMatch(m[1], 'Demi-finale B')}
      ${renderBracketMatch(m[3], 'Finale')}
    </div>
  `;
  document.getElementById('bracketVisual').innerHTML = html;

  // Update title & button
  const cur = TRN.matches[TRN.currentMatchIdx];
  document.getElementById('bracketTitle').textContent = cur.label;

  const btn = document.getElementById('bracketStartBtn');
  if (cur.done) {
    btn.style.display = 'none';
  } else {
    btn.style.display = '';
    btn.textContent = `▶ ${cur.emoji} ${cur.label}`;
  }
}

function renderBracketMatch(match, label) {
  const p = TRN.players;
  const isCurrent = TRN.matches[TRN.currentMatchIdx] === match && !match.done;
  const activeClass = isCurrent ? 'active-match' : '';
  const doneClass = match.done ? 'completed' : '';

  const p1name = match.p1 !== null ? p[match.p1].name : '<em>À définir</em>';
  const p2name = match.p2 !== null ? p[match.p2].name : '<em>À définir</em>';
  const p1score = match.done ? match.score1 : (match.p1 !== null ? '' : '');
  const p2score = match.done ? match.score2 : (match.p2 !== null ? '' : '');

  const p1cls = match.done ? (match.winner === match.p1 ? 'winner' : 'loser') : (match.p1 === null ? 'tbd' : '');
  const p2cls = match.done ? (match.winner === match.p2 ? 'winner' : 'loser') : (match.p2 === null ? 'tbd' : '');
  const liveDot = isCurrent ? '<span class="trn-live-dot"></span>' : '';

  return `
    <div class="bracket-match ${activeClass} ${doneClass}">
      <div class="bracket-match-label">${liveDot}${label}</div>
      <div class="bracket-player ${p1cls}">
        <span>${p1name}</span>
        <span class="bracket-player-score">${p1score}</span>
      </div>
      <div class="bracket-player ${p2cls}">
        <span>${p2name}</span>
        <span class="bracket-player-score">${p2score}</span>
      </div>
    </div>
  `;
}

/* ────────────────────────────────────────────
   LANCER UN MATCH
──────────────────────────────────────────── */
function launchCurrentMatch() {
  const match = TRN.matches[TRN.currentMatchIdx];

  // Pick questions for this match (7 uniques when possible)
  const used = TRN.matches
    .filter((m, i) => i < TRN.currentMatchIdx)
    .reduce((acc, m) => acc + (m.qPool ? m.qPool.length : 0), 0);
  const slice = TRN.questions.slice(used, used + TRN_MATCH_TOTAL_Q);
  if (slice.length < TRN_MATCH_TOTAL_Q) {
    // Reshuffle and reuse
    trnShuffle(TRN.questions);
  }
  match.qPool = TRN.questions.slice(used % TRN.questions.length, (used % TRN.questions.length) + TRN_MATCH_TOTAL_Q);
  if (match.qPool.length < TRN_MATCH_TOTAL_Q) {
    match.qPool = match.qPool.concat(TRN.questions.slice(0, TRN_MATCH_TOTAL_Q - match.qPool.length));
  }

  // Init match state
  TRN.match = {
    p1: match.p1,
    p2: match.p2,
    score1: 0,
    score2: 0,
    questions: match.qPool,
    qIdx: 0,
    totalQ: TRN_MATCH_TOTAL_Q,
    activePlayer: null,
    buzzLocked: false,
    timerInterval: null,
    timeLeft: 0,
    maxTime: trnGetTime(),
    phase: 'waiting',
  };

  // Update UI
  const p = TRN.players;
  document.getElementById('matchLabel').textContent = match.emoji + ' ' + match.label;
  document.getElementById('matchP1Name').textContent = p[match.p1].name;
  document.getElementById('matchP2Name').textContent = p[match.p2].name;
  document.getElementById('trnBuzzLabel1').textContent = p[match.p1].name;
  document.getElementById('trnBuzzLabel2').textContent = p[match.p2].name;
  document.getElementById('trnKey1').textContent = 'Touche S';
  document.getElementById('trnKey2').textContent = 'Touche K';

  trnRefreshScore();
  trnShowScreen('tournamentMatch');

  // Countdown then first question
  trnMatchCountdown(match.label, () => {
    if (QM) { QM.show(); QM.say(`${match.label} : ${p[match.p1].name} contre ${p[match.p2].name}. Que le meilleur gagne !`, '', true); }
    setTimeout(() => trnLoadQuestion(), 2000);
  });
}

/* ────────────────────────────────────────────
   QUESTION FLOW
──────────────────────────────────────────── */
function trnLoadQuestion() {
  const m = TRN.match;

  if (m.qIdx >= m.totalQ) {
    if (m.score1 === m.score2) {
      trnAddSuddenDeathQuestion();
    } else {
      trnEndMatch();
    }
    return;
  }

  // Early win detection (meilleur de 7 -> 4 wins)
  if (m.score1 >= TRN_WIN_TARGET || m.score2 >= TRN_WIN_TARGET) {
    trnEndMatch();
    return;
  }

  const q = m.questions[m.qIdx];
  m.activePlayer = null;
  m.buzzLocked = false;
  m.phase = 'question';

  // Diff badge
  const badge = document.getElementById('trnDiffBadge');
  badge.textContent = q.level || TRN.level;
  badge.className = 'diff-badge ' + trnDiffClass(q.level || TRN.level);

  // Question text
  document.getElementById('trnQuestionText').textContent = q.q;

  // Q counter
  document.getElementById('trnQCounter').textContent = `Q ${m.qIdx + 1} / ${m.totalQ}`;

  // Answers hidden
  document.getElementById('trnAnswersGrid').innerHTML = '';
  document.getElementById('trnAnswersGrid').style.display = 'none';

  // Show buzzers
  document.getElementById('trnBuzzerArea').style.display = 'flex';
  document.getElementById('trnBuzzer1').disabled = false;
  document.getElementById('trnBuzzer2').disabled = false;
  document.getElementById('trnBuzzer1').classList.remove('buzzed');
  document.getElementById('trnBuzzer2').classList.remove('buzzed');

  // TTS
  if (TTS) TTS.speak(q.q);

  // Start timer
  trnStartTimer();
}

function trnAddSuddenDeathQuestion() {
  const m = TRN.match;
  const next = TRN.questions[(TRN.currentMatchIdx * TRN_MATCH_TOTAL_Q + m.qIdx) % TRN.questions.length];
  m.questions.push(next);
  m.totalQ++;
  toast('Egalite ! Question decisive.', 'info', 1600);
  if (QM) QM.say('Egalite parfaite. Question decisive !', 'buzz-msg', true);
  setTimeout(() => trnLoadQuestion(), 900);
}

function trnStartTimer() {
  const m = TRN.match;
  clearInterval(m.timerInterval);
  m.timeLeft = m.maxTime;
  trnUpdateTimerUI();

  m.timerInterval = setInterval(() => {
    m.timeLeft--;
    trnUpdateTimerUI();
    if (m.timeLeft <= 0) {
      clearInterval(m.timerInterval);
      trnTimeout();
    }
  }, 1000);
}

function trnUpdateTimerUI() {
  const m = TRN.match;
  const pct = (m.timeLeft / m.maxTime * 100);
  const bar = document.getElementById('trnTimerBar');
  const txt = document.getElementById('trnTimerText');
  if (!bar || !txt) return;
  bar.style.width = pct + '%';
  bar.style.background = m.timeLeft <= 5
    ? 'linear-gradient(90deg, var(--danger), #ff8a4c)'
    : 'linear-gradient(90deg, var(--accent), var(--purple))';
  txt.textContent = m.timeLeft + 's';
  txt.className = 'timer-text' + (m.timeLeft <= 5 ? ' urgent' : '');
}

function trnTimeout() {
  const m = TRN.match;
  if (m.phase !== 'question') return;
  m.phase = 'answer';
  toast('⏱ Temps écoulé !', 'error', 1500);
  if (QM) QM.say(rand(QM_TIMEOUT_MSG), 'wrong-msg', false);
  trnRevealAnswer(null);
  setTimeout(() => { m.qIdx++; trnLoadQuestion(); }, 2000);
}

/* ────────────────────────────────────────────
   BUZZ
──────────────────────────────────────────── */
function trnBuzz(side) {
  const m = TRN.match;
  if (m.buzzLocked || m.phase !== 'question') return;

  clearInterval(m.timerInterval);
  m.buzzLocked = true;
  m.activePlayer = side; // 0 = p1, 1 = p2
  m.phase = 'answer';

  const pIdx = side === 0 ? m.p1 : m.p2;
  const name = TRN.players[pIdx].name;

  // Visual buzz
  const buzzBtn = document.getElementById(`trnBuzzer${side + 1}`);
  buzzBtn.classList.add('buzzed');
  buzzBtn.textContent = name;
  document.getElementById(`trnBuzzer${side === 0 ? 2 : 1}`).disabled = true;

  toast(`🔔 ${name} a buzzé !`, 'info', 1200);
  if (QM) QM.say(rand(QM_BUZZ_MSGS(name)), 'buzz-msg', true);

  // Show answers
  trnShowAnswers();
}

function trnShowAnswers() {
  const m = TRN.match;
  const q = m.questions[m.qIdx];

  let shuffled = [...q.a];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const letters = ['A', 'B', 'C', 'D'];
  document.getElementById('trnAnswersGrid').innerHTML = shuffled.map((a, i) =>
    `<button class="ans-btn" onclick="trnAnswer(this, '${a.replace(/'/g, "\\'")}')">
      <span class="ans-letter">${letters[i]}</span>${a}
    </button>`
  ).join('');
  document.getElementById('trnAnswersGrid').style.display = 'grid';
  document.getElementById('trnBuzzerArea').style.display = 'none';

  // Short timer to answer (10s)
  m.maxTime = 10;
  m.timeLeft = 10;
  trnUpdateTimerUI();
  m.timerInterval = setInterval(() => {
    m.timeLeft--;
    trnUpdateTimerUI();
    if (m.timeLeft <= 0) {
      clearInterval(m.timerInterval);
      trnAnswerWrong();
    }
  }, 1000);
}

function trnAnswer(btn, val) {
  const m = TRN.match;
  if (m.phase !== 'answer') return;
  clearInterval(m.timerInterval);

  const q = m.questions[m.qIdx];
  const btns = document.querySelectorAll('#trnAnswersGrid .ans-btn');
  btns.forEach(b => b.disabled = true);

  const side = m.activePlayer; // 0 or 1
  const pIdx = side === 0 ? m.p1 : m.p2;
  const name = TRN.players[pIdx].name;

  if (val === q.correct) {
    btn.classList.add('correct');
    if (side === 0) { m.score1++; } else { m.score2++; }
    TRN.players[pIdx].correct++;
    TRN.players[pIdx].totalScore++;
    trnRefreshScore();
    toast(`✅ ${name} marque !`, 'success', 1500);
    if (QM) QM.say(rand(QM_CORRECT(name)), 'correct-msg', true);
  } else {
    btn.classList.add('wrong');
    btns.forEach(b => { if (b.textContent.trim().endsWith(q.correct) || b.textContent.includes(q.correct)) b.classList.add('correct'); });
    TRN.players[pIdx].wrong++;
    toast(`❌ ${name} — mauvaise réponse !`, 'error', 1500);
    if (QM) QM.say(rand(QM_WRONG(name)), 'wrong-msg', true);
  }

  m.phase = 'done';
  setTimeout(() => { m.qIdx++; trnLoadQuestion(); }, 1800);
}

function trnAnswerWrong() {
  const m = TRN.match;
  if (m.phase !== 'answer') return;
  m.phase = 'done';

  const side = m.activePlayer;
  const pIdx = side === 0 ? m.p1 : m.p2;
  const name = TRN.players[pIdx].name;
  TRN.players[pIdx].wrong++;

  const btns = document.querySelectorAll('#trnAnswersGrid .ans-btn');
  btns.forEach(b => {
    b.disabled = true;
    const q = m.questions[m.qIdx];
    if (b.textContent.includes(q.correct)) b.classList.add('correct');
  });

  toast(`⏱ ${name} n'a pas répondu à temps !`, 'error', 1800);
  if (QM) QM.say(rand(QM_WRONG(name)), 'wrong-msg', false);
  setTimeout(() => { m.qIdx++; trnLoadQuestion(); }, 2000);
}

function trnRevealAnswer(correctVal) {
  const q = TRN.match.questions[TRN.match.qIdx];
  const btns = document.querySelectorAll('#trnAnswersGrid .ans-btn');
  btns.forEach(b => {
    b.disabled = true;
    if (b.textContent.includes(q.correct)) b.classList.add('correct');
  });
}

/* ────────────────────────────────────────────
   FIN DU MATCH
──────────────────────────────────────────── */
function trnEndMatch() {
  clearInterval(TRN.match.timerInterval);
  const m = TRN.match;
  const match = TRN.matches[TRN.currentMatchIdx];
  const p = TRN.players;

  // Determine winner
  let winnerSide, loserSide;
  if (m.score1 > m.score2) {
    winnerSide = 0; loserSide = 1;
  } else if (m.score2 > m.score1) {
    winnerSide = 1; loserSide = 0;
  } else {
    // Égalité: sudden death — win goes to whoever answered last correctly (fallback: p1 wins)
    winnerSide = 0; loserSide = 1;
  }

  const winnerIdx = winnerSide === 0 ? m.p1 : m.p2;
  const loserIdx  = winnerSide === 0 ? m.p2 : m.p1;
  const winnerScore = winnerSide === 0 ? m.score1 : m.score2;
  const loserScore  = winnerSide === 0 ? m.score2 : m.score1;

  // Update match record
  match.score1 = m.score1;
  match.score2 = m.score2;
  match.winner = winnerIdx;
  match.loser  = loserIdx;
  match.done   = true;

  // Track match wins
  TRN.players[winnerIdx].matchWins = (TRN.players[winnerIdx].matchWins || 0) + 1;

  // Propagate to next matches
  if (TRN.currentMatchIdx === 0) {
    // SF-A: winner → Finale (match 3), loser → 3rd place (match 2)
    TRN.matches[3].p1 = winnerIdx;
    TRN.matches[2].p1 = loserIdx;
  } else if (TRN.currentMatchIdx === 1) {
    // SF-B: winner → Finale (match 3), loser → 3rd place (match 2)
    TRN.matches[3].p2 = winnerIdx;
    TRN.matches[2].p2 = loserIdx;
  }

  // Show result screen
  trnShowMatchResult(match, winnerIdx, loserIdx, winnerScore, loserScore);
}

function trnShowMatchResult(match, winnerIdx, loserIdx, ws, ls) {
  const p = TRN.players;
  const isFinal = match.id === 3;
  const is3rd   = match.id === 2;

  const trophyEl = document.getElementById('resultTrophy');
  const titleEl  = document.getElementById('resultTitle');
  const winnerEl = document.getElementById('resultWinner');
  const detailEl = document.getElementById('resultDetail');

  if (isFinal) {
    trophyEl.textContent = '🏆';
    titleEl.textContent  = 'Champion !';
    detailEl.textContent = 'remporte la finale du tournoi !';
  } else if (is3rd) {
    trophyEl.textContent = '🥉';
    titleEl.textContent  = '3e place !';
    detailEl.textContent = 'termine 3e du tournoi';
  } else {
    trophyEl.textContent = '⚔️';
    titleEl.textContent  = 'Victoire !';
    detailEl.textContent = `remporte la ${match.label}`;
  }

  winnerEl.textContent = p[winnerIdx].name;

  // Scores detail
  const scoresHtml = `
    <div class="trn-result-player winner-card">
      <div class="trn-result-pname">🏆 ${p[winnerIdx].name}</div>
      <div class="trn-result-pscore">${ws}</div>
      <div class="trn-result-pdetail">victoire — ${p[winnerIdx].correct} bonnes rép.</div>
    </div>
    <div class="trn-result-player loser-card">
      <div class="trn-result-pname">${p[loserIdx].name}</div>
      <div class="trn-result-pscore">${ls}</div>
      <div class="trn-result-pdetail">élimination — ${p[loserIdx].correct} bonnes rép.</div>
    </div>
  `;
  document.getElementById('resultScores').innerHTML = scoresHtml;

  const nextBtn = document.getElementById('resultNextBtn');
  if (isFinal) {
    nextBtn.textContent = '🏆 Voir le palmarès';
  } else {
    const nextMatch = TRN.matches[TRN.currentMatchIdx + 1];
    nextBtn.textContent = nextMatch ? `Continuer → ${nextMatch.emoji} ${nextMatch.label}` : 'Terminer le tournoi';
  }

  trnShowScreen('tournamentMatchResult');
}

/* ────────────────────────────────────────────
   NAVIGATION ENTRE MATCHS
──────────────────────────────────────────── */
function nextMatchOrFinal() {
  const cur = TRN.matches[TRN.currentMatchIdx];
  const isFinal = cur.id === 3;

  if (isFinal) {
    trnShowFinalStandings();
    return;
  }

  TRN.currentMatchIdx++;
  buildBracket();
  trnShowScreen('tournamentBracket');
}

/* ────────────────────────────────────────────
   PALMARÈS FINAL
──────────────────────────────────────────── */
function trnShowFinalStandings() {
  const matches = TRN.matches;
  const p = TRN.players;

  // Determine positions
  const finalMatch   = matches[3];
  const thirdMatch   = matches[2];

  const rank1 = finalMatch.winner;
  const rank2 = finalMatch.loser;
  const rank3 = thirdMatch.winner;
  const rank4 = thirdMatch.loser;

  const standings = [rank1, rank2, rank3, rank4];
  TRN.standings = standings;

  // Save to history
  addHistory({
    winner: p[rank1].name,
    score: p[rank1].correct,
    theme: TRN.theme,
    level: TRN.level,
    date: Date.now(),
    mode: 'tournoi'
  });

  // Podium
  const medals = ['🥇', '🥈', '🥉', '4️⃣'];
  const labels = ['Champion', '2e place', '3e place', '4e place'];

  document.getElementById('trnPodium').innerHTML = standings.map((idx, rank) => {
    if (idx === null) return '';
    const player = p[idx];
    return `
      <div class="trn-pod-card">
        <div class="trn-pod-medal">${medals[rank]}</div>
        <div class="trn-pod-name">${player.name}</div>
        <div class="trn-pod-score">${player.correct}</div>
        <div class="trn-pod-wins">${labels[rank]}</div>
      </div>
    `;
  }).join('');

  // Full stats table
  const badgeClass = ['badge-gold', 'badge-silver', 'badge-bronze', 'badge-4th'];
  document.getElementById('trnFullStats').innerHTML = `
    <div class="trn-stats-title">Statistiques détaillées</div>
    <table class="trn-stats-table card">
      <thead>
        <tr>
          <th>#</th>
          <th>Joueur</th>
          <th>Victoires matchs</th>
          <th>Bonnes rép.</th>
          <th>Mauvaises rép.</th>
          <th>Taux réussite</th>
        </tr>
      </thead>
      <tbody>
        ${standings.map((idx, rank) => {
          if (idx === null) return '';
          const pl = p[idx];
          const total = pl.correct + pl.wrong;
          const rate = total > 0 ? Math.round(pl.correct / total * 100) : 0;
          return `
            <tr>
              <td><span class="trn-stats-badge ${badgeClass[rank]}">${medals[rank]}</span></td>
              <td>${pl.name}</td>
              <td>${pl.matchWins || 0}</td>
              <td style="color:var(--success)">${pl.correct}</td>
              <td style="color:var(--danger)">${pl.wrong}</td>
              <td style="color:var(--accent)">${rate}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  // QM champion message
  if (QM && rank1 !== null) {
    setTimeout(() => {
      QM.show();
      QM.say(`Félicitations à ${p[rank1].name}, champion du tournoi Quiz Arena !`, 'correct-msg', true);
    }, 500);
  }

  trnShowScreen('tournamentFinal');
}

/* ────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────── */
function trnRefreshScore() {
  const m = TRN.match;
  const s1 = document.getElementById('matchS1');
  const s2 = document.getElementById('matchS2');
  if (!s1) return;
  s1.textContent = m.score1;
  s2.textContent = m.score2;
  document.getElementById('matchProgress').textContent = `Meilleur de 7 - ${m.score1 + m.score2} / ${m.totalQ}`;
}

function trnGetTime() {
  if (TRN.level === 'Professionnel') return 12;
  if (TRN.level === 'Intermédiaire') return 18;
  return 25;
}

function trnDiffClass(level) {
  if (!level) return 'diff-easy';
  const l = level.toLowerCase();
  if (l.includes('déb') || l.includes('deb')) return 'diff-easy';
  if (l.includes('inter')) return 'diff-medium';
  return 'diff-hard';
}

function trnShowScreen(id) {
  // Hide all tournament screens
  ['tournamentSetup','tournamentBracket','tournamentMatch','tournamentMatchResult','tournamentFinal','trnCountdownScreen'].forEach(sid => {
    const el = document.getElementById(sid);
    if (el) el.classList.remove('active');
  });
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

function trnCountdownToStart(cb) {
  let count = 3;
  const numEl = document.getElementById('trnCdNum');
  const labelEl = document.getElementById('trnCdLabel');
  if (labelEl) labelEl.textContent = 'Le tournoi commence';
  if (numEl) numEl.textContent = count;

  const iv = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(iv);
      cb();
      return;
    }
    if (numEl) {
      numEl.style.animation = 'none';
      numEl.offsetHeight;
      numEl.style.animation = 'pop .8s ease';
      numEl.textContent = count;
    }
  }, 900);
}

function trnMatchCountdown(label, cb) {
  const overlay = document.getElementById('trnCountdownOverlay');
  const numEl   = document.getElementById('trnCountdownNum');
  const labelEl = document.getElementById('trnCountdownLabel');

  if (!overlay) { cb(); return; }

  labelEl.textContent = label + ' — à vos buzzers !';
  overlay.style.display = 'flex';
  let count = 3;
  numEl.textContent = count;

  const iv = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(iv);
      overlay.style.display = 'none';
      cb();
      return;
    }
    numEl.style.animation = 'none';
    numEl.offsetHeight;
    numEl.style.animation = 'pop .8s ease';
    numEl.textContent = count;
  }, 900);
}

function restartTournament() {
  // Reset
  TRN.players = [];
  TRN.matches = [];
  TRN.currentMatchIdx = 0;
  if (QM) QM.hide();
  trnShowScreen('tournamentSetup');
}

/* ────────────────────────────────────────────
   KEYBOARD BINDINGS
──────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('tournamentMatch').classList.contains('active')) return;
  const m = TRN.match;
  if (m.phase !== 'question' || m.buzzLocked) return;

  if (e.key.toLowerCase() === 's') { e.preventDefault(); trnBuzz(0); }
  if (e.key.toLowerCase() === 'k') { e.preventDefault(); trnBuzz(1); }
});

/* ────────────────────────────────────────────
   PARTICLES (reuse from app.js style)
──────────────────────────────────────────── */
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const colors = ['#40e0d0','#ff4d8d','#ffd166','#7c5cff','#4ade80'];
  for (let i = 0; i < 18; i++) {
    const span = document.createElement('span');
    span.style.cssText = `
      left:${Math.random()*100}%;
      width:${4 + Math.random()*6}px;
      height:${4 + Math.random()*6}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${8 + Math.random()*14}s;
      animation-delay:${Math.random()*8}s;
    `;
    container.appendChild(span);
  }
})();
