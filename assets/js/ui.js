/* ============================================================
   UI.JS — Interface utilisateur : rendu DOM, écrans, scoreboard,
   timer visuel, toasts, graphiques, thème. Aucune règle de jeu ici.
   ============================================================ */

function updateCoinsDisplay() {
  const globalCoinsEl = document.getElementById('globalCoins');
  if (globalCoinsEl) globalCoinsEl.textContent = getCoins();
  // Also update in game joker buttons
  updateJokerButtons();
  // Update joker shop
  updateJokerShopWallet();
}

/* ============================================================
   HISTORY (localStorage)
   ============================================================ */
function showHistory() {
  const list = document.getElementById('historyList');
  if (!list) { window.location.href = 'history.html'; return; }
  const h = getHistory();
  if (!h.length) {
    list.innerHTML = '<p class="empty-state">Aucune partie jouee.</p>'; 
  } else {
    list.innerHTML = h.map(e => `
      <div class="hist-item">
        <div>
          <div style="font-weight:600;">${e.winner} Champion </div>
          <div class="hist-info">${e.theme} · ${e.level} · ${new Date(e.date).toLocaleDateString()}</div>
        </div>
        <div class="hist-score">${e.score} pts</div>
      </div>
    `).join('');
  }
  showScreen('historyScreen');
}

/* ============================================================
   PARTICLES
   ============================================================ */
(function() {
  const c = document.getElementById('particles');
  const colors = ['#00f5d4','#f72585','#f4d35e','#7b2fff'];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('span');
    const col = colors[i % colors.length];
    s.style.cssText = `left:${Math.random()*100}%;width:${4+Math.random()*6}px;height:${4+Math.random()*6}px;background:${col};animation-duration:${8+Math.random()*12}s;animation-delay:${Math.random()*10}s;opacity:${0.2+Math.random()*0.3};`;
    c.appendChild(s);
  }
})();

/* ============================================================
   SCREEN MANAGEMENT
   ============================================================ */
function showScreen(id) {
  const target = document.getElementById(id);
  if (!target) {
    const routes = {homeScreen:'index.html', gameScreen:'game.html', missionScreen:'mission.html', historyScreen:'history.html', resultsScreen:'results.html'};
    if (routes[id]) window.location.href = routes[id];
    return;
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  target.classList.add('active');
  currentScreen = id;
  const stop = document.getElementById('stopBtn');
  if (stop) stop.style.display = (id === 'gameScreen' && gameActive) ? 'inline-flex' : 'none';
}

/* ============================================================
   THEME TOGGLE
   ============================================================ */
function toggleTheme() {
  document.body.classList.toggle('light');
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.textContent = document.body.classList.contains('light') ? 'Mode sombre' : 'Mode clair';
  try { localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark'); } catch(e) {}
}

function toggleSfx() {
  SFX.setMuted(!SFX.muted);
  updateSfxIcon();
  if (!SFX.muted) SFX.tick(); // audible confirmation that sound is back on
}
function updateSfxIcon() {
  const btn = document.getElementById('sfxToggle');
  if (btn) btn.innerHTML = `<span>${SFX.muted ? '🔇' : '🔊'}</span>`;
}
document.addEventListener('DOMContentLoaded', updateSfxIcon);


/* ============================================================
   TOAST
   ============================================================ */
function toast(msg, type='info', dur=2000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), dur);
}

/* ============================================================
   BONUS POPUP (floating +points)
   ============================================================ */
function showBonus(text, x, y, color='#f4d35e') {
  const p = document.getElementById('bonusPopup');
  p.textContent = text;
  p.style.color = color;
  p.style.left = (x||window.innerWidth/2-30)+'px';
  p.style.top = (y||200)+'px';
  p.style.opacity = '1';
  p.style.transform = 'translateY(0)';
  p.style.transition = 'opacity 0.3s,transform 0.3s';
  setTimeout(() => {
    p.style.transform = 'translateY(-60px)';
    p.style.opacity = '0';
  }, 100);
  setTimeout(() => { p.style.transition = ''; }, 1500);
}

/* ============================================================
   ADAPTIVE DIFFICULTY
   ============================================================ */
