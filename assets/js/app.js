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
    this._queue.push({text, rate, pitch});
    setTimeout(() => this._playNext(), 80);
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


const questions = [
  // -------- MUSIQUE --------
  {theme:'Musique',level:'Débutant',q:'Quel instrument a des touches blanches et noires ?',a:['Guitare','Batterie','Violon','Piano'],correct:'Piano'},
  {theme:'Musique',level:'Débutant',q:'Combien de notes principales en musique ?',a:['5','6','7','8'],correct:'7'},
  {theme:'Musique',level:'Débutant',q:'Quel instrument a des cordes ?',a:['Flûte','Trompette','Batterie','Guitare'],correct:'Guitare'},
  {theme:'Musique',level:'Débutant',q:'Quel instrument frappe-t-on ?',a:['Piano','Guitare','Batterie','Violon'],correct:'Batterie'},
  {theme:'Musique',level:'Débutant',q:'Quel instrument souffle-t-on ?',a:['Piano','Guitare','Flûte','Batterie'],correct:'Flûte'},
  {theme:'Musique',level:'Débutant',q:'Quel est un genre musical ?',a:['Table','Rap','Stylo','Livre'],correct:'Rap'},
  {theme:'Musique',level:'Débutant',q:'Une chanson a souvent :',a:['Une page','Un refrain','Un dessin','Une carte'],correct:'Un refrain'},
  {theme:'Musique',level:'Débutant',q:'Quel instrument est électrique ?',a:['Violon','Flûte','Guitare électrique','Tambour'],correct:'Guitare électrique'},
  {theme:'Musique',level:'Débutant',q:'Le micro sert à :',a:['Écouter','Amplifier la voix','Écrire','Dessiner'],correct:'Amplifier la voix'},
  {theme:'Musique',level:'Débutant',q:'La musique est un :',a:['Sport','Métier seulement','Art','Jeu vidéo'],correct:'Art'},
  {theme:'Musique',level:'Débutant',q:'Quel instrument est petit et portatif ?',a:['Piano','Batterie','Harmonica','Contrebasse'],correct:'Harmonica'},
  {theme:'Musique',level:'Débutant',q:'La musique peut accompagner :',a:['Le silence','La danse','Le sommeil','Le calcul'],correct:'La danse'},
  {theme:'Musique',level:'Débutant',q:'Où écoute-t-on souvent de la musique ?',a:['Bibliothèque','Radio','École','Banque'],correct:'Radio'},
  {theme:'Musique',level:'Débutant',q:'Qui chante avec sa voix ?',a:['Un guitariste','Un chanteur','Un batteur','Un DJ'],correct:'Un chanteur'},
  {theme:'Musique',level:'Débutant',q:'Qui écrit une chanson ?',a:['Peintre','Compositeur','Médecin','Sportif'],correct:'Compositeur'},
  {theme:'Musique',level:'Débutant',q:'La musique peut rendre :',a:['Triste seulement','Fatigué','Heureux','Malade'],correct:'Heureux'},
  {theme:'Musique',level:'Débutant',q:'Quel est le symbole musical ?',a:['Lettre','Nombre','Note','Image'],correct:'Note'},
  {theme:'Musique',level:'Débutant',q:'La musique se compose de :',a:['Mots','Images','Sons','Nombres'],correct:'Sons'},
  {theme:'Musique',level:'Intermédiaire',q:'Combien de touches possède un piano classique ?',a:['72','76','88','90'],correct:'88'},
  {theme:'Musique',level:'Intermédiaire',q:'Qui est le compositeur de la 5ᵉ symphonie ?',a:['Mozart','Bach','Beethoven','Chopin'],correct:'Beethoven'},
  {theme:'Musique',level:'Intermédiaire',q:'Quel style musical est né aux États-Unis ?',a:['Flamenco','Raï','Jazz','Reggae'],correct:'Jazz'},
  {theme:'Musique',level:'Intermédiaire',q:'Qui chante "Thriller" ?',a:['Prince','Elvis Presley','Michael Jackson','Drake'],correct:'Michael Jackson'},
  {theme:'Musique',level:'Intermédiaire',q:'Une portée musicale contient :',a:['3 lignes','4 lignes','5 lignes','6 lignes'],correct:'5 lignes'},
  {theme:'Musique',level:'Intermédiaire',q:'Le reggae vient de :',a:['États-Unis','France','Jamaïque','Brésil'],correct:'Jamaïque'},
  {theme:'Musique',level:'Intermédiaire',q:'Le tempo indique :',a:['Le volume','La durée','La vitesse','La hauteur'],correct:'La vitesse'},
  {theme:'Musique',level:'Intermédiaire',q:'Quel instrument appartient aux cuivres ?',a:['Violon','Flûte','Trompette','Piano'],correct:'Trompette'},
  {theme:'Musique',level:'Intermédiaire',q:'Quel genre est associé à Bob Marley ?',a:['Rock','Jazz','Reggae','Blues'],correct:'Reggae'},
  {theme:'Musique',level:'Intermédiaire',q:'Quel genre musical est électronique ?',a:['Classique','Jazz','Techno','Blues'],correct:'Techno'},
  {theme:'Musique',level:'Professionnel',q:'Combien de demi-tons dans une octave ?',a:['10','12','14','8'],correct:'12'},
  {theme:'Musique',level:'Professionnel',q:'La gamme pentatonique a combien de notes ?',a:['4','5','6','7'],correct:'5'},
  {theme:'Musique',level:'Professionnel',q:'Le mode dorien appartient aux modes :',a:['Majeurs','Mineurs','Grecs','Arabes'],correct:'Grecs'},
  {theme:'Musique',level:'Professionnel',q:'BPM signifie :',a:['Beats Per Minute','Bass Per Mix','Barre Par Mesure','Aucun'],correct:'Beats Per Minute'},
  // -------- SPORT --------
  {theme:'Sport',level:'Débutant',q:'Combien de joueurs dans une équipe de foot ?',a:['9','10','11','12'],correct:'11'},
  {theme:'Sport',level:'Débutant',q:'Combien de sets pour gagner au tennis (Grand Chelem homme) ?',a:['2','3','4','5'],correct:'3'},
  {theme:'Sport',level:'Débutant',q:'Dans quel sport nage-t-on ?',a:['Tennis','Natation','Foot','Basketball'],correct:'Natation'},
  {theme:'Sport',level:'Débutant',q:'Couleurs du drapeau olympique ?',a:['3','4','5','6'],correct:'5'},
  {theme:'Sport',level:'Débutant',q:'Quel sport utilise une raquette et un volant ?',a:['Tennis','Badminton','Ping-pong','Squash'],correct:'Badminton'},
  {theme:'Sport',level:'Débutant',q:'Combien de points vaut un panier à 3 points au basket ?',a:['1','2','3','4'],correct:'3'},
  {theme:'Sport',level:'Débutant',q:'Durée d\'un match de football ?',a:['80 min','90 min','100 min','120 min'],correct:'90 min'},
  {theme:'Sport',level:'Débutant',q:'Quel sport se joue avec un ballon ovale ?',a:['Football','Rugby','Basketball','Volleyball'],correct:'Rugby'},
  {theme:'Sport',level:'Intermédiaire',q:'Record du monde du 100m ?',a:['9.58s','9.63s','9.72s','9.81s'],correct:'9.58s'},
  {theme:'Sport',level:'Intermédiaire',q:'Tour de France : combien d\'étapes environ ?',a:['15','18','21','25'],correct:'21'},
  {theme:'Sport',level:'Intermédiaire',q:'Ballon d\'or 2023 ?',a:['Mbappé','Haaland','Modric','Bellingham'],correct:'Bellingham'},
  {theme:'Sport',level:'Intermédiaire',q:'Hauteur du filet au volleyball ?',a:['2,24m','2,43m','2,55m','2,70m'],correct:'2,43m'},
  {theme:'Sport',level:'Intermédiaire',q:'Pays hôte JO 2024 ?',a:['Japon','USA','France','Australie'],correct:'France'},
  {theme:'Sport',level:'Professionnel',q:'Hauteur du panier de basket ?',a:['3,00m','3,05m','3,10m','3,15m'],correct:'3,05m'},
  {theme:'Sport',level:'Professionnel',q:'Épreuves du décathlon ?',a:['8','9','10','12'],correct:'10'},
  {theme:'Sport',level:'Professionnel',q:'"Triple-double" dans quel sport ?',a:['Football','Basketball','Baseball','Hockey'],correct:'Basketball'},
  {theme:'Sport',level:'Professionnel',q:'Vainqueur CAN 2021 ?',a:['Sénégal','Égypte','Cameroun','Algérie'],correct:'Sénégal'},
  // -------- HISTOIRE-GEO --------
  {theme:'Histoire-Géo',level:'Débutant',q:'Capitale de la France ?',a:['Lyon','Marseille','Paris','Nice'],correct:'Paris'},
  {theme:'Histoire-Géo',level:'Débutant',q:'Quel continent est le plus grand ?',a:['Amérique','Afrique','Asie','Europe'],correct:'Asie'},
  {theme:'Histoire-Géo',level:'Débutant',q:'Combien de continents sur Terre ?',a:['5','6','7','8'],correct:'7'},
  {theme:'Histoire-Géo',level:'Débutant',q:'Quel est le plus long fleuve du monde ?',a:['Nil','Amazone','Congo','Mississippi'],correct:'Nil'},
  {theme:'Histoire-Géo',level:'Débutant',q:'Quel pays a la plus grande superficie ?',a:['Canada','Chine','USA','Russie'],correct:'Russie'},
  {theme:'Histoire-Géo',level:'Débutant',q:'Capitale du Maroc ?',a:['Casablanca','Marrakech','Rabat','Fès'],correct:'Rabat'},
  {theme:'Histoire-Géo',level:'Intermédiaire',q:'Quelle année a commencé la 1ère Guerre Mondiale ?',a:['1910','1912','1914','1916'],correct:'1914'},
  {theme:'Histoire-Géo',level:'Intermédiaire',q:'Quel mur est tombé en 1989 ?',a:['Mur de Chine','Mur de Berlin','Mur de Jéricho','Mur de Rome'],correct:'Mur de Berlin'},
  {theme:'Histoire-Géo',level:'Intermédiaire',q:'Combien de pays dans l\'Union Européenne ?',a:['24','25','27','30'],correct:'27'},
  {theme:'Histoire-Géo',level:'Intermédiaire',q:'Quel empire était gouverné par Napoléon ?',a:['Ottoman','Romain','Français','Britannique'],correct:'Français'},
  {theme:'Histoire-Géo',level:'Professionnel',q:'Quel traité a mis fin à la 1ère GM ?',a:['Versailles','Westphalie','Paris','Vienne'],correct:'Versailles'},
  {theme:'Histoire-Géo',level:'Professionnel',q:'Première civilisation à utiliser l\'écriture ?',a:['Égyptiens','Sumériens','Grecs','Romains'],correct:'Sumériens'},
  {theme:'Histoire-Géo',level:'Professionnel',q:'Capital du Kazakhstan ?',a:['Almaty','Astana','Nur-Sultan','Shymkent'],correct:'Astana'},
  // -------- ANIMAUX --------
  {theme:'Animaux',level:'Débutant',q:'Quel animal miaule ?',a:['Chien','Chat','Vache','Cheval'],correct:'Chat'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal a une trompe ?',a:['Lion','Éléphant','Tigre','Zèbre'],correct:'Éléphant'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal peut voler ?',a:['Vache','Aigle','Serpent','Dauphin'],correct:'Aigle'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal vit dans la mer ?',a:['Chat','Souris','Dauphin','Lion'],correct:'Dauphin'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal rugit ?',a:['Chat','Lion','Lapin','Panda'],correct:'Lion'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal a des plumes ?',a:['Oiseau','Chat','Tortue','Chèvre'],correct:'Oiseau'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal a une carapace ?',a:['Tortue','Chat','Chien','Lion'],correct:'Tortue'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal vit dans une ruche ?',a:['Fourmi','Guêpe','Abeille','Mouche'],correct:'Abeille'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal peut changer de couleur ?',a:['Zèbre','Caméléon','Panda','Singe'],correct:'Caméléon'},
  {theme:'Animaux',level:'Débutant',q:'Quel animal est rayé ?',a:['Lion','Zèbre','Ours','Singe'],correct:'Zèbre'},
  {theme:'Animaux',level:'Intermédiaire',q:'Plus grand mammifère terrestre ?',a:['Rhinocéros','Hippopotame','Girafe','Éléphant d\'Afrique'],correct:'Éléphant d\'Afrique'},
  {theme:'Animaux',level:'Intermédiaire',q:'Animal qui régénère son corps ?',a:['Serpent','Étoile de mer','Tortue','Grenouille'],correct:'Étoile de mer'},
  {theme:'Animaux',level:'Intermédiaire',q:'Animal utilisant l\'écholocation ?',a:['Aigle','Dauphin','Serpent','Requin'],correct:'Dauphin'},
  {theme:'Animaux',level:'Intermédiaire',q:'Animal qui dort debout ?',a:['Chien','Cheval','Chat','Lapin'],correct:'Cheval'},
  {theme:'Animaux',level:'Intermédiaire',q:'Animal électrique ?',a:['Requin','Anguille électrique','Dauphin','Pieuvre'],correct:'Anguille électrique'},
  {theme:'Animaux',level:'Intermédiaire',q:'Animal célèbre pour sa mémoire ?',a:['Lion','Chien','Éléphant','Girafe'],correct:'Éléphant'},
  {theme:'Animaux',level:'Intermédiaire',q:'Animal qui survit le plus sans eau ?',a:['Chien','Cheval','Chameau','Vache'],correct:'Chameau'},
  {theme:'Animaux',level:'Professionnel',q:'Animal biologiquement immortel ?',a:['Méduse Turritopsis','Étoile de mer','Hydre','Corail'],correct:'Méduse Turritopsis'},
  {theme:'Animaux',level:'Professionnel',q:'Animal à trois cœurs ?',a:['Requin','Pieuvre','Dauphin','Crocodile'],correct:'Pieuvre'},
  {theme:'Animaux',level:'Professionnel',q:'Seul mammifère volant ?',a:['Écureuil volant','Chauve-souris','Oiseau-lyre','Colugo'],correct:'Chauve-souris'},
  {theme:'Animaux',level:'Professionnel',q:'Animal survivant dans l\'espace ?',a:['Fourmi','Cafard','Tardigrade','Scorpion'],correct:'Tardigrade'},
  {theme:'Animaux',level:'Professionnel',q:'Animal avec la morsure la plus puissante ?',a:['Lion','Requin blanc','Crocodile marin','Hippopotame'],correct:'Crocodile marin'},
];

