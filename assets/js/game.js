/* ============================================================
   GAME.JS — Logique métier : déroulement de partie, buzzer, réponses,
   manches (paris/rapidité), joker, mission, mini-jeu, tournois locaux,
   recommandations, sauvegarde/reprise.
   ============================================================ */

function clearQuestionReadTimeout() {
  if (questionReadTimeout) {
    clearTimeout(questionReadTimeout);
    questionReadTimeout = null;
  }
}

function getAdaptiveTime() {
  // Based on global performance
  const total = totalCorrect + totalWrong;
  if (total < 3) return 30;
  const rate = totalCorrect / total;
  if (rate > 0.75) return 12; // hard: 12s
  if (rate > 0.50) return 20; // medium: 20s
  return 30; // easy: 30s
}
function getDifficultyLabel() {
  const total = totalCorrect + totalWrong;
  if (total < 3) return {label:'DÉBUTANT', cls:'diff-easy', dots:[1,0,0]};
  const rate = totalCorrect / total;
  if (rate > 0.75) return {label:'DIFFICILE', cls:'diff-hard', dots:[1,1,1]};
  if (rate > 0.50) return {label:'MOYEN', cls:'diff-medium', dots:[1,1,0]};
  return {label:'DÉBUTANT', cls:'diff-easy', dots:[1,0,0]};
}
function useJoker(cost) {
  if (activePlayer === null) return;
  const coins = getCoins();
  if (coins < cost) { toast('Pas assez de coins !','error'); return; }
  if (!spendCoins(cost)) { toast('Erreur coins','error'); return; }
  jokerUsed[cost] = true;
  const btns = document.querySelectorAll('.ans-btn');
  const q = gameQuestions[qIndex];

  if (cost === 50) {
    // Eliminate 1 wrong
    let eliminated = 0;
    btns.forEach(btn => {
      if (!btn.disabled && btn.dataset.val !== q.correct && !btn.classList.contains('eliminated') && eliminated < 1) {
        btn.classList.add('eliminated');
        btn.disabled = true;
        eliminated++;
      }
    });
    toast('✂️ 1 mauvaise réponse éliminée !','coins');
    QM.say(QM_JOKER_50(players[activePlayer].name), 'buzz-msg', true);
  } else if (cost === 70) {
    // Eliminate 2 wrong
    let eliminated = 0;
    btns.forEach(btn => {
      if (!btn.disabled && btn.dataset.val !== q.correct && !btn.classList.contains('eliminated') && eliminated < 2) {
        btn.classList.add('eliminated');
        btn.disabled = true;
        eliminated++;
      }
    });
    toast('✂️ 2 mauvaises réponses éliminées !','coins');
    QM.say(QM_JOKER_70(players[activePlayer].name), 'buzz-msg', true);
  } else if (cost === 100) {
    // Reveal correct
    btns.forEach(btn => {
      if (btn.dataset.val === q.correct) {
        btn.style.boxShadow = '0 0 30px rgba(0,245,212,0.8)';
        btn.style.borderColor = 'var(--accent)';
      }
    });
    toast('💡 Bonne réponse révélée !','coins');
    QM.say(QM_JOKER_100(players[activePlayer].name), 'buzz-msg', true);
  }
  updateJokerButtons();
  refreshScoreboard();
}

/* ============================================================
   GAME FLOW
   ============================================================ */
/* ============================================================
   GAME MODE SELECTOR
   ============================================================ */