function updateDiffUI() {
  const d = getDifficultyLabel();
  const badge = document.getElementById('diffBadge');
  badge.textContent = d.label;
  badge.className = 'diff-badge ' + d.cls;
  const dots = ['dd1','dd2','dd3'];
  const dotCls = ['on-easy','on-medium','on-hard'];
  dots.forEach((id,i) => {
    const el = document.getElementById(id);
    el.className = 'diff-dot' + (d.dots[i] ? ' '+dotCls[i] : '');
  });
  // Timer color
  const timerEl = document.getElementById('timerText');
  timerEl.style.setProperty('--timer-color', d.dots[2] ? 'var(--danger)' : d.dots[1] ? 'var(--accent3)' : 'var(--accent)');
}

/* ============================================================
   SCOREBOARD
   ============================================================ */
function buildScoreboard() {
  const sb = document.getElementById('scoreboard');
  const keys = ['S','D','K','L'];
  sb.innerHTML = players.map((p,i) => `
    <div class="player-score" id="psCard${i}">
      <span class="ps-key">${keys[i]}</span>
      <div class="ps-name">${p.name}</div>
      <div class="ps-score" id="psScore${i}">${p.score}</div>
      <div class="ps-coins" id="psCoins${i}">coins ${getCoins()}</div>
    </div>
  `).join('');
}
function refreshScoreboard() {
  players.forEach((p,i) => {
    const el = document.getElementById('psScore'+i);
    const cel = document.getElementById('psCoins'+i);
    if (el) { el.textContent = p.score; el.classList.add('score-flash'); setTimeout(()=>el.classList.remove('score-flash'),400); }
    if (cel) cel.textContent = 'coins ' + getCoins();
  });
}
function highlightPlayer(pIdx) {
  document.querySelectorAll('.player-score').forEach((c,i) => {
    c.classList.toggle('active-player', i === pIdx);
  });
}
function clearHighlight() {
  document.querySelectorAll('.player-score').forEach(c => c.classList.remove('active-player'));
}

/* ============================================================
   JOKER SYSTEM
   ============================================================ */
function updateJokerButtons() {
  const coins = getCoins();
  const canBuzz = activePlayer !== null;
  const j50 = document.getElementById('j50');
  const j70 = document.getElementById('j70');
  const j100 = document.getElementById('j100');
  if (!j50) return;
  j50.disabled = !canBuzz || coins < 50 || jokerUsed[50];
  j70.disabled = !canBuzz || coins < 70 || jokerUsed[70];
  j100.disabled = !canBuzz || coins < 100 || jokerUsed[100];
}
function updateJokerShopWallet() {
  const el = document.getElementById('jsWalletVal');
  if (el) el.textContent = getCoins() + ' coins';
}
function updateTimerUI() {
  const pct = (timeLeft / maxTime) * 100;
  document.getElementById('timerBar').style.width = pct + '%';
  document.getElementById('timerText').textContent = timeLeft + 's';
  const urgentEl = document.getElementById('timerText');
  if (timeLeft <= 5) { urgentEl.classList.add('urgent'); } else { urgentEl.classList.remove('urgent'); }
  // Bar color
  const bar = document.getElementById('timerBar');
  if (pct > 60) bar.style.background = 'linear-gradient(90deg,var(--accent),var(--purple))';
  else if (pct > 30) bar.style.background = 'linear-gradient(90deg,var(--accent3),var(--accent2))';
  else bar.style.background = 'linear-gradient(90deg,var(--danger),var(--accent2))';
}

function buildNormalBuzzers() {
  const area = document.getElementById('buzzerArea');
  if (!area) return;
  const colors = ['p1', 'p2', 'p3', 'p4'];
  const keys = ['S', 'D', 'K', 'L'];
  area.innerHTML = players.map((p, i) => `
    <button class="buzzer ${colors[i]}" id="buzzerBtn${i}" onclick="buzz(${i})" type="button">
      <span class="buzzer-key">${keys[i]}</span>
      <span class="buzzer-name">${p.name}</span>
    </button>
  `).join('');
}

function buildScoreboardWithBets() {
  const sb = document.getElementById('scoreboard');
  const keys = ['S','D','K','L'];
  sb.innerHTML = players.map((p,i) => `
    <div class="player-score" id="psCard${i}">
      <span class="ps-key">${keys[i]}</span>
      <div class="ps-name">${p.name}</div>
      <div class="ps-score" id="psScore${i}">${p.score}</div>
      ${playerBets[i] > 0 ? `<div style="font-size:10px;color:var(--accent3);">Paris  Misé: ${playerBets[i]}</div>` : ''}
      <div class="ps-coins" id="psCoins${i}">coins ${getCoins()}</div>
    </div>
  `).join('');
}

