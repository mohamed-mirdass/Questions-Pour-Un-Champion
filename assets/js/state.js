/* ============================================================
   STATE.JS — État global mutable de la partie en cours
   (scores, joueurs, index de question, timers, etc.)
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