function selectGameMode(btn) {
  document.querySelectorAll('#gameModeGroup .sel-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedGameMode = btn.dataset.val;
}

function fillDemoLobby() {
  const demoPlayers = ['Amina', 'Yassine', 'Nora', 'Ilyas'];
  ['p1in','p2in','p3in','p4in'].forEach((id, index) => {
    const input = document.getElementById(id);
    if (input) input.value = demoPlayers[index];
  });

  const defaultLevel = document.querySelector('#levelGroup .sel-btn[data-val="Débutant"]');
  const defaultTheme = document.querySelector('#themeGroup .sel-btn[data-val="Sport"]');
  if (defaultLevel) defaultLevel.click();
  if (defaultTheme) defaultTheme.click();

  const normalMode = document.querySelector('#gameModeGroup .sel-btn[data-val="normal"]');
  if (normalMode) selectGameMode(normalMode);
  toast('Lobby prêt pour une démo.', 'info', 1400);
}

/* ============================================================
   FETCH QUESTIONS (avec fallback)
   ============================================================ */
async function loadQuestionsFromJSON() {
  try {
    const res = await fetch('data/questions.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      // Merge with existing questions (deduplicate by q)
      const existing = new Set(questions.map(q => q.q));
      const newOnes = data.filter(q => !existing.has(q.q));
      questions.push(...newOnes);
      document.getElementById('fetchStatus').innerHTML =
        '<div class="fetch-status"><div class="fetch-dot ok"></div><span>OK  JSON externe chargé (' + data.length + ' questions)</span></div>';
      return true;
    }
  } catch(e) {
    // Fallback silencieux sur questions intégrées
  }
  return false;
}

/* ============================================================
   START GAME (amélioré)
   ============================================================ */
function startGame() {
  const pNames = ['p1in','p2in','p3in','p4in'].map(id => document.getElementById(id).value.trim());
  if (pNames.some(n => !n)) { toast('Remplis tous les noms !','error'); return; }
  if (!selectedLevel) { toast('Choisis un niveau !','error'); return; }
  if (!selectedTheme) { toast('Choisis un thème !','error'); return; }

  players = pNames.map(name => ({name, score:0, correct:0, wrong:0}));
  adaptiveStreak = [0,0,0,0];
  totalCorrect = 0; totalWrong = 0;
  playerBets = [0,0,0,0];
  roundNumber = 0;

  gameQuestions = buildLongQuestionPool(selectedTheme, selectedLevel);
  if (!gameQuestions.length) {
    toast('Aucune question disponible pour ce thème/niveau. Réessayez.', 'error', 2500);
    return;
  }
  qIndex = 0;
  gameActive = true;

  buildScoreboard();
  showScreen('countdownScreen');
  QM.hide();
  startCountdown(() => {
    showScreen('gameScreen');
    QM.show();
    QM.say(rand(QM_START_MSG), '', true);
    setTimeout(() => loadQuestion(), 2600);
  });
}

function startCountdown(cb) {
  let count = 3;
  const el = document.getElementById('countdownNum');
  el.textContent = count;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'pop 0.8s ease';
  const iv = setInterval(() => {
    count--;
    if (count > 0) {
      el.textContent = count;
      el.style.animation = 'none';
      el.offsetHeight;
      el.style.animation = 'pop 0.8s ease';
    } else {
      el.textContent = 'GO!';
      el.style.color = 'var(--success)';
      clearInterval(iv);
      setTimeout(() => { el.style.color = 'var(--accent)'; cb(); }, 800);
    }
  }, 1000);
}

/* ============================================================
   ROUND TYPE DETECTION (mode mixte)
   ============================================================ */
function getNextRoundType() {
  roundNumber++;
  if (selectedGameMode === 'normal') return 'normal';
  if (selectedGameMode === 'bet') return 'bet';
  if (selectedGameMode === 'speed') return 'speed';
  // Mode mixte: alterne normal -> paris -> normal -> rapidité -> ...
  const cycle = ['normal','bet','normal','speed'];
  return cycle[(roundNumber - 1) % cycle.length];
}

function showRoundIndicator(type, cb) {
  const ind = document.getElementById('roundIndicator');
  const labels = {
    normal: {icon:'🎯', text:'MANCHE NORMALE', color:'var(--purple)'},
    bet:    {icon:'Paris ', text:'MANCHE PARIS', color:'var(--accent3)'},
    speed:  {icon:'Rapide ', text:'MANCHE RAPIDITÉ', color:'var(--accent)'}
  };
  const l = labels[type] || labels.normal;
  ind.innerHTML = `<div style="color:${l.color};font-size:20px;margin-bottom:8px;">${l.icon} ${l.text}</div><div style="font-size:14px;opacity:0.7;">Préparez-vous !</div>`;
  ind.classList.add('active');
  setTimeout(() => {
    ind.classList.remove('active');
    ind.style.display = 'none';
    setTimeout(cb, 200);
  }, 1800);
}

function loadQuestion() {
  clearInterval(timerInterval);
  clearQuestionReadTimeout();
  activePlayer = null;
  jokerUsed = {50:false, 70:false, 100:false};
  clearHighlight();

  if (qIndex >= gameQuestions.length) {
    showResults();
    return;
  }

  // Determine round type
  roundType = getNextRoundType();

  // Route to appropriate round
  if (roundType === 'bet') {
    showRoundIndicator('bet', () => startBetRound());
    return;
  }
  if (roundType === 'speed') {
    showRoundIndicator('speed', () => startSpeedRound());
    return;
  }

  // Normal round
  showScreen('gameScreen');
  const q = gameQuestions[qIndex];
  document.getElementById('qCounter').textContent = `Q ${qIndex+1} / ${gameQuestions.length}`;
  document.getElementById('questionText').textContent = q.q;

  // Mode badge
  const badge = document.getElementById('diffBadge');
  // Build answers
  const grid = document.getElementById('answersGrid');
  const letters = ['A','B','C','D'];
  let shuffled = [...q.a];
  for (let i = shuffled.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
  }
  grid.innerHTML = shuffled.map((ans,i) => `
    <button class="ans-btn" data-val="${ans}" disabled onclick="answerClick(this)">
      <span class="ans-letter">${letters[i]}</span>${ans}
    </button>
  `).join('');

  // Reset buzzer (per-player tap buttons, works on desktop click + mobile touch + keyboard)
  buildNormalBuzzers();

  document.getElementById('buzzerHint').textContent = 'Appuie sur S / D / K / L';
  document.getElementById('jokerBar').style.display = 'none';

  updateDiffUI();
  updateJokerButtons();

  // QM reads the question first; timer starts only after speech ends
  maxTime = getAdaptiveTime();
  questionReadTimeout = setTimeout(() => {
    questionReadTimeout = null;
    if (activePlayer === null && currentScreen === 'gameScreen') {
      QM.readQuestion(q.q, () => {
        // Start timer only after TTS finishes reading the question
        if (activePlayer === null && currentScreen === 'gameScreen') startTimer();
      });
    } else {
      startTimer();
    }
  }, 900);
}

function startTimer() {
  timeLeft = maxTime;
  updateTimerUI();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerTimeout();
    }
  }, 1000);
}

function timerTimeout() {
  clearQuestionReadTimeout();
  SFX.wrong();
  // No one buzzed or no answer
  toast('Temps  Temps écoulé !','error',1500);
  QM.say(rand(QM_TIMEOUT_MSG), 'time-msg', true);
  totalWrong++;
  document.querySelectorAll('.ans-btn').forEach(b => b.disabled = true);
  // Show correct
  document.querySelectorAll('.ans-btn').forEach(b => {
    if (b.dataset.val === gameQuestions[qIndex].correct) b.classList.add('correct');
  });
  setTimeout(() => { qIndex++; loadQuestion(); }, 2500);
}