/* ============================================================
   MANCHE RAPIDITE
   ============================================================ */
function showMalus(text) {
  const el = document.createElement('div');
  el.className = 'malus-flash';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/* ============================================================
   ANSWER CLICK (manche normale + paris, avec malus)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Update rules box to mention new features
  const rulesBox = document.querySelector('.rules-box ul');
  if (rulesBox) {
    const newRules = [
      'Manche Paris: misez avant la question',
      'Manche Rapidite: premier buzz = reponse',
      'Malus: -1 pt pour mauvaise reponse',
      'Mode Mixte: alterne les types de manches'
    ];
    newRules.forEach(rule => {
      const li = document.createElement('li');
      li.textContent = rule;
      rulesBox.appendChild(li);
    });
  }
});
// Page-specific bootstraps for companion multipage routes.
function updateResumeBtnVisibility() {
  const btns = document.querySelectorAll('.resume-game-btn');
  const hasSave = !!loadSavedState();
  btns.forEach(btn => {
    btn.style.display = hasSave ? 'inline-flex' : 'none';
  });
}

function showRecommendations() {
  const recs = getRecommendations();
  const existing = document.getElementById('recoModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'recoModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:30000;background:rgba(0,0,0,.85);
    backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;
    animation:fadeIn .25s ease;padding:20px;
  `;
  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--card-border);border-radius:24px;
      padding:32px;max-width:480px;width:100%;box-shadow:0 0 60px rgba(0,245,212,.15);">
      <div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.16em;
        color:var(--accent);margin-bottom:16px;">💡 Conseils personnalisés</div>
      <div style="display:grid;gap:14px;margin-bottom:28px;">
        ${recs.map(r => `
          <div style="display:flex;gap:12px;align-items:flex-start;padding:14px;
            border-radius:14px;background:rgba(255,255,255,.04);border:1px solid var(--card-border);">
            <span style="font-size:18px;flex-shrink:0">✨</span>
            <span style="font-size:14px;line-height:1.6;color:var(--text)">${r}</span>
          </div>`).join('')}
      </div>
      <button onclick="document.getElementById('recoModal').remove()"
        style="width:100%;padding:13px;border-radius:12px;border:none;cursor:pointer;
          background:linear-gradient(135deg,var(--purple),var(--accent));
          color:#fff;font-weight:700;font-size:15px;">Merci !</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

/* ============================================================
   SALMA — GRAPHIQUES CHART.JS
   ============================================================ */

let _chartInstance = null;

function showStatsChart() {
  // Supprimer modal existant
  const existing = document.getElementById('statsChartModal');
  if (existing) existing.remove();

  const h = getHistory();

  const modal = document.createElement('div');
  modal.id = 'statsChartModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:30000;background:rgba(0,0,0,.88);
    backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;
    animation:fadeIn .25s ease;padding:20px;
  `;

  if (!h.length) {
    modal.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--card-border);border-radius:24px;
        padding:32px;max-width:480px;width:100%;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px">📊</div>
        <div style="font-weight:900;font-size:20px;margin-bottom:10px">Pas encore de données</div>
        <div style="color:var(--text-dim);margin-bottom:24px">Jouez votre première partie pour voir vos statistiques !</div>
        <button onclick="document.getElementById('statsChartModal').remove()"
          style="padding:12px 28px;border-radius:12px;border:none;cursor:pointer;
            background:linear-gradient(135deg,var(--purple),var(--accent));color:#fff;font-weight:700;">
          OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    return;
  }

  // Prépare données — dernières 10 parties
  const last10 = h.slice(0, 10).reverse();
  const labels = last10.map((e, i) => `P${i+1}`);
  const scores = last10.map(e => e.score || 0);
  const themes = [...new Set(h.map(e => e.theme).filter(Boolean))];
  const themeCount = {};
  themes.forEach(t => { themeCount[t] = h.filter(e => e.theme === t).length; });

  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--card-border);border-radius:24px;
      padding:28px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <div style="font-size:11px;font-weight:900;text-transform:uppercase;
            letter-spacing:.16em;color:var(--accent);margin-bottom:4px;">📊 Mes statistiques</div>
          <div style="font-size:18px;font-weight:900;">${h.length} parties jouées</div>
        </div>
        <button id="closeChartBtn" style="width:36px;height:36px;border-radius:50%;border:1px solid var(--card-border);
          background:var(--card);cursor:pointer;color:var(--text);font-size:18px;">✕</button>
      </div>

      <!-- Stat cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
        <div style="padding:14px;border-radius:14px;background:rgba(255,255,255,.04);
          border:1px solid var(--card-border);text-align:center;">
          <div style="font-size:26px;font-weight:900;color:var(--gold)">${Math.max(...scores)}</div>
          <div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em">Meilleur score</div>
        </div>
        <div style="padding:14px;border-radius:14px;background:rgba(255,255,255,.04);
          border:1px solid var(--card-border);text-align:center;">
          <div style="font-size:26px;font-weight:900;color:var(--accent)">
            ${Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}</div>
          <div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em">Score moyen</div>
        </div>
        <div style="padding:14px;border-radius:14px;background:rgba(255,255,255,.04);
          border:1px solid var(--card-border);text-align:center;">
          <div style="font-size:26px;font-weight:900;color:var(--success)">${h.length}</div>
          <div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em">Parties totales</div>
        </div>
      </div>

      <!-- Chart évolution scores -->
      <div style="background:rgba(0,0,0,.2);border-radius:16px;padding:16px;margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--text-dim);
          text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;">Évolution des scores</div>
        <canvas id="salmaScoreChart" height="140"></canvas>
      </div>

      <!-- Chart thèmes -->
      ${themes.length > 1 ? `
      <div style="background:rgba(0,0,0,.2);border-radius:16px;padding:16px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:var(--text-dim);
          text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;">Parties par thème</div>
        <canvas id="salmaThemeChart" height="140"></canvas>
      </div>` : ''}

      <button id="closeChartBtn2"
        style="width:100%;padding:13px;border-radius:12px;border:none;cursor:pointer;
          background:linear-gradient(135deg,var(--purple),var(--accent));
          color:#fff;font-weight:700;font-size:15px;">Fermer</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Close buttons
  const closeModal = () => {
    if (_chartInstance) { _chartInstance.destroy(); _chartInstance = null; }
    modal.remove();
  };
  document.getElementById('closeChartBtn').onclick  = closeModal;
  document.getElementById('closeChartBtn2').onclick = closeModal;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Render charts after DOM ready
  requestAnimationFrame(() => {
    // Score line chart
    const scoreCtx = document.getElementById('salmaScoreChart');
    if (scoreCtx && window.Chart) {
      _chartInstance = new window.Chart(scoreCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Score',
            data: scores,
            borderColor: '#00f5d4',
            backgroundColor: 'rgba(0,245,212,.12)',
            borderWidth: 2.5,
            pointBackgroundColor: '#00f5d4',
            pointRadius: 5,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { color: 'rgba(255,255,255,.5)', font: { size: 11 } },
              grid: { color: 'rgba(255,255,255,.06)' } },
            x: { ticks: { color: 'rgba(255,255,255,.5)', font: { size: 11 } },
              grid: { color: 'rgba(255,255,255,.06)' } }
          }
        }
      });
    }

    // Theme doughnut chart
    const themeCtx = document.getElementById('salmaThemeChart');
    if (themeCtx && window.Chart && themes.length > 1) {
      const colors = ['#00f5d4','#f72585','#f4d35e','#7b2fff','#2ed573','#ff4757'];
      new window.Chart(themeCtx, {
        type: 'doughnut',
        data: {
          labels: themes,
          datasets: [{
            data: themes.map(t => themeCount[t]),
            backgroundColor: colors.slice(0, themes.length),
            borderWidth: 2,
            borderColor: 'rgba(0,0,0,.3)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom',
              labels: { color: 'rgba(255,255,255,.7)', font: { size: 12 }, padding: 16 } }
          }
        }
      });
    }
  });
}

/* ============================================================
   SALMA — ÉVÉNEMENTS ALÉATOIRES
   ============================================================ */

function shuffleAnswersDOM() {
  const grid = document.getElementById('answersGrid');
  if (!grid) return;
  const btns = [...grid.querySelectorAll('.ans-btn')];
  for (let i = btns.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    grid.appendChild(btns[j]);
    btns.splice(j, 1);
  }
}

/* ============================================================
   SALMA — MINI-JEU BONUS COINS
   ============================================================ */

