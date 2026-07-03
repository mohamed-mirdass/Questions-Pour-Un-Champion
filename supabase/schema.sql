create extension if not exists "pgcrypto";

create type visibility_scope as enum ('public', 'private', 'friends');
create type mission_cadence as enum ('daily', 'weekly', 'seasonal');
create type friendship_status as enum ('pending', 'accepted', 'rejected', 'blocked');
create type room_type as enum ('quick_match', 'private_room', 'tournament', 'spectator');
create type tournament_status as enum ('draft', 'open', 'live', 'completed', 'cancelled');
create type shop_item_type as enum ('quiz_master', 'avatar', 'theme', 'buzzer', 'frame', 'title', 'joker', 'animation', 'emoji_pack', 'victory_effect', 'sound_pack', 'bundle');
create type moderation_status as enum ('clean', 'flagged', 'under_review', 'rejected', 'approved');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  country_code text not null default 'MA',
  preferred_language text not null default 'en',
  favorite_language text,
  current_quiz_master_id uuid,
  level integer not null default 1,
  xp integer not null default 0,
  coins integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'dark',
  tts_language text not null default 'en',
  tts_voice text,
  tts_speed numeric(4,2) not null default 1.00,
  tts_gender text,
  music_volume integer not null default 70,
  sfx_volume integer not null default 80,
  reduced_motion boolean not null default false,
  high_contrast boolean not null default false,
  color_blind_mode text,
  font_scale numeric(4,2) not null default 1.00,
  updated_at timestamptz not null default now()
);

create table public.quiz_masters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  voice_label text not null,
  unlock_level integer not null default 7,
  base_price integer,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  item_type shop_item_type not null,
  name text not null,
  slug text unique not null,
  rarity text not null,
  price_coins integer not null,
  unlock_level integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  shop_item_id uuid not null references public.shop_items(id) on delete cascade,
  equipped boolean not null default false,
  purchased_at timestamptz not null default now(),
  unique(user_id, shop_item_id)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  language text not null,
  difficulty text not null,
  cover_image_url text,
  visibility visibility_scope not null default 'private',
  version integer not null default 1,
  estimated_duration_seconds integer not null default 300,
  moderation moderation_status not null default 'clean',
  source_type text not null default 'manual',
  ai_generated boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_tags (
  id bigserial primary key,
  name text unique not null
);

create table public.quiz_tag_map (
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  tag_id bigint not null references public.quiz_tags(id) on delete cascade,
  primary key (quiz_id, tag_id)
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  prompt text not null,
  explanation text,
  question_order integer not null,
  time_limit_seconds integer not null default 20,
  points integer not null default 100,
  unique(quiz_id, question_order)
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer_text text not null,
  is_correct boolean not null default false,
  answer_order integer not null,
  unique(question_id, answer_order)
);

create table public.quiz_ratings (
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (quiz_id, user_id)
);

create table public.quiz_comments (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(requester_id, addressee_id)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  room_code text unique not null,
  room_type room_type not null,
  title text not null,
  is_ranked boolean not null default false,
  max_players integer not null default 4,
  quiz_id uuid references public.quizzes(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  seat_index integer,
  is_spectator boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete set null,
  quiz_id uuid references public.quizzes(id) on delete set null,
  mode text not null,
  category text,
  status text not null default 'completed',
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_ms bigint,
  created_at timestamptz not null default now()
);

create table public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  final_rank integer,
  score integer not null default 0,
  coins_earned integer not null default 0,
  xp_earned integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  fastest_reaction_ms integer,
  average_reaction_ms integer
);

create table public.match_question_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  question_id uuid references public.quiz_questions(id) on delete set null,
  player_id uuid references public.match_players(id) on delete set null,
  event_type text not null,
  reaction_ms integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  cadence mission_cadence not null,
  reward_coins integer not null,
  reward_xp integer not null,
  criteria jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create table public.user_missions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  progress numeric not null default 0,
  completed_at timestamptz,
  reset_at timestamptz,
  primary key (user_id, mission_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text not null,
  reward_coins integer not null default 0,
  reward_xp integer not null default 0
);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  status tournament_status not null default 'draft',
  banner_url text,
  branding jsonb not null default '{}'::jsonb,
  prize_pool jsonb not null default '{}'::jsonb,
  premium_options jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.tournament_participants (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  seed integer,
  final_rank integer,
  primary key (tournament_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  room_id uuid references public.rooms(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null,
  moderation moderation_status not null default 'clean',
  created_at timestamptz not null default now()
);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  subject_user_id uuid references public.profiles(id) on delete cascade,
  snapshot_date date not null,
  rank integer not null,
  xp integer not null,
  win_rate numeric(5,2),
  average_reaction_ms integer,
  unique(scope, subject_user_id, snapshot_date)
);

create index idx_quizzes_creator on public.quizzes(creator_id);
create index idx_quizzes_visibility on public.quizzes(visibility, moderation);
create index idx_match_players_match on public.match_players(match_id);
create index idx_match_events_match on public.match_question_events(match_id, created_at);
create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_leaderboard_scope_date on public.leaderboard_snapshots(scope, snapshot_date desc);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_inventory enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_comments enable row level security;
alter table public.quiz_ratings enable row level security;
alter table public.friendships enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.notifications enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles are readable by everyone" on public.profiles
  for select using (true);

create policy "users manage own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "users manage own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "public quizzes are readable" on public.quizzes
  for select using (visibility = 'public' or creator_id = auth.uid());

create policy "creators manage own quizzes" on public.quizzes
  for all using (creator_id = auth.uid()) with check (creator_id = auth.uid());

create policy "users manage own inventory" on public.user_inventory
  for select using (auth.uid() = user_id);

create policy "friends visible to participants" on public.friendships
  for select using (auth.uid() in (requester_id, addressee_id));

create policy "participants read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