/* Buzzer via keyboard */
document.addEventListener('keydown', e => {
  const map = {s:0, d:1, k:2, l:3};
  const key = e.key.toLowerCase();
  if (map[key] === undefined) return;

  // Speed round buzzer
  if (currentScreen === 'speedScreen' && speedBuzzed === null) {
    speedBuzz(map[key]);
    return;
  }

  // Normal game buzzer
  if (currentScreen !== 'gameScreen') return;
  if (activePlayer !== null) return;
  buzz(map[key]);
});

/* Per-player buzz buttons — same pattern as the speed round (colors p1..p4),
   so every player can buzz by tapping their own button (desktop click, mobile touch)
   in addition to the S/D/K/L keyboard shortcuts. */
function buzz(pIdx) {
  if (activePlayer !== null) return; // already answered by someone this question
  SFX.buzz();
  clearQuestionReadTimeout();
  clearInterval(timerInterval);
  activePlayer = pIdx;
  highlightPlayer(pIdx);

  document.querySelectorAll('#buzzerArea .buzzer').forEach((b, i) => {
    b.disabled = true;
    b.classList.toggle('buzzed', i === pIdx);
  });
  document.getElementById('buzzerHint').textContent = players[pIdx].name + ' répond !';

  // Enable answer buttons
  document.querySelectorAll('.ans-btn').forEach(b => {
    if (!b.classList.contains('eliminated')) b.disabled = false;
  });

  // Show joker bar
  document.getElementById('jokerBar').style.display = 'flex';
  updateJokerButtons();

  toast(`Buzz  ${players[pIdx].name} a buzzé !`, 'info', 1200);
  QM.say(rand(QM_BUZZ_MSGS(players[pIdx].name)), 'buzz-msg', true);
}

/* ============================================================
   MANCHE PARIS
   ============================================================ */
function startBetRound() {
  const q = gameQuestions[qIndex];
  playerBets = [0,0,0,0];
  betTimeLeft = 15;

  // Build bet UI
  const betPlayersDiv = document.getElementById('betPlayers');
  betPlayersDiv.innerHTML = players.map((p,i) => `
    <div class="bet-player-row">
      <div>
        <div class="bet-player-name">${p.name}</div>
        <div class="bet-player-score">Score: ${p.score} pts</div>
      </div>
      <input class="bet-input" type="number" id="bet${i}" 
        min="0" max="${Math.max(0, p.score)}" value="0" 
        placeholder="0"
        onchange="playerBets[${i}]=Math.min(Math.max(0,parseInt(this.value)||0),${Math.max(0,p.score)})">
    </div>
  `).join('');

  showScreen('betScreen');
  QM.say('Paris  Placez vos paris ! La question arrive dans 15 secondes.', 'buzz-msg', true);

  // Countdown
  updateBetTimer();
  betTimerInterval = setInterval(() => {
    betTimeLeft--;
    updateBetTimer();
    if (betTimeLeft <= 0) {
      clearInterval(betTimerInterval);
      confirmBets();
    }
  }, 1000);
}

function updateBetTimer() {
  const el = document.getElementById('betTimer');
  if (el) {
    el.textContent = betTimeLeft;
    el.style.color = betTimeLeft <= 5 ? 'var(--danger)' : 'var(--accent3)';
  }
}

function confirmBets() {
  clearInterval(betTimerInterval);
  // Read final values
  players.forEach((p,i) => {
    const inp = document.getElementById('bet'+i);
    if (inp) playerBets[i] = Math.min(Math.max(0, parseInt(inp.value)||0), Math.max(0,p.score));
  });

  // Show the question in game screen like normal, but with bet badge
  showScreen('gameScreen');
  const q = gameQuestions[qIndex];
  document.getElementById('qCounter').textContent = `Q ${qIndex+1} / ${gameQuestions.length}`;
  document.getElementById('questionText').textContent = q.q;

  // Update scoreboard to show bets
  buildScoreboardWithBets();

  const grid = document.getElementById('answersGrid');
  const letters = ['A','B','C','D'];
  let shuffled = [...q.a];
  for (let i = shuffled.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
  }
  grid.innerHTML = shuffled.map((ans,i) => `
    <button class="ans-btn" data-val="${ans}" disabled onclick="answerClick(this)">
      <span class="ans-letter">${letters[i]}</span>${ans}
    </button>
  `).join('');

  buildNormalBuzzers();
  document.getElementById('buzzerHint').textContent = 'Appuie sur S / D / K / L';
  document.getElementById('jokerBar').style.display = 'none';

  updateDiffUI();
  updateJokerButtons();
  maxTime = getAdaptiveTime();
  setTimeout(() => {
    QM.readQuestion(q.q, () => {
      if (activePlayer === null) startTimer();
    });
  }, 900);
}