/* ============================================================
   STATE
   ============================================================ */
let selectedLevel = null, selectedTheme = null;
let selectedGameMode = 'normal'; // 'normal', 'bet', 'speed', 'mixed'

// Bet state
let playerBets = [0,0,0,0];
let betTimerInterval = null;
let betTimeLeft = 15;

// Speed round state  
let speedBuzzed = null;
let speedBuzzTimestamp = [null,null,null,null];

// Round tracking (for mixed mode)
let roundNumber = 0;
let roundType = 'normal'; // current round type

// Malus: -1 pt for wrong answer (if player buzzed)
const WRONG_PENALTY = 1;
let players = []; // {name, score, coins, correct, wrong}
let gameQuestions = [];
let qIndex = 0;
let activePlayer = null;
let timerInterval = null;
let questionReadTimeout = null;
let timeLeft = 0;
let maxTime = 30;
let adaptiveStreak = [0,0,0,0]; // per player correct streak
let totalCorrect = 0, totalWrong = 0;
let gameActive = false;
let jokerUsed = {50:false, 70:false, 100:false}; // per question
let currentScreen = 'homeScreen';

// Mission state
let missionQuestions = [];
let missionIndex = 0;
let missionStreak = 0;
let missionCoinsEarned = 0;
let missionTimer = null;
let missionTimeLeft = 0;

