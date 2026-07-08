/* ============================================================
   APP.JS — Point d'entrée : initialisation, câblage entre modules,
   routage par page. Chargé en dernier (après tous les autres modules).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-mission') && document.getElementById('missionScreen')) {
    startMission();
  }
  if (document.body.classList.contains('page-history') && document.getElementById('historyList')) {
    showHistory();
  }
});

/* ============================================================
   SALMA — SAUVEGARDE COMPLETE + REPRISE
   ============================================================ */

const _origLoadQuestion = loadQuestion;
loadQuestion = function() {
  _origLoadQuestion.apply(this, arguments);
  // Sauvegarde après chaque question
  setTimeout(() => saveGameState(), 300);
  // Événement aléatoire toutes les 3 questions (30% de chance)
  if (typeof qIndex !== 'undefined' && qIndex > 0 && qIndex % 3 === 0) {
    if (Math.random() < 0.35) {
      setTimeout(() => triggerRandomEvent(), 1800);
    }
  }
};

// Patch stopGame pour effacer la sauvegarde en fin de partie normale
const _origStopGame = stopGame;
stopGame = function() {
  clearSavedState();
  _origStopGame.apply(this, arguments);
};

/* ============================================================
   SALMA — TOPBAR BUTTONS (ajout dynamique)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Charger Chart.js si pas encore présent
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    document.head.appendChild(script);
  }

  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  // Bouton Reprendre
  const resumeBtn = document.createElement('button');
  resumeBtn.className = 'topbar-btn resume-game-btn';
  resumeBtn.type = 'button';
  resumeBtn.innerHTML = '<span>🔄 Reprendre</span>';
  resumeBtn.onclick = resumeGame;
  resumeBtn.style.display = 'none';
  topbar.insertBefore(resumeBtn, topbar.firstChild);

  // Bouton Statistiques
  const statsBtn = document.createElement('button');
  statsBtn.className = 'topbar-btn';
  statsBtn.type = 'button';
  statsBtn.innerHTML = '<span>📊 Stats</span>';
  statsBtn.onclick = showStatsChart;
  topbar.insertBefore(statsBtn, topbar.firstChild);

  // Bouton Conseils
  const recoBtn = document.createElement('button');
  recoBtn.className = 'topbar-btn';
  recoBtn.type = 'button';
  recoBtn.innerHTML = '<span>💡 Conseils</span>';
  recoBtn.onclick = showRecommendations;
  topbar.insertBefore(recoBtn, topbar.firstChild);

  // Bouton Mini-jeu
  const mgBtn = document.createElement('button');
  mgBtn.className = 'topbar-btn';
  mgBtn.type = 'button';
  mgBtn.innerHTML = '<span>🎮 Mini-jeu</span>';
  mgBtn.onclick = startMiniGame;
  topbar.insertBefore(mgBtn, topbar.firstChild);

  // Vérifier si une sauvegarde existe
  updateResumeBtnVisibility();
});