function startSpeedRound() {
  const q = gameQuestions[qIndex];
  speedBuzzed = null;
  speedBuzzTimestamp = [null,null,null,null];

  document.getElementById('speedQuestion').textContent = q.q;
  document.getElementById('speedAnswerReveal').style.display = 'none';
  document.getElementById('speedHint').textContent = 'Appuie sur S / D / K / L pour buzzer !';

  // Build player buzzers
  const colors = ['p1','p2','p3','p4'];
  const keys = ['S','D','K','L'];
  document.getElementById('speedBuzzers').innerHTML = players.map((p,i) => `
    <button class="speed-buzzer ${colors[i]}" id="speedBuzz${i}" onclick="speedBuzz(${i})">
      <div>[${keys[i]}]</div>
      <div>${p.name}</div>
    </button>
  `).join('');

  // Build answers (hidden until buzz)
  const letters = ['A','B','C','D'];
  let shuffled = [...q.a];
  for (let i = shuffled.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
  }
  document.getElementById('speedAnswerGrid').innerHTML = shuffled.map((ans,i) => `
    <button class="ans-btn" data-val="${ans}" style="display:none;" onclick="speedAnswer(this)">
      <span class="ans-letter">${letters[i]}</span>${ans}
    </button>
  `).join('');
  document.getElementById('speedAnswerGrid').style.display = 'none';

  showScreen('speedScreen');
  QM.show();
  QM.readQuestion(q.q);
}

function speedBuzz(pIdx) {
  if (speedBuzzed !== null) return; // déjà buzzé
  const now = performance.now();
  speedBuzzed = pIdx;
  speedBuzzTimestamp[pIdx] = now;

  // Disable all buzzers
  document.querySelectorAll('.speed-buzzer').forEach(b => b.disabled = true);
  document.getElementById('speedHint').textContent = `${players[pIdx].name} répond !`;

  // Reveal answers
  document.getElementById('speedAnswerGrid').style.display = 'grid';
  document.querySelectorAll('#speedAnswerGrid .ans-btn').forEach(b => {
    b.style.display = 'flex';
  });

  toast(`Rapide  ${players[pIdx].name} a buzzé en premier !`, 'info', 1200);
  QM.say(rand(QM_BUZZ_MSGS(players[pIdx].name)), 'buzz-msg', true);
  highlightPlayer(pIdx);
}

function speedAnswer(btn) {
  if (speedBuzzed === null) return;
  const q = gameQuestions[qIndex];
  const pIdx = speedBuzzed;
  const isCorrect = btn.dataset.val === q.correct;

  document.querySelectorAll('#speedAnswerGrid .ans-btn').forEach(b => b.disabled = true);

  if (isCorrect) {
    SFX.correct();
    btn.classList.add('correct');
    const pts = 2; // 2 pts en manche rapidité
    players[pIdx].score += pts;
    players[pIdx].correct++;
    totalCorrect++;
    adaptiveStreak[pIdx]++;
    const coinEarn = 15 + (adaptiveStreak[pIdx] > 1 ? (adaptiveStreak[pIdx]-1)*5 : 0);
    addCoins(coinEarn);
    showBonus(`+${pts} pts Rapide `, null, 300, '#00f5d4');
    toast(`OK  ${players[pIdx].name} +${pts} pts ! +${coinEarn}coins`, 'success', 2000);
    QM.say(rand(QM_CORRECT(players[pIdx].name)), 'correct-msg', true);
    document.getElementById('speedAnswerReveal').style.display = 'block';
    document.getElementById('speedAnswerReveal').textContent = `OK  Correct ! ${q.correct}`;
  } else {
    SFX.wrong();
    btn.classList.add('wrong');
    document.querySelectorAll('#speedAnswerGrid .ans-btn').forEach(b => {
      if (b.dataset.val === q.correct) b.classList.add('correct');
    });
    // Malus en manche rapidité
    const malus = 1;
    players[pIdx].score = Math.max(0, players[pIdx].score - malus);
    players[pIdx].wrong++;
    totalWrong++;
    adaptiveStreak[pIdx] = 0;
    showMalus(`-${malus} pt`);
    toast(`Non  ${players[pIdx].name} -${malus} pt (malus buzz rapide)`, 'error', 2000);
    QM.say(rand(QM_WRONG(players[pIdx].name)), 'wrong-msg', true);
    document.getElementById('speedAnswerReveal').style.display = 'block';
    document.getElementById('speedAnswerReveal').textContent = `Non  Réponse : ${q.correct}`;
    document.getElementById('speedAnswerReveal').style.borderColor = 'var(--danger)';
    document.getElementById('speedAnswerReveal').style.color = 'var(--danger)';
  }

  refreshScoreboard();
  clearHighlight();
  setTimeout(() => {
    showScreen('gameScreen');
    buildScoreboard();
    qIndex++;
    loadQuestion();
  }, 2500);
}

/* ============================================================
   MALUS DISPLAY
   ============================================================ */
