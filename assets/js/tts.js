/* ============================================================
   TTS.JS — Voix du Quizmaster (Text-to-Speech), effets sonores (SFX)
   et personnage Quizmaster (QM). Regroupe tout le feedback audio/visuel
   lié au Quizmaster, requis par le cahier des charges (feedback sonore).
   ============================================================ */
 
/* ============================================================
   TEXT-TO-SPEECH  (queue-based — no more glitch/skip)
   ============================================================ */
const TTS = {
  voice: null,
  ready: false,
  allVoices: [],
  _queue: [],
  _busy: false,
 
  init() {
    const load = () => {
      const voices = speechSynthesis.getVoices();
      this.allVoices = voices;
      this.ready = true;
      this._populateSelector(voices);
      const maleKw = ['thomas','nicolas','male','homme','pierre','paul','jean'];
      const frVoices = voices.filter(v => v.lang.startsWith('fr'));
      const picked =
        frVoices.find(v => maleKw.some(k => v.name.toLowerCase().includes(k))) ||
        frVoices[0] ||
        voices.find(v => maleKw.some(k => v.name.toLowerCase().includes(k))) ||
        voices[0] || null;
      this.voice = picked;
      const sel = document.getElementById('voiceSelect');
      if (sel && picked) sel.value = picked.name;
    };
    if (speechSynthesis.getVoices().length > 0) load();
    speechSynthesis.onvoiceschanged = load;
  },
 
  _populateSelector(voices) {
    const sel = document.getElementById('voiceSelect');
    if (!sel) return;
    sel.innerHTML = '';
    const fr = voices.filter(v => v.lang.startsWith('fr'));
    const other = voices.filter(v => !v.lang.startsWith('fr'));
    if (fr.length) {
      const grp = document.createElement('optgroup');
      grp.label = '🇫🇷 Français';
      fr.forEach(v => {
        const o = document.createElement('option');
        o.value = v.name;
        o.textContent = v.name + (v.localService ? ' ✓' : ' ☁');
        grp.appendChild(o);
      });
      sel.appendChild(grp);
    }
    if (other.length) {
      const grp = document.createElement('optgroup');
      grp.label = '🌍 Autres';
      other.forEach(v => {
        const o = document.createElement('option');
        o.value = v.name;
        o.textContent = `[${v.lang}] ${v.name}`;
        grp.appendChild(o);
      });
      sel.appendChild(grp);
    }
    sel.onchange = () => {
      this.voice = this.allVoices.find(v => v.name === sel.value) || null;
    };
  },
 
  /* speak() clears any pending speech and starts this one fresh */
  speak(text, rate=0.95, pitch=0.78, onFinish=null) {
    if (!this.ready || !text) return;
    this._queue = [];
    this._busy = false;
    this._onFinish = onFinish;
    speechSynthesis.cancel();
    if (speechSynthesis.paused) speechSynthesis.resume(); // known Android Chrome bug: stays paused after cancel()
    this._queue.push({text, rate, pitch});
    setTimeout(() => this._playNext(), 150);
  },
 
  _playNext() {
    if (this._queue.length === 0) {
      this._busy = false;
      if (this._onFinish) { const cb = this._onFinish; this._onFinish = null; cb(); }
      return;
    }
    if (speechSynthesis.speaking) return;
    this._busy = true;
    const {text, rate, pitch} = this._queue.shift();
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice  = this.voice;
    utter.lang   = this.voice ? this.voice.lang : 'fr-FR';
    utter.rate   = rate;
    utter.pitch  = pitch;
    utter.volume = 1;
    utter.onend  = () => { this._busy = false; this._playNext(); };
    utter.onerror = () => { this._busy = false; this._playNext(); };
    speechSynthesis.speak(utter);
  },
 
  stop() {
    this._queue = [];
    this._busy  = false;
    speechSynthesis.cancel();
  }
};
TTS.init();
 
function testVoice() {
  TTS.speak('Bonjour ! Je suis le Quizmaster. Bonne chance à tous !', 0.95, 0.78);
}
 
/* ============================================================
   SFX — game sound effects (Web Audio API synth, no mp3 files needed)
   Feedback sonore requis par le cahier des charges, en plus de la
   voix TTS du Quizmaster : buzz, bonne/mauvaise réponse, victoire, tick.
   ============================================================ */
