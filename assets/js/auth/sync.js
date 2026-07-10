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

    localStorage.setItem('qpuc_coins', JSON.stringify({ coins: profile.coins, lastReset: Date.now() }));
    localStorage.setItem('qpuc_history', JSON.stringify(profile.history || []));

    if (typeof updateCoinsDisplay === 'function') updateCoinsDisplay();

    patchGlobalFunctions(userId);

    console.log('[sync] Compte connecte:', session.user.email, '- coins:', profile.coins);
  } catch (err) {
    console.error('[sync] init failed:', err);
  }
}

function patchGlobalFunctions(userId) {
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

  if (typeof window.addHistory === 'function' && !window.addHistory.__patched) {
    const original = window.addHistory;
    const patched = function (entry) {
      const result = original(entry);
      pushHistory(userId);
      return result;
    };
    patched.__patched = true;
    window.addHistory = patched;
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
  }, 500);
}

async function pushHistory(userId) {
  try {
    const history = JSON.parse(localStorage.getItem('qpuc_history') || '[]');
    await supabase.from('profiles').update({ history, updated_at: new Date().toISOString() }).eq('id', userId);
  } catch (err) {
    console.error('[sync] pushHistory failed:', err);
  }
}
