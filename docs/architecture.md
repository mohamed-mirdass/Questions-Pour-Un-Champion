# Quiz Arena Architecture

## Frontend
- Stack: React + Vite + TypeScript.
- State strategy for the next phase: local UI state for shell interactions, Supabase-backed async data layer for auth, profile, rooms, chat, creator assets, and match persistence.
- Routing strategy: dashboard-shell SPA with page modules for Home, Play, Tournament, Missions, History, Leaderboards, Mini Games, Statistics, Shop, Rules, Settings, Profile, Friends, and Quiz Creator.
- Realtime UX targets: room presence, invites, notifications, chat, score sync, buzz events, tournament brackets.

## Supabase services
- Auth: email/password plus OAuth providers Google, Facebook, Apple.
- Postgres: normalized core game, social, economy, creator, and moderation data.
- Realtime: rooms, online matches, chat, notifications, and live tournament state.
- Storage: quiz covers, tournament banners, creator imports, avatar assets, cosmetic previews.
- Edge Functions: AI quiz generation orchestration, transcript/document ingestion, moderation workflows, anti-cheat validation, webhook-safe economy operations.

## Match architecture
- Local multiplayer runs fully client-side with deterministic keyboard or touch input capture and match history persistence.
- Online multiplayer uses room state, authoritative event logs, idempotent scoring updates, reconnect tokens, and spectator-safe subscriptions.
- Match data should be append-only at the event layer, then summarized into match/player snapshot tables for fast profile queries.

## Security and scale
- Row Level Security on every user-owned or room-scoped table.
- Service role access limited to Edge Functions and admin workflows.
- Economy and premium actions should flow through server-side functions, never direct client writes.
- Store reaction time in milliseconds and never trust client-scored ranked results without validation.

## Recommended next implementation steps
1. Wire React screens to a real router and Supabase auth session handling.
2. Split page modules into feature folders with reusable UI primitives.
3. Implement room presence, invite flow, and match event subscriptions.
4. Add creator ingestion pipelines and admin moderation dashboards.
