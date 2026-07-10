// assets/js/online/bridge.js
// Bridge: relie une salle en ligne (Supabase) au moteur de jeu LOCAL existant
// (game.js). Charge uniquement si l'URL contient ?room=CODE.
// - Remplit p1in..p4in avec les vrais noms
// - Transmet chaque buzz distant vers la fonction globale buzz(pIdx)
// - Diffuse l'etat live du jeu (question, choix, timer, scores) vers Supabase
// - Recoit les reponses envoyees depuis les telephones et les transforme
//   en clic reel sur le bon bouton de reponse (answerClick)

import { supabase } from './supabaseClient.js';
import { updateLiveState, submitAnswer } from './room.js';

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

    // Ecoute les buzz distants + les reponses distantes
    subscribeBridge(room, players);

    // Diffuse l'etat du jeu local vers Supabase en continu
    startBroadcastLoop(room);

    console.log('[bridge] Online room connected:', room.code, 'players:', players.map(p => p.name));
  } catch (err) {
    console.error('[bridge] init failed:', err);
  }
}

function subscribeBridge(room, players) {
  supabase
    .channel(`bridge-${room.id}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'buzzes', filter: `room_id=eq.${room.id}` },
      (payload) => {
        const b = payload.new;
        const idx = players.findIndex((p) => p.id === b.player_id);
        if (idx === -1) return;

        if (
          typeof currentScreen !== 'undefined' && currentScreen === 'gameScreen' &&
          typeof activePlayer !== 'undefined' && activePlayer === null &&
          typeof buzz === 'function'
        ) {
          buzz(idx);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'answers', filter: `room_id=eq.${room.id}` },
      (payload) => {
        const a = payload.new;
        const idx = players.findIndex((p) => p.id === a.player_id);
        if (idx === -1) return;

        // On n'accepte la reponse que si ce joueur est bien celui qui a buzze
        if (
          typeof activePlayer !== 'undefined' && activePlayer === idx &&
          typeof currentScreen !== 'undefined' && currentScreen === 'gameScreen'
        ) {
          const btn = Array.from(document.querySelectorAll('#answersGrid .ans-btn'))
            .find((b) => b.dataset.val === a.answer_text);
          if (btn && typeof answerClick === 'function') {
            answerClick(btn);
          }
        }
      }
    )
    .subscribe();
}

function startBroadcastLoop(room) {
  let lastSnapshot = '';

  setInterval(() => {
    try {
      const state = buildLiveState();
      const snapshot = JSON.stringify(state);
      if (snapshot === lastSnapshot) return; // rien de nouveau, on n'ecrit pas pour rien
      lastSnapshot = snapshot;
      updateLiveState(room.id, state);
    } catch (err) {
      // silencieux: le jeu local n'est peut-etre pas encore charge
    }
  }, 800);
}

function buildLiveState() {
  const screen = typeof currentScreen !== 'undefined' ? currentScreen : null;

  const state = {
    screen,
    qIndex: typeof qIndex !== 'undefined' ? qIndex : null,
    qCounter: document.getElementById('qCounter')?.textContent || '',
    questionText: document.getElementById('questionText')?.textContent || '',
    diffLabel: document.getElementById('diffBadge')?.textContent || '',
    timeLeft: typeof timeLeft !== 'undefined' ? timeLeft : null,
    maxTime: typeof maxTime !== 'undefined' ? maxTime : null,
    activePlayerIdx: typeof activePlayer !== 'undefined' ? activePlayer : null,
    choices: [],
    revealed: false,
    correctText: null,
    scores: [],
  };

  const buttons = document.querySelectorAll('#answersGrid .ans-btn');
  buttons.forEach((btn) => {
    const letterEl = btn.querySelector('.ans-letter');
    state.choices.push({
      letter: letterEl ? letterEl.textContent : '',
      text: btn.dataset.val || '',
    });
    if (btn.classList.contains('correct')) {
      state.revealed = true;
      state.correctText = btn.dataset.val;
    }
  });

  if (typeof players !== 'undefined' && Array.isArray(players)) {
    state.scores = players.map((p) => ({ name: p.name, score: p.score, correct: p.correct, wrong: p.wrong }));
  }

  return state;
}