function answerClick(btn) {
  if (activePlayer === null) return;
  clearInterval(timerInterval);

  const q = gameQuestions[qIndex];
  const isCorrect = btn.dataset.val === q.correct;
  const timeTaken = maxTime - timeLeft;
  const pIdx = activePlayer;
  const hasBet = roundType === 'bet' && playerBets[pIdx] > 0;

  document.querySelectorAll('.ans-btn').forEach(b => b.disabled = true);
  document.getElementById('jokerBar').style.display = 'none';

  if (isCorrect) {
    SFX.correct();
    btn.classList.add('correct');
    // Score: base + speed bonus
    const speedBonus = Math.max(0, Math.floor((maxTime - timeTaken) / maxTime * 3));
    let points = 1 + speedBonus;

    // Paris: gagner le double du pari
    if (hasBet) {
      points += playerBets[pIdx];
      showBonus(`+${points} pts Paris WIN!`, null, 300, '#f4d35e');
      toast(`OK  +${points} pts (pari gagné Paris )`, 'success', 2000);
    } else if (speedBonus > 0) {
      showBonus(`+${points} pts Rapide RAPIDE!`, null, 300, '#f4d35e');
      toast(`OK  +${points} pts (bonus rapidité Rapide )`, 'success', 1800);
    } else {
      showBonus(`+1 pt`, null, 300, '#2ed573');
      toast(`OK  Bonne réponse !`, 'success', 1800);
    }

    players[pIdx].score += points;
    players[pIdx].correct++;
    totalCorrect++;
    adaptiveStreak[pIdx]++;

    const coinEarn = 10 + (adaptiveStreak[pIdx] > 1 ? (adaptiveStreak[pIdx]-1)*5 : 0);
    addCoins(coinEarn);
    QM.say(rand(QM_CORRECT(players[pIdx].name)), 'correct-msg', true);
  } else {
    SFX.wrong();
    btn.classList.add('wrong');
    document.querySelectorAll('.ans-btn').forEach(b => {
      if (b.dataset.val === q.correct) b.classList.add('correct');
    });

    // Malus: -1 pt (mais pas en dessous de 0)
    const malus = WRONG_PENALTY;
    let penalty = malus;

    // Paris: perdre le pari
    if (hasBet) {
      penalty = playerBets[pIdx];
      toast(`Non  Pari perdu ! -${penalty} pts Perdu `, 'error', 2000);
    } else {
      toast(`Non  Mauvaise réponse ! -${malus} pt`, 'error', 1800);
    }

    players[pIdx].score = Math.max(0, players[pIdx].score - penalty);
    players[pIdx].wrong++;
    totalWrong++;
    adaptiveStreak[pIdx] = 0;
    showMalus(`-${penalty} pt`);
    QM.say(rand(QM_WRONG(players[pIdx].name)), 'wrong-msg', true);
  }

  // Reset bets
  playerBets = [0,0,0,0];

  clearHighlight();
  refreshScoreboard();
  setTimeout(() => {
    document.querySelectorAll('.ans-btn').forEach(b => b.classList.remove('correct','wrong','eliminated'));
    qIndex++;
    loadQuestion();
  }, 2500);
}

function stopGame() {
  clearInterval(timerInterval);
  gameActive = false;
  QM.hide();
  showResults();
}

/* ============================================================
   RESULTS
   ============================================================ */
