// assets/js/online/bridge.js
// Bridge: relie une salle en ligne (Supabase) au moteur de jeu LOCAL existant
// (game.js). Charge uniquement si l'URL contient ?room=CODE.
// Remplit p1in..p4in avec les vrais noms, et transforme chaque buzz distant
// en appel direct a la fonction globale buzz(pIdx) deja utilisee par le
// clavier S/D/K/L en local.

import { supabase } from './supabaseClient.js';

const params = new URLSearchParams(location.search);
const roomCode = params.get('room');

if (roomCode) {
  initOnlineBridge(roomCode);
}

async function initOnlineBridge(code) {
  try {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !room) {
      console.error('[bridge] room not found:', code);
      return;
    }

    const { data: players, error: playersErr } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true });

    if (playersErr) throw playersErr;

    // Remplit automatiquement les 4 champs de noms (Robot si vide)
    const ids = ['p1in', 'p2in', 'p3in', 'p4in'];
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = players[i] ? players[i].name : `Robot ${i + 1}`;
    });

    // Ecoute les buzz distants et les transforme en buzz() local
    supabase
      .channel(`bridge-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'buzzes', filter: `room_id=eq.${room.id}` },
        (payload) => {
          const b = payload.new;
          const idx = players.findIndex((p) => p.id === b.player_id);
          if (idx === -1) return;

          // Ne transmet le buzz que si la partie locale est active et en attente
          if (
            typeof gameActive !== 'undefined' && gameActive &&
            typeof currentScreen !== 'undefined' && currentScreen === 'gameScreen' &&
            typeof activePlayer !== 'undefined' && activePlayer === null &&
            typeof buzz === 'function'
          ) {
            buzz(idx);
          }
        }
      )
      .subscribe();

    console.log('[bridge] Online room connected:', room.code, 'players:', players.map(p => p.name));
  } catch (err) {
    console.error('[bridge] init failed:', err);
  }
}