const NORMAL_GAME_QUESTION_TARGET = 16;

function clearQuestionReadTimeout() {
  if (questionReadTimeout) {
    clearTimeout(questionReadTimeout);
    questionReadTimeout = null;
  }
}

function buildLongQuestionPool(theme, level, target = NORMAL_GAME_QUESTION_TARGET) {
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

  add(questions.filter(q => q.theme === theme && q.level === level));
  if (picked.length < target) add(questions.filter(q => q.theme === theme && q.level !== level));
  if (picked.length < target) add(questions.filter(q => q.theme !== theme && q.level === level));
  if (picked.length < target) add(questions);

  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  return picked.slice(0, Math.min(target, picked.length));
}

/* ============================================================
   COINS SYSTEM (localStorage, reset 24h)
   ============================================================ */
function getCoinsData() {
  try {
    const data = JSON.parse(localStorage.getItem('qpuc_coins') || '{"coins":0,"lastReset":0}');
    const now = Date.now();
    if (now - data.lastReset > 24 * 3600 * 1000) {
      data.coins = 0;
      data.lastReset = now;
      localStorage.setItem('qpuc_coins', JSON.stringify(data));
    }
    return data;
  } catch(e) { return {coins:0,lastReset:Date.now()}; }
}
function saveCoins(amount) {
  const data = getCoinsData();
  data.coins = Math.max(0, amount);
  localStorage.setItem('qpuc_coins', JSON.stringify(data));
  updateCoinsDisplay();
}
function addCoins(amount) {
  const data = getCoinsData();
  saveCoins(data.coins + amount);
}
function spendCoins(amount) {
  const data = getCoinsData();
  if (data.coins < amount) return false;
  saveCoins(data.coins - amount);
  return true;
}
function getCoins() { return getCoinsData().coins; }
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
function getHistory() {
  try { return JSON.parse(localStorage.getItem('qpuc_history') || '[]'); }
  catch(e) { return []; }
}
function addHistory(entry) {
  const h = getHistory();
  h.unshift(entry);
  if (h.length > 20) h.pop();
  localStorage.setItem('qpuc_history', JSON.stringify(h));
}
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
  const keys = ['S','K','D','L'];
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

  // Reset buzzer
  const buzzer = document.getElementById('buzzerBtn');
  buzzer.textContent = 'BUZZ!';
  buzzer.className = 'buzzer';

  document.getElementById('buzzerHint').textContent = 'Appuie sur S / K / D / L';
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

