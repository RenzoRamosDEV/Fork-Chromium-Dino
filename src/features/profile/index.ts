// Perfil del jugador: nombre, avatar, código único y visualización de scores.
// El código de 90 caracteres identifica al jugador en Supabase y permite
// recuperar la cuenta desde otro dispositivo usando "Login con código".
import { supabase } from '../leaderboard/supabase.js';

// Clave de localStorage donde se guarda el objeto de perfil serializado
const STORAGE_KEY = 'dino_profile';

interface Profile {
  name: string;
  avatarDataUrl: string;
}

function loadProfile(): Profile {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return { name: '', avatarDataUrl: '' };
  }
}

function saveProfile(profile: Profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// Genera un código aleatorio de 90 caracteres alfanuméricos usando
// crypto.getRandomValues para garantizar aleatoriedad criptográfica.
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(90)))
    .map(b => chars[b % chars.length])
    .join('');
}

export function getPlayerCode(): string {
  let code = localStorage.getItem('dino-player-code');
  if (!code) {
    code = generateCode();
    localStorage.setItem('dino-player-code', code);
  }
  return code;
}

function setAvatar(dataUrl: string) {
  const img = document.getElementById('profile-avatar') as HTMLImageElement;
  const placeholder = document.getElementById('profile-avatar-placeholder')!;
  if (dataUrl) {
    img.src = dataUrl;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.style.display = 'none';
    placeholder.style.display = 'block';
  }
}

const DISTANCE_COEFFICIENT = 0.025;

function updateScore() {
  const scoreEl = document.getElementById('profile-score')!;
  const raw = parseInt(localStorage.getItem('dino-high-score') || '0', 10);
  const display = Math.round(raw * DISTANCE_COEFFICIENT);
  scoreEl.textContent = String(display).padStart(5, '0');
}

export function initProfile() {
  const nameInput = document.getElementById('profile-name-input') as HTMLInputElement;
  const avatarWrap = document.getElementById('profile-avatar-wrap')!;
  const fileInput = document.getElementById('profile-upload-file') as HTMLInputElement;

  // Clic en el cuadrado del avatar abre el selector de archivo
  avatarWrap.addEventListener('click', () => fileInput.click());

  const profile = loadProfile();

  // Restaurar nombre
  if (profile.name) nameInput.value = profile.name;

  // Restaurar avatar
  if (profile.avatarDataUrl) setAvatar(profile.avatarDataUrl);

  // Guardar nombre al escribir
  nameInput.addEventListener('input', () => {
    profile.name = nameInput.value;
    saveProfile(profile);
  });

  // Avatar por archivo — sube al Storage de Supabase y guarda la URL pública
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    // Mostrar preview local inmediato
    const reader = new FileReader();
    reader.onload = (e) => setAvatar(e.target?.result as string);
    reader.readAsDataURL(file);

    // Subir a Supabase Storage
    const ext = file.name.split('.').pop();
    const fileName = `avatar_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (!error && data) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
      profile.avatarDataUrl = urlData.publicUrl;
    } else {
      // Fallback: guardar base64 local si falla el upload
      const r2 = new FileReader();
      r2.onload = (e) => { profile.avatarDataUrl = e.target?.result as string; saveProfile(profile); };
      r2.readAsDataURL(file);
      return;
    }
    saveProfile(profile);
  });

  // Mostrar score guardado al cargar
  updateScore();

  // Mostrar código de perfil
  const code = getPlayerCode();
  const codeEl = document.getElementById('profile-code-value');
  if (codeEl) codeEl.textContent = code;

  document.getElementById('profile-code-copy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(code);
    const btn = document.getElementById('profile-code-copy')!;
    btn.textContent = '¡Copiado!';
    setTimeout(() => btn.textContent = 'Copiar', 2000);
  });

  // Login con código
  const loginBtn    = document.getElementById('profile-login-btn')!;
  const loginForm   = document.getElementById('profile-login-form')!;
  const loginInput  = document.getElementById('profile-login-input') as HTMLInputElement;
  const loginSubmit = document.getElementById('profile-login-submit')!;
  const loginMsg    = document.getElementById('profile-login-msg')!;

  loginBtn.addEventListener('click', () => {
    const visible = loginForm.style.display !== 'none';
    loginForm.style.display = visible ? 'none' : 'flex';
  });

  loginSubmit.addEventListener('click', async () => {
    const inputCode = loginInput.value.trim();
    if (!inputCode) return;

    loginMsg.textContent = 'Buscando...';
    const { data, error } = await supabase
      .from('scores')
      .select('nombre, avatar_url, score, codigo')
      .eq('codigo', inputCode)
      .limit(1);

    if (error || !data || data.length === 0) {
      loginMsg.textContent = '❌ Código no encontrado';
      return;
    }

    const row = data[0];

    // Restaurar código
    localStorage.setItem('dino-player-code', inputCode);
    if (codeEl) codeEl.textContent = inputCode;

    // Restaurar nombre
    nameInput.value = row.nombre;
    profile.name = row.nombre;

    // Restaurar avatar
    if (row.avatar_url) {
      profile.avatarDataUrl = row.avatar_url;
      setAvatar(row.avatar_url);
    }

    // Restaurar score
    const rawScore = Math.round(row.score / 0.025);
    localStorage.setItem('dino-high-score', String(rawScore));
    updateScore();

    saveProfile(profile);
    loginMsg.textContent = '✅ Cuenta restaurada';
    loginForm.style.display = 'none';
    loginInput.value = '';
  });

  // Hacer el avatar cuadrado con el mismo alto que la columna de info
  const info = document.getElementById('profile-info')!;
  const wrap = document.getElementById('profile-avatar-wrap')!;
  const syncSize = () => {
    const h = info.offsetHeight;
    wrap.style.width = `${h}px`;
    wrap.style.height = `${h}px`;
  };
  requestAnimationFrame(syncSize);
  new ResizeObserver(syncSize).observe(info);

  // Esperar a que el Runner cree el contenedor y luego observar game over
  const waitForContainer = setInterval(() => {
    const container = document.querySelector('.runner-container');
    if (!container) return;
    clearInterval(waitForContainer);

    let wasCrashed = false;

    // Al detectar clase "crashed", leer distanceRan del Runner y mostrar última puntuación
    new MutationObserver(() => {
      const crashed = container.classList.contains('crashed');
      if (crashed && !wasCrashed) {
        wasCrashed = true;
        try {
          const runner = (window as any).Runner?.getInstance?.();
          const raw = runner ? Math.ceil(runner.distanceRan) : 0;
          const display = Math.round(raw * DISTANCE_COEFFICIENT);
          const lastEl = document.getElementById('profile-last-score');
          if (lastEl) lastEl.textContent = String(display).padStart(5, '0');
        } catch {}
      } else if (!crashed) {
        wasCrashed = false;
      }
    }).observe(container, { attributes: true, attributeFilter: ['class'] });
  }, 200);
}
