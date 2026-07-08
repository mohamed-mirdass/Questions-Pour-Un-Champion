# Questions pour un Champion

Jeu de quiz multijoueur (buzzer local S/D/K/L, manches Paris & Rapidité, Tournoi, Mission) développé en JavaScript vanilla (HTML/CSS/JS), sans framework ni bundler.

Projet 3pH — PISTE, Semestre 2, HESTIM Cycle Ingénieur 2025/2026.

**Démo en ligne** : _(lien Vercel à compléter par le groupe)_

## Sommaire
- [Lancer le projet en local](#lancer-le-projet-en-local)
- [Architecture du code](#architecture-du-code)
- [Fonctionnalités implémentées](#fonctionnalités-implémentées)
- [Algorithme de difficulté adaptative](#algorithme-de-difficulté-adaptative)
- [Équipe](#équipe)

## Lancer le projet en local

Le jeu est 100% statique (pas de build, pas de serveur backend). Deux façons de le lancer :

1. **Le plus simple** : ouvrir `index.html` directement dans un navigateur.
2. **Recommandé** (évite les soucis de CORS avec `fetch()` sur `data/questions.json`) :
   ```bash
   npx serve .
   # ou
   python3 -m http.server 8080
   ```
   puis ouvrir `http://localhost:8080`.

Aucune dépendance à installer, aucune variable d'environnement nécessaire.

## Architecture du code

Le JavaScript est découpé en modules à responsabilité unique, chargés dans cet ordre précis (voir la balise `<script>` en bas de chaque page HTML) :

| Fichier | Rôle | Contient |
|---|---|---|
| `assets/js/router.js` | Navigation entre pages | Mise en surbrillance du lien actif |
| `assets/js/data.js` | **Données** | Banque de questions, pool de questions (mélange + anti-répétition), lecture/écriture localStorage (coins, historique, sauvegarde de partie) |
| `assets/js/tts.js` | **Audio / Quizmaster** | Synthèse vocale (TTS), effets sonores (SFX, Web Audio API), personnage Quizmaster (animations, répliques) |
| `assets/js/state.js` | **État partagé** | Variables globales de la partie en cours (joueurs, scores, timers, index de question) |
| `assets/js/ui.js` | **Interface** | Rendu des écrans, scoreboard, timer visuel, toasts, graphiques Chart.js — aucune règle de jeu ici |
| `assets/js/game.js` | **Logique métier** | Déroulement de partie, buzzer, validation des réponses, manches Paris/Rapidité, jokers, mission, mini-jeu, recommandations |
| `assets/js/app.js` | **Point d'entrée** | Câblage entre modules (sauvegarde auto, événements aléatoires), initialisation de la page |
| `assets/js/tournament.js` | **Mode Tournoi** | Bracket, demi-finales, finale, classement — module indépendant, dédié à `tournament.html` |

Cette séparation suit le principe **données / logique métier / interface utilisateur** : `data.js` ne touche jamais au DOM, `ui.js` ne contient aucune règle de jeu, `game.js` orchestre les deux.

> Historique : le projet tenait auparavant dans un unique fichier `app.js` (~2200 lignes). Il a été refactorisé en modules distincts sans changer le comportement (même ordre d'exécution, mêmes variables globales) — voir le commit `refactor: split app.js into modules`.

## Fonctionnalités implémentées

- **Génération de questions** : mélange aléatoire, aucune répétition dans une même partie, banque de 480 questions (JSON externe avec repli sur une banque intégrée si le fetch échoue).
- **Difficulté adaptative** en temps réel (voir section dédiée ci-dessous).
- **Score avancé** : bonus de rapidité, malus de mauvaise réponse, feedback visuel (Quizmaster, popups) et sonore (voix TTS + effets sonores synthétisés).
- **Manche Paris** : mise de points avant la question, gain/perte de la mise.
- **Manche Rapidité** : premier à buzzer répond, bonus/malus dédiés.
- **Mode Tournoi** : bracket à 4 joueurs, demi-finales, match 3ᵉ place, finale, statistiques détaillées par joueur **et par match**.
- **Jokers** : 50/50, élimination de 2 réponses, révélation de la réponse.
- **Mini-jeu bonus** (Code Chrono) : jeu de mémoire de séquences à temps limité.
- **Événements aléatoires** : bonus vitesse, double points, temps bonus, mélange des réponses, coins gratuits.
- **Historique, recommandations automatiques, sauvegarde/reprise de partie**.
- **Statistiques graphiques** (Chart.js) : évolution des scores, répartition par thème.
- **Buzzer tactile par joueur** (en plus des touches S/D/K/L) — utilisable au clavier ou au tactile/souris, un bouton par joueur.

## Algorithme de difficulté adaptative

La difficulté (temps de réponse alloué) est recalculée **en continu**, à partir du taux de réussite global de la partie :

```js
function getAdaptiveTime() {
  const total = totalCorrect + totalWrong;
  if (total < 3) return 30;           // pas assez de données -> facile
  const rate = totalCorrect / total;
  if (rate > 0.75) return 12;         // > 75% de réussite -> difficile (12s)
  if (rate > 0.50) return 20;         // > 50% de réussite -> moyen (20s)
  return 30;                          // sinon -> facile (30s)
}
```

Le badge de difficulté et la couleur du chronomètre suivent le même calcul (`getDifficultyLabel()`), donnant un retour visuel immédiat aux joueurs. Le score bénéficie indirectement de cet ajustement : moins de temps disponible réduit la fenêtre pour obtenir le bonus de rapidité, donc la difficulté influence à la fois le temps **et** la valeur potentielle du score.

## Équipe

| Nom | Rôle |
|---|---|
| _À compléter_ | Dev principal |
| _À compléter_ | Chef de groupe |
| _À compléter_ | Dev frontend |
| _À compléter_ | Dev CSS |
| _À compléter_ | ... |
| _À compléter_ | ... |