function showResults() {
  clearInterval(timerInterval);
  gameActive = false;
  QM.hide();
  showScreen('resultsScreen');
  SFX.victory();

  // Sort
  const sorted = [...players].map((p,i)=>({...p,idx:i})).sort((a,b)=>b.score-a.score);

  // Podium
  const medals = ['🥇','🥈','🥉','4️⃣'];
  const sizes = ['pod-1','pod-2','pod-3','pod-4'];
  const pod = document.getElementById('podium');
  // Display: 2nd, 1st, 3rd, 4th
  const order = sorted.length >= 3 ? [sorted[1],sorted[0],sorted[2],...sorted.slice(3)] : sorted;
  pod.innerHTML = order.map((p,i) => {
    const rank = sorted.indexOf(sorted.find(s=>s.name===p.name));
    return `<div class="pod-card ${sizes[rank] || 'pod-4'}" style="--delay:${0.2+rank*0.15}s">
      <div class="pod-medal">${medals[rank] || 'Mission '}</div>
      <div class="pod-name">${p.name}</div>
      <div class="pod-score">${p.score} pts</div>
      <div class="pod-coins-final">OK ${p.correct} Non ${p.wrong}</div>
    </div>`;
  }).join('');

  // Stats
  const total = totalCorrect + totalWrong;
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><div class="stat-val">${gameQuestions.length}</div><div class="stat-label">Questions</div></div>
    <div class="stat-card"><div class="stat-val">${totalCorrect}</div><div class="stat-label">Correctes</div></div>
    <div class="stat-card"><div class="stat-val">${total ? Math.round(totalCorrect/total*100) : 0}%</div><div class="stat-label">Taux succès</div></div>
    <div class="stat-card"><div class="stat-val">${getCoins()}coins</div><div class="stat-label">Coins</div></div>
  `;

  // Save history
  if (sorted.length > 0) {
    addHistory({
      winner: sorted[0].name,
      score: sorted[0].score,
      theme: selectedTheme,
      level: selectedLevel,
      date: Date.now()
    });
  }
}

function restartGame() {
  qIndex = 0;
  players.forEach(p => { p.score=0; p.correct=0; p.wrong=0; });
  totalCorrect = 0; totalWrong = 0;
  adaptiveStreak = [0,0,0,0];
  for (let i = gameQuestions.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [gameQuestions[i],gameQuestions[j]] = [gameQuestions[j],gameQuestions[i]];
  }
  buildScoreboard();
  showScreen('countdownScreen');
  QM.hide();
  startCountdown(() => { showScreen('gameScreen'); QM.show(); QM.say(rand(QM_START_MSG),'',true); setTimeout(()=>loadQuestion(),2600); });
}

/* ============================================================
   MODE MISSION (Speedrun)
   ============================================================ */
const MISSION_TIME = 8; // 8 seconds per question
const MISSION_Q_COUNT = 10;

function startMission() {
  // Pick random questions from all themes/levels
  let pool = [...questions];
  for (let i = pool.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]] = [pool[j],pool[i]];
  }
  missionQuestions = pool.slice(0, MISSION_Q_COUNT);
  missionIndex = 0;
  missionStreak = 0;
  missionCoinsEarned = 0;

  document.getElementById('missionReward').style.display = 'none';
  document.getElementById('missionAnswers').style.display = 'grid';
  document.querySelector('.mission-q').style.display = 'block';
  document.querySelector('.mission-timer').style.display = 'block';
  document.querySelector('.mission-progress').style.display = 'flex';

  showScreen('missionScreen');
  QM.show();
  QM.say(rand(QM_START_MSG), '', true);
  loadMissionQuestion();
}
function loadMissionQuestion() {
  clearInterval(missionTimer);
  if (missionIndex >= missionQuestions.length) {
    endMission();
    return;
  }
  const q = missionQuestions[missionIndex];
  document.getElementById('missionQNum').textContent = `Question ${missionIndex+1} / ${missionQuestions.length}`;
  document.getElementById('missionStreak').textContent = `Serie  ${missionStreak} streak`;
  document.getElementById('missionQ').textContent = q.q;

  let shuffled = [...q.a];
  for (let i = shuffled.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
  }
  document.getElementById('missionAnswers').innerHTML = shuffled.map(a => `
    <button class="mission-ans" onclick="missionAnswer(this,'${a.replace(/'/g,"\\'")}')"> ${a}</button>
  `).join('');

  missionTimeLeft = MISSION_TIME;
  updateMissionTimer();
  missionTimer = setInterval(() => {
    missionTimeLeft--;
    updateMissionTimer();
    if (missionTimeLeft <= 0) {
      clearInterval(missionTimer);
      missionWrong();
    }
  }, 1000);
}

function updateMissionTimer() {
  document.getElementById('missionTime').textContent = missionTimeLeft;
  document.getElementById('missionBar').style.width = (missionTimeLeft/MISSION_TIME*100)+'%';
}

function missionAnswer(btn, val) {
  clearInterval(missionTimer);
  const q = missionQuestions[missionIndex];
  const btns = document.querySelectorAll('.mission-ans');
  btns.forEach(b => b.disabled = true);

  if (val === q.correct) {
    SFX.correct();
    btn.classList.add('correct');
    missionStreak++;
    // Coins: 15 base + streak bonus + speed bonus
    const speedBonus = Math.floor(missionTimeLeft / MISSION_TIME * 10);
    const streakBonus = missionStreak > 2 ? (missionStreak-2)*5 : 0;
    const earned = 15 + speedBonus + streakBonus;
    missionCoinsEarned += earned;
    addCoins(earned);
    toast(`OK  +${earned}coins`, 'coins', 1200);
    QM.say(rand(QM_CORRECT('champion')), 'correct-msg', true);
  } else {
    SFX.wrong();
    btn.classList.add('wrong');
    btns.forEach(b => { if (b.textContent.trim() === q.correct) b.classList.add('correct'); });
    missionStreak = 0;
    toast('Non  Raté !', 'error', 1000);
    QM.say(rand(QM_WRONG('champion')), 'wrong-msg', true);
  }
  missionIndex++;
  setTimeout(loadMissionQuestion, 1200);
}

function missionWrong() {
  const q = missionQuestions[missionIndex];
  const btns = document.querySelectorAll('.mission-ans');
  btns.forEach(b => {
    b.disabled = true;
    if (b.textContent.trim() === q.correct) b.classList.add('correct');
  });
  missionStreak = 0;
  toast('Temps  Temps !', 'error', 1000);
  SFX.wrong();
  QM.say(rand(QM_TIMEOUT_MSG), 'wrong-msg', true);
  missionIndex++;
  setTimeout(loadMissionQuestion, 1200);
}

function endMission() {
  document.getElementById('missionAnswers').style.display = 'none';
  document.querySelector('.mission-q').style.display = 'none';
  document.querySelector('.mission-timer').style.display = 'none';
  document.querySelector('.mission-progress').style.display = 'none';
  document.getElementById('missionRewardCoins').textContent = `+${missionCoinsEarned} coins gagnés !`;
  document.getElementById('missionReward').style.display = 'block';
  toast(`Mission  Mission terminée! +${missionCoinsEarned}coins`, 'coins', 3000);
  SFX.victory();
  QM.say(`Mission terminée ! Tu as gagné ${missionCoinsEarned} coins, bravo !`, 'correct-msg', true);
  setTimeout(() => QM.hide(), 4000);
}

/* ============================================================
   SEL BUTTONS
   ============================================================ */
document.querySelectorAll('#levelGroup .sel-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#levelGroup .sel-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLevel = btn.dataset.val;
  };
});
document.querySelectorAll('#themeGroup .sel-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#themeGroup .sel-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTheme = btn.dataset.val;
  };
});

/* ============================================================
   INIT
   ============================================================ */
updateCoinsDisplay();
// Coins reset info
(function() {
  const data = getCoinsData();
  const resetIn = 24*3600*1000 - (Date.now() - data.lastReset);
  const h = Math.floor(resetIn/3600000);
  const resetInfo = document.getElementById('coinsResetInfo');
  if (resetInfo) resetInfo.textContent = `Reset dans ${h}h`; 
})();

// Tentative de chargement du JSON externe
loadQuestionsFromJSON();

// Add rules for new features to the rules box
function resumeGame() {
  const state = loadSavedState();
  if (!state) { toast('Aucune sauvegarde trouvée', 'error'); return; }

  // Restore state
  players         = state.players;
  gameQuestions   = state.gameQuestions;
  qIndex          = state.qIndex;
  selectedTheme   = state.selectedTheme;
  selectedLevel   = state.selectedLevel;
  selectedGameMode = state.selectedGameMode || 'normal';
  adaptiveStreak  = state.adaptiveStreak || [0,0,0,0];
  totalCorrect    = state.totalCorrect || 0;
  totalWrong      = state.totalWrong   || 0;
  roundNumber     = state.roundNumber  || 0;
  gameActive      = true;

  const minutes = Math.round((Date.now() - state.savedAt) / 60000);
  toast(`Partie reprise — sauvegardée il y a ${minutes} min`, 'success', 2500);
  buildScoreboard();
  showScreen('gameScreen');
  QM.show();
  QM.say('On reprend là où on s\'était arrêtés !', '', true);
  setTimeout(() => loadQuestion(), 2200);
}

/* ============================================================
   SALMA — RECOMMANDATIONS AUTOMATIQUES
   ============================================================ */

function getRecommendations() {
  const h = getHistory();
  if (!h.length) return ['Jouez votre première partie pour obtenir des conseils personnalisés !'];

  const recs = [];
  const last5 = h.slice(0, 5);

  // Thème le plus joué
  const themeCount = {};
  h.forEach(e => { if (e.theme) themeCount[e.theme] = (themeCount[e.theme] || 0) + 1; });
  const topTheme = Object.entries(themeCount).sort((a,b) => b[1]-a[1])[0];
  if (topTheme) recs.push(`Vous jouez souvent en thème "${topTheme[0]}" — essayez un autre thème pour progresser !`);

  // Score moyen
  const avgScore = Math.round(h.reduce((acc, e) => acc + (e.score || 0), 0) / h.length);
  if (avgScore < 3)  recs.push('Vos scores sont faibles — commencez par le niveau Débutant pour gagner en confiance.');
  else if (avgScore < 8) recs.push('Bon niveau ! Essayez le mode Intermédiaire pour progresser davantage.');
  else recs.push('Excellent niveau ! Tentez le mode Professionnel ou le Mode Tournoi !');

  // Niveau
  const levelCount = {};
  h.forEach(e => { if (e.level) levelCount[e.level] = (levelCount[e.level] || 0) + 1; });
  const topLevel = Object.entries(levelCount).sort((a,b) => b[1]-a[1])[0];
  if (topLevel && topLevel[0] === 'Débutant' && h.length >= 3) {
    recs.push('Vous maîtrisez le niveau Débutant — passez à Intermédiaire !');
  }

  // Régularité
  if (h.length >= 5) recs.push(`Bravo ! Vous avez joué ${h.length} parties. Essayez le Mode Mission pour gagner des coins !`);

  return recs.slice(0, 3);
}

let randomEventActive = false;

function triggerRandomEvent() {
  if (randomEventActive || !gameActive) return;

  const events = [
    { emoji: '⚡', text: 'Bonus vitesse !', detail: '+2 pts pour le prochain buzzeur', action: () => { window._speedBonus = 2; } },
    { emoji: '🎯', text: 'Double points !', detail: 'La prochaine bonne réponse vaut 2 pts', action: () => { window._doublePoints = true; } },
    { emoji: '⏱️', text: 'Temps bonus !', detail: '+8 secondes sur le chrono', action: () => { timeLeft = Math.min(timeLeft + 8, maxTime + 8); updateTimerUI(); } },
    { emoji: '🔀', text: 'Shuffle des réponses !', detail: 'Les réponses sont mélangées', action: () => { shuffleAnswersDOM(); } },
    { emoji: '🎁', text: 'Coins gratuits !', detail: '+20 coins pour tout le monde', action: () => { addCoins(20); updateCoinsDisplay(); } },
  ];

  const ev = events[Math.floor(Math.random() * events.length)];
  randomEventActive = true;

  // Affiche badge événement
  const existing = document.getElementById('randomEventBadge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'randomEventBadge';
  badge.style.cssText = `
    position:fixed;top:72px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,var(--accent2),var(--purple));
    padding:10px 22px;border-radius:40px;font-size:14px;font-weight:700;
    z-index:10000;white-space:nowrap;
    box-shadow:0 4px 24px rgba(247,37,133,.4);
    animation:eventPop .4s cubic-bezier(.34,1.56,.64,1);
  `;
  badge.textContent = `${ev.emoji} Événement : ${ev.text} — ${ev.detail}`;
  document.body.appendChild(badge);

  ev.action();

  setTimeout(() => {
    badge.style.opacity = '0';
    badge.style.transition = 'opacity .4s';
    setTimeout(() => { badge.remove(); randomEventActive = false; }, 400);
  }, 3500);
}

function startMiniGame() {
  const existing = document.getElementById('miniGameModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'miniGameModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:30000;background:rgba(0,0,0,.92);
    backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;
    padding:20px;animation:fadeIn .3s ease;
  `;

  const pads = [
    { id: 0, label: 'A', color: '#40e0d0' },
    { id: 1, label: 'B', color: '#ff4d8d' },
    { id: 2, label: 'C', color: '#ffd166' },
    { id: 3, label: 'D', color: '#7c5cff' }
  ];
  const rounds = [3, 4, 5, 6];
  const timeLimit = 14;
  let countdown = timeLimit;
  let round = 0;
  let sequence = [];
  let cursor = 0;
  let score = 0;
  let accepting = false;
  let gameInterval = null;
  let finished = false;

  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--card-border);border-radius:28px;
      padding:36px 28px;max-width:420px;width:100%;text-align:center;">
      <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.16em;
        color:var(--accent3);margin-bottom:12px;">🎮 Mini-jeu bonus</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:6px;">Code Chrono</div>
      <div style="color:var(--text-dim);font-size:14px;margin-bottom:22px;">Memorise la suite, puis rejoue-la avant la fin.</div>
      <div style="font-family:'Orbitron',sans-serif;font-size:40px;font-weight:900;
        color:var(--accent);margin-bottom:16px;" id="mgTimer">${timeLimit}</div>
      <div id="mgStatus" style="min-height:24px;color:var(--text-dim);font-weight:800;margin-bottom:14px;">Prepare-toi...</div>
      <div id="mgPads" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 auto 18px;max-width:260px;">
        ${pads.map(p => `
          <button type="button" class="mg-pad" data-pad="${p.id}" style="
            height:92px;border-radius:14px;border:1px solid var(--card-border);
            background:${p.color};color:#061018;font-size:28px;font-weight:900;
            cursor:pointer;opacity:.72;transition:transform .12s, opacity .12s, box-shadow .12s;">
            ${p.label}
          </button>`).join('')}
      </div>
      <div style="font-size:22px;font-weight:900;color:var(--gold);" id="mgCount">Round 1 / ${rounds.length}</div>
      <div id="mgResult" style="margin-top:16px;display:none;">
        <div style="font-size:22px;font-weight:900;margin-bottom:10px;" id="mgResultText"></div>
        <button onclick="document.getElementById('miniGameModal').remove()"
          style="padding:12px 32px;border-radius:12px;border:none;cursor:pointer;
            background:linear-gradient(135deg,var(--purple),var(--accent));
            color:#fff;font-weight:700;font-size:15px;">Super !</button>
      </div>
    </div>
  `;

  // Inject pulse animation
  if (!document.getElementById('mgStyle')) {
    const st = document.createElement('style');
    st.id = 'mgStyle';
    st.textContent = `
      @keyframes mgPulse{0%,100%{box-shadow:0 0 0 0 rgba(123,47,255,.5);}
        50%{box-shadow:0 0 0 18px rgba(123,47,255,0);}}
      .mg-pad.active{opacity:1!important;transform:scale(1.08);box-shadow:0 0 28px currentColor;}
      .mg-pad.good{box-shadow:0 0 0 4px rgba(74,222,128,.75);}
      .mg-pad.bad{box-shadow:0 0 0 4px rgba(255,84,112,.8);filter:saturate(.65);}
      @keyframes eventPop{from{transform:translateX(-50%) scale(.7);opacity:0;}
        to{transform:translateX(-50%) scale(1);opacity:1;}}
      @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    `;
    document.head.appendChild(st);
  }

  document.body.appendChild(modal);

  const timerEl  = document.getElementById('mgTimer');
  const countEl  = document.getElementById('mgCount');
  const statusEl = document.getElementById('mgStatus');
  const padBtns = [...document.querySelectorAll('#mgPads .mg-pad')];
  const resultDiv = document.getElementById('mgResult');
  const resultText = document.getElementById('mgResultText');

  const flashPad = (id, cls = 'active', ms = 260) => {
    const pad = padBtns.find(b => Number(b.dataset.pad) === id);
    if (!pad) return;
    pad.classList.add(cls);
    setTimeout(() => pad.classList.remove(cls), ms);
  };

  const playSequence = () => {
    accepting = false;
    cursor = 0;
    statusEl.textContent = `Observe la suite (${sequence.length})`;
    padBtns.forEach(b => b.disabled = true);
    sequence.forEach((id, i) => {
      setTimeout(() => flashPad(id, 'active', 320), 420 * i + 250);
    });
    setTimeout(() => {
      accepting = true;
      statusEl.textContent = 'A toi de rejouer la suite.';
      padBtns.forEach(b => b.disabled = false);
    }, 420 * sequence.length + 520);
  };

  const nextRound = () => {
    if (round >= rounds.length) {
      endGame(true);
      return;
    }
    sequence = Array.from({ length: rounds[round] }, () => Math.floor(Math.random() * pads.length));
    countEl.textContent = `Round ${round + 1} / ${rounds.length}`;
    playSequence();
  };

  const endGame = () => {
    if (finished) return;
    finished = true;
    clearInterval(gameInterval);
    accepting = false;
    padBtns.forEach(b => {
      b.disabled = true;
      b.style.cursor = 'not-allowed';
      b.style.opacity = '.45';
    });

    const won = score >= rounds.reduce((a, b) => a + b, 0);
    const reward = won ? 90 : Math.max(10, score * 5);
    addCoins(reward);
    updateCoinsDisplay();

    resultText.textContent = won
      ? `🏆 Parfait ! +${reward} coins !`
      : `Score ${score} bonnes touches -> +${reward} coins`;
    resultDiv.style.display = 'block';
    if (won) toast(`🎮 Mini-jeu : +${reward} coins !`, 'success', 2500);
  };

  // Timer countdown
  gameInterval = setInterval(() => {
    countdown--;
    if (timerEl) timerEl.textContent = countdown;
    if (countdown <= 0) endGame();
  }, 1000);

  padBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (finished || !accepting) return;
      const id = Number(btn.dataset.pad);
      const expected = sequence[cursor];
      if (id !== expected) {
        flashPad(id, 'bad', 360);
        statusEl.textContent = 'Erreur ! La partie se termine.';
        endGame();
        return;
      }

      flashPad(id, 'good', 220);
      cursor++;
      score++;
      statusEl.textContent = `${cursor} / ${sequence.length}`;
      if (cursor >= sequence.length) {
        accepting = false;
        round++;
        statusEl.textContent = 'Round valide !';
        setTimeout(nextRound, 700);
      }
    });
  });

  setTimeout(nextRound, 500);

  modal.addEventListener('click', e => {
    if (e.target === modal && finished) modal.remove();
  });
}

/* ============================================================
   SALMA — HOOKS DANS LE JEU
   ============================================================ */

// Patch loadQuestion pour déclencher saveGameState + événement aléatoire
