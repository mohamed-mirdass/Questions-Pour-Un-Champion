// assets/js/online/room.js
// منطق: إنشاء غرفة (Host) / الانضمام لغرفة (Player)

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
    console.error('[createRoom] فشل إنشاء الغرفة:', err);
    throw new Error('ما قدرناش نخلقو الغرفة. تأكد من الاتصال بالانترنت وعاود.');
  }
}

export async function joinRoom(code, playerName) {
  if (!code || !playerName?.trim()) {
    throw new Error('خاصك تدخل الكود والاسم.');
  }
  try {
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();
    if (roomErr || !room) {
      throw new Error('الكود غير صحيح، ولا الغرفة ماكاينتش.');
    }
    if (room.status === 'finished') {
      throw new Error('هاد الجولة سالات.');
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
    console.error('[joinRoom] فشل الانضمام:', err);
    throw err instanceof Error ? err : new Error('وقع مشكل، عاود المحاولة.');
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
  return channel;
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
    console.error('[getPlayers] فشل جلب اللاعبين:', err);
    return [];
  }
}