const SFX = {
  ctx: null,
  muted: false,
  _ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, duration = 0.15, type = 'sine', vol = 0.2, delay = 0) {
    if (this.muted) return;
    try {
      const ctx = this._ensureCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime + delay;
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.start(t0);
      osc.stop(t0 + duration + 0.03);
    } catch (e) { /* audio not available — fail silently, never block gameplay */ }
  },
  buzz()    { this.tone(880, 0.08, 'square', 0.15); },
  correct() { this.tone(523.25, 0.12, 'sine', 0.2); this.tone(783.99, 0.15, 'sine', 0.2, 0.1); },
  wrong()   { this.tone(196, 0.28, 'sawtooth', 0.16); },
  tick()    { this.tone(1000, 0.05, 'square', 0.06); },
  coins()   { this.tone(1318.5, 0.08, 'triangle', 0.15); this.tone(1567.98, 0.1, 'triangle', 0.15, 0.06); },
  victory() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.2, 'sine', 0.2, i * 0.12)); },
  setMuted(v) { this.muted = v; try { localStorage.setItem('qpuc_sfx_muted', v ? '1' : '0'); } catch (e) {} },
  loadPref() { try { this.muted = localStorage.getItem('qpuc_sfx_muted') === '1'; } catch (e) {} }
};
SFX.loadPref();
 
/* ============================================================
   QUIZMASTER CHARACTER
   ============================================================ */
const QM = {
  wrap: null, bubble: null, char: null, mouth: null, browL: null, browR: null,
  init() {
    this.wrap  = document.getElementById('quizmaster-wrap');
    this.bubble= document.getElementById('qmBubble');
    this.char  = document.getElementById('qmChar');
    this.mouth = document.getElementById('qmMouth');
    this.browL = document.getElementById('qmBrowL');
    this.browR = document.getElementById('qmBrowR');
  },
  show() {
    if (!this.wrap) this.init();
    this.wrap.style.display = 'flex';
    this.wrap.style.animation = 'qmSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards';
  },
  hide() {
    if (!this.wrap) return;
    TTS.stop();
    this.wrap.style.animation = 'qmSlideOut 0.4s ease forwards';
    setTimeout(() => { if(this.wrap) this.wrap.style.display = 'none'; }, 420);
  },
  _setFace(type) {
    if (!this.char) this.init();
    if (!this.char) return;
    if (type === 'happy') {
      this.char.classList.remove('qm-sad'); this.char.classList.add('qm-happy');
    } else if (type === 'sad') {
      this.char.classList.remove('qm-happy'); this.char.classList.add('qm-sad');
    } else if (type === 'excited') {
      this.char.classList.remove('qm-sad'); this.char.classList.add('qm-happy');
    } else {
      this.char.classList.remove('qm-happy','qm-sad');
    }
  },
  say(msg, type='', speak=true) {
    if (!this.wrap) this.init();
    if (this.wrap.style.display !== 'flex') this.show();
    if (!this.bubble) return;
    this.bubble.textContent = msg;
    this.bubble.className = 'qm-bubble ' + type;
    this.bubble.style.animation = 'none';
    void this.bubble.offsetWidth;
    this.bubble.style.animation = 'qmBubblePop 0.35s cubic-bezier(0.34,1.56,0.64,1)';
 
    if (type === 'correct-msg') this._setFace('happy');
    else if (type === 'wrong-msg' || type === 'time-msg') this._setFace('sad');
    else if (type === 'buzz-msg') this._setFace('excited');
 
    else this._setFace('neutral');
 
    if (speak) {
      // Strip all emoji unicode ranges, then collapse extra spaces
      const clean = msg
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u2600-\u27BF]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      TTS.speak(clean, 1.05, 1.1);
    }
  },
  readQuestion(q, onDone) {
    const txt = `Question : ${q}`;
    if (!this.bubble) return;
    this.bubble.textContent = `Question : ${q}`;
    this.bubble.className = 'qm-bubble';
    this.bubble.style.animation = 'none';
    void this.bubble.offsetWidth;
    this.bubble.style.animation = 'qmBubblePop 0.35s cubic-bezier(0.34,1.56,0.64,1)';
    this._setFace('neutral');
    TTS.speak(txt, 0.92, 0.78, onDone || null);
  }
};
 
// Quizmaster messages
const QM_BUZZ_MSGS   = name => [`${name} a buzzé en premier !`, `C'est ${name} qui répond !`, `${name} prend la parole !`];
const QM_CORRECT     = name => [`Bravo ${name} ! C'est la bonne réponse !`, `Excellent ${name}, parfait !`, `${name} marque des points !`];
const QM_WRONG       = name => [`Non ${name}, mauvaise réponse !`, `Raté ${name}, dommage !`, `Ce n'est pas ça ${name} !`];
const QM_TIMEOUT_MSG = ['Personne n\'a répondu, temps écoulé !', 'Trop lent, le temps est passé !', 'Le chrono est terminé !'];
const QM_START_MSG   = ['Que la meilleure équipe gagne !', 'Bonne chance à tous, buzzez vite !', 'C\'est parti, le quiz commence !'];
const QM_JOKER_50    = name => `${name} élimine une mauvaise réponse !`;
const QM_JOKER_70    = name => `${name} élimine deux mauvaises réponses !`;
const QM_JOKER_100   = name => `${name} révèle la bonne réponse !`;
const rand = arr => arr[Math.floor(Math.random()*arr.length)];