function timerTimeout() {
  clearQuestionReadTimeout();
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
  const map = {s:0, k:1, d:2, l:3};
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

function buzzClick() {
  // Click on the big buzzer — cycle through players (for touch)
  // Find first who hasn't buzzed this question — or just let keyboard handle
}

function buzz(pIdx) {
  clearQuestionReadTimeout();
  clearInterval(timerInterval);
  activePlayer = pIdx;
  highlightPlayer(pIdx);

  const buzzer = document.getElementById('buzzerBtn');
  buzzer.textContent = players[pIdx].name;
  buzzer.className = 'buzzer buzzed p'+((pIdx+1))+'-active';
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

  const buzzer = document.getElementById('buzzerBtn');
  buzzer.textContent = 'BUZZ!';
  buzzer.className = 'buzzer';
  document.getElementById('buzzerHint').textContent = 'Appuie sur S / K / D / L';
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

function buildScoreboardWithBets() {
  const sb = document.getElementById('scoreboard');
  const keys = ['S','K','D','L'];
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
function startSpeedRound() {
  const q = gameQuestions[qIndex];
  speedBuzzed = null;
  speedBuzzTimestamp = [null,null,null,null];

  document.getElementById('speedQuestion').textContent = q.q;
  document.getElementById('speedAnswerReveal').style.display = 'none';
  document.getElementById('speedHint').textContent = 'Appuie sur S / K / D / L pour buzzer !';

  // Build player buzzers
  const colors = ['p1','p2','p3','p4'];
  const keys = ['S','K','D','L'];
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
    btn.classList.add('correct');
    missionStreak++;
    // Coins: 15 base + streak bonus + speed bonus
    const speedBonus = Math.floor(missionTimeLeft / MISSION_TIME * 10);
    const streakBonus = missionStreak > 2 ? (missionStreak-2)*5 : 0;
    const earned = 15 + speedBonus + streakBonus;
    missionCoinsEarned += earned;
    addCoins(earned);
    toast(`OK  +${earned}coins`, 'coins', 1200);
  } else {
    btn.classList.add('wrong');
    btns.forEach(b => { if (b.textContent.trim() === q.correct) b.classList.add('correct'); });
    missionStreak = 0;
    toast('Non  Raté !', 'error', 1000);
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

function saveGameState() {
  if (!gameActive) return;
  try {
    const state = {
      players:        JSON.parse(JSON.stringify(players)),
      gameQuestions:  JSON.parse(JSON.stringify(gameQuestions)),
      qIndex,
      selectedTheme,
      selectedLevel,
      selectedGameMode,
      adaptiveStreak: [...adaptiveStreak],
      totalCorrect,
      totalWrong,
      roundNumber,
      savedAt: Date.now()
    };
    localStorage.setItem('qpuc_save', JSON.stringify(state));
    updateResumeBtnVisibility();
  } catch(e) { /* silently ignore */ }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem('qpuc_save');
    if (!raw) return null;
    const state = JSON.parse(raw);
    // Expire après 24h
    if (Date.now() - state.savedAt > 86400000) {
      localStorage.removeItem('qpuc_save');
      return null;
    }
    return state;
  } catch(e) { return null; }
}

function clearSavedState() {
  localStorage.removeItem('qpuc_save');
  updateResumeBtnVisibility();
}

function updateResumeBtnVisibility() {
  const btns = document.querySelectorAll('.resume-game-btn');
  const hasSave = !!loadSavedState();
  btns.forEach(btn => {
    btn.style.display = hasSave ? 'inline-flex' : 'none';
  });
}

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
