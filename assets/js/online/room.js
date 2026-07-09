// assets/js/online/room.js
// Room logic: Host creates a room / Players join a room

import { supabase } from './supabaseClient.js';

function generateRoomCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateHostSecret() {
  return crypto.randomUUID();
}

export async function createRoom() {
  const code = generateRoomCode();
  const hostSecret = generateHostSecret();

  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert({ code, host_secret: hostSecret, status: 'lobby' })
      .select()
      .single();

    if (error) throw error;

    localStorage.setItem('qpc_host_secret', hostSecret);
    localStorage.setItem('qpc_room_id', data.id);

    return { room: data, hostSecret };
  } catch (err) {
    console.error('[createRoom] failed:', err);
    throw new Error('Could not create the room. Check your internet connection and try again.');
  }
}

export async function joinRoom(code, playerName) {
  if (!code || !playerName?.trim()) {
    throw new Error('Please enter both a room code and a name.');
  }

  try {
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (roomErr || !room) {
      throw new Error('Invalid code, or the room does not exist.');
    }

    if (room.status === 'finished') {
      throw new Error('This game has already ended.');
    }

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: playerName.trim() })
      .select()
      .single();

    if (playerErr) throw playerErr;

    localStorage.setItem('qpc_player_id', player.id);
    localStorage.setItem('qpc_room_id', room.id);

    return { room, player };
  } catch (err) {
    console.error('[joinRoom] failed:', err);
    throw err instanceof Error ? err : new Error('Something went wrong, please try again.');
  }
}

export function subscribeToRoom(roomId, callbacks = {}) {
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
      (payload) => callbacks.onPlayersChange?.(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => callbacks.onRoomChange?.(payload)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'buzzes', filter: `room_id=eq.${roomId}` },
      (payload) => callbacks.onBuzz?.(payload)
    )
    .subscribe();

  return channel; // call supabase.removeChannel(channel) when done
}

export async function getPlayers(roomId) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[getPlayers] failed:', err);
    return [];
  }
}
