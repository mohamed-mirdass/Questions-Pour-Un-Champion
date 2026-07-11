// assets/js/auth/sync.js
// Synchronise coins + historique avec le compte Supabase (si connecte).
// Ne modifie jamais data.js : on lit/ecrit juste le meme localStorage
// que data.js utilise deja (qpuc_coins, qpuc_history), et on "patch"
// les fonctions globales existantes pour pousser chaque changement au cloud.

import { supabase } from '../online/supabaseClient.js';

initSync();

async function initSync() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // pas connecte : le jeu marche normalement en local

    const userId = session.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('[sync] profile introuvable:', error);
      return;
    }

    // Ecrase le localStorage local avec les valeurs du cloud (source de verite
    // quand on est connecte)
    localStorage.setItem('qpuc_coins', JSON.stringify({ coins: profile.coins, lastReset: Date.now() }));
    localStorage.setItem('qpuc_history', JSON.stringify(profile.history || []));

    if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();

    updateAccountIcon(session, profile);
    applyActiveMaster(profile.active_master);
    applyLevelBadge(profile);
    patchGlobalFunctions(userId);

    console.log('[sync] Compte connecte:', session.user.email, '- coins:', profile.coins);
  } catch (err) {
    console.error('[sync] init failed:', err);
  }
}

const MASTER_IMAGES = {
  default: 'assets/img/quizmaster.png',
  marcus: 'assets/img/quizmasters/marcus.png',
  sofia: 'assets/img/quizmasters/sofia.png',
  leonard: 'assets/img/quizmasters/leonard.png',
  max: 'assets/img/quizmasters/max.png',
  elhajoui: 'assets/img/quizmasters/elhajoui.png',
  ilyass: 'assets/img/quizmasters/ilyass.png',
  ouahbi: 'assets/img/quizmasters/ouahbi.png',
  walid: 'assets/img/quizmasters/walid.png',
};

function applyActiveMaster(activeId) {
  const img = document.getElementById('qmChar');
  if (!img) return;
  img.src = MASTER_IMAGES[activeId] || MASTER_IMAGES.default;
}

function applyLevelBadge(profile) {
  const pill = document.getElementById('playerLevelPill');
  if (!pill) return;
  const xp = profile?.xp || 0;
  const level = Math.min(50, Math.floor(xp / 100) + 1);
  const numEl = document.getElementById('playerLevelNum');
  if (numEl) numEl.textContent = level;
  pill.style.display = 'inline-flex';
}

function updateAccountIcon(session, profile) {
  const btn = document.getElementById('accountBtn');
  if (!btn) return;
  const name = profile?.display_name || session.user.email || '';
  btn.textContent = name.trim().charAt(0).toUpperCase() || '👤';
  btn.title = `Connecte : ${name}`;
  btn.style.background = 'linear-gradient(135deg,var(--accent),var(--accent3))';
  btn.style.color = '#04211d';
  btn.style.fontWeight = '900';
}

function patchGlobalFunctions(userId) {
  // saveCoins(amount) est appelee par addCoins()/spendCoins() dans data.js
  if (typeof window.saveCoins === 'function' && !window.saveCoins.__patched) {
    const original = window.saveCoins;
    const patched = function (amount) {
      const result = original(amount);
      pushCoins(userId, amount);
      return result;
    };
    patched.__patched = true;
    window.saveCoins = patched;
  }

  // addHistory(entry) est appelee a la fin de chaque partie
  if (typeof window.addHistory === 'function' && !window.addHistory.__patched) {
    const original = window.addHistory;
    const patched = function (entry) {
      const result = original(entry);
      pushHistory(userId);
      pushXp(userId);
      return result;
    };
    patched.__patched = true;
    window.addHistory = patched;
  }
}

const XP_PER_GAME = 20;
const LEVEL_UNLOCK_MASTERS = 7;
async function pushXp(userId) {
  try {
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();
    if (fetchErr || !profile) return;

    const oldXp = profile.xp || 0;
    const oldLevel = Math.min(50, Math.floor(oldXp / 100) + 1);
    const newXp = oldXp + XP_PER_GAME;
    const newLevel = Math.min(50, Math.floor(newXp / 100) + 1);

    await supabase
      .from('profiles')
      .update({ xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (oldLevel < LEVEL_UNLOCK_MASTERS && newLevel >= LEVEL_UNLOCK_MASTERS && typeof toast === 'function') {
      toast('🎉 Niveau 7 atteint ! Tu peux maintenant acheter un Quiz Master dans la Boutique.', 'success', 6000);
    }
  } catch (err) {
    console.error('[sync] pushXp failed:', err);
  }
}

let coinsPushTimer = null;
function pushCoins(userId, coins) {
  clearTimeout(coinsPushTimer);
  coinsPushTimer = setTimeout(async () => {
    try {
      await supabase.from('profiles').update({ coins, updated_at: new Date().toISOString() }).eq('id', userId);
    } catch (err) {
      console.error('[sync] pushCoins failed:', err);
    }
  }, 500); // debounce : evite trop d'ecritures si plusieurs coins arrivent d'affilee
}

async function pushHistory(userId) {
  try {
    const history = JSON.parse(localStorage.getItem('qpuc_history') || '[]');
    await supabase.from('profiles').update({ history, updated_at: new Date().toISOString() }).eq('id', userId);
  } catch (err) {
    console.error('[sync] pushHistory failed:', err);
  }
}
