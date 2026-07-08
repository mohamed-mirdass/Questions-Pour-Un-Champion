/* ============================================================
   DATA.JS — Données du jeu (questions) + persistance (localStorage)
   Aucune manipulation du DOM ici : uniquement données et stockage.
   ============================================================ */

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
  try { localStorage.setItem('qpuc_coins', JSON.stringify(data)); }
  catch (e) { /* storage full/blocked — game continues, just won't persist this update */ }
  updateCoinsDisplay();
}
function addCoins(amount) {
  const data = getCoinsData();
  saveCoins(data.coins + amount);
  if (amount > 0) SFX.coins();
}
function spendCoins(amount) {
  const data = getCoinsData();
  if (data.coins < amount) return false;
  saveCoins(data.coins - amount);
  return true;
}
function getCoins() { return getCoinsData().coins; }
function getHistory() {
  try { return JSON.parse(localStorage.getItem('qpuc_history') || '[]'); }
  catch(e) { return []; }
}
function addHistory(entry) {
  const h = getHistory();
  h.unshift(entry);
  if (h.length > 20) h.pop();
  try { localStorage.setItem('qpuc_history', JSON.stringify(h)); }
  catch (e) { /* storage full/blocked — non-fatal, match result still displayed on screen */ }
}
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

