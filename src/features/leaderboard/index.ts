// Leaderboard global: guarda scores en Supabase y los muestra en tiempo real.
// Cada jugador tiene un código único (ver features/profile) que actúa como ID.
// Solo se guarda cuando el score actual supera el mejor registrado del jugador.
import { supabase } from './supabase.js';
import { getPlayerCode } from '../profile/index.js';

// El Runner almacena distanceRan en unidades internas; este coeficiente
// convierte esa distancia al número visible en pantalla.
const DISTANCE_COEFFICIENT = 0.025;

export async function saveScore(score: number) {
  const name = (document.getElementById('profile-name-input') as HTMLInputElement)?.value?.trim();
  const avatar = document.getElementById('profile-avatar') as HTMLImageElement;
  // Solo incluir avatar si está visible (el jugador subió una imagen)
  const avatarUrl = avatar?.style.display !== 'none' ? avatar?.src : '';
  if (!name || score <= 0) return;

  const codigo = getPlayerCode();

  // Buscar registro existente por código único del jugador
  const { data: existing } = await supabase
    .from('scores')
    .select('score')
    .eq('codigo', codigo)
    .limit(1);

  const bestSoFar = existing?.[0]?.score ?? 0;

  // No guardar si no se superó el mejor score previo
  if (score <= bestSoFar) return;

  if (bestSoFar === 0) {
    // Primera vez que juega: insertar nuevo registro
    const { error } = await supabase.from('scores').insert({
      nombre: name,
      avatar_url: avatarUrl || null,
      score,
      codigo,
      fecha: new Date().toISOString(),
    });
    if (error) console.error('Supabase insert error:', error);
  } else {
    // Ya tiene registro: actualizar con el nuevo HI
    const { error } = await supabase.from('scores')
      .update({ nombre: name, score, avatar_url: avatarUrl || null, fecha: new Date().toISOString() })
      .eq('codigo', codigo);
    if (error) console.error('Supabase update error:', error);
  }
}

export async function loadLeaderboard() {
  const { data, error } = await supabase
    .from('scores')
    .select('nombre, avatar_url, score')
    .order('score', { ascending: false })
    .limit(15);

  if (error) console.error('Supabase load error:', error);

  const list = document.getElementById('leaderboard-list');
  if (!list || !data) return;

  list.innerHTML = data.map((row, i) => `
    <div class="lb-row">
      <span class="lb-rank">${i + 1}</span>
      ${row.avatar_url
        ? `<img class="lb-avatar" src="${row.avatar_url}" alt="">`
        : `<div class="lb-avatar lb-avatar-placeholder">?</div>`}
      <span class="lb-name">${row.nombre}</span>
      <span class="lb-score">${String(row.score).padStart(5, '0')}</span>
    </div>
  `).join('');
}

export function initLeaderboard() {
  loadLeaderboard();

  // Suscripción en tiempo real: refresca ante INSERT y UPDATE
  supabase
    .channel('scores')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, loadLeaderboard)
    .subscribe();

  // Esperar a que el Runner cree el contenedor del juego en el DOM
  const waitForContainer = setInterval(() => {
    const container = document.querySelector('.runner-container');
    if (!container) return;
    clearInterval(waitForContainer);

    let wasCrashed = false;

    // Detectar game over observando la clase "crashed" del contenedor
    new MutationObserver(() => {
      const crashed = container.classList.contains('crashed');
      if (crashed && !wasCrashed) {
        wasCrashed = true;
        try {
          const runner = (window as any).Runner?.getInstance?.();
          const raw = runner ? Math.ceil(runner.distanceRan) : 0;
          const score = Math.round(raw * DISTANCE_COEFFICIENT);
          if (score > 0) saveScore(score);
        } catch {}
      } else if (!crashed) {
        wasCrashed = false;
      }
    }).observe(container, { attributes: true, attributeFilter: ['class'] });
  }, 200);
}
