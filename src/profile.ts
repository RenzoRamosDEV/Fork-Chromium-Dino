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

  // Avatar por archivo
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      profile.avatarDataUrl = dataUrl;
      saveProfile(profile);
      setAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  });

  // Mostrar score guardado al cargar
  updateScore();

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

  // Detectar game over vía clase "crashed" y leer distanceRan del Runner
  const waitForContainer = setInterval(() => {
    const container = document.querySelector('.runner-container');
    if (!container) return;
    clearInterval(waitForContainer);

    let wasCrashed = false;
    new MutationObserver(() => {
      const crashed = container.classList.contains('crashed');
      if (crashed && !wasCrashed) {
        wasCrashed = true;
        try {
          const runner = (window as any).Runner?.getInstance?.();
          const raw = runner ? Math.ceil(runner.distanceRan) : 0;
          const display = Math.round(raw * 0.025);
          const lastEl = document.getElementById('profile-last-score');
          if (lastEl) lastEl.textContent = String(display).padStart(5, '0');
        } catch {}
      } else if (!crashed) {
        wasCrashed = false;
      }
    }).observe(container, { attributes: true, attributeFilter: ['class'] });
  }, 200);
}
