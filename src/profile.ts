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
  const urlInput = document.getElementById('profile-url-input') as HTMLInputElement;
  const fileInput = document.getElementById('profile-upload-file') as HTMLInputElement;

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

  // Avatar por URL al presionar Enter
  urlInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const url = urlInput.value.trim();
    if (!url) return;
    profile.avatarDataUrl = url;
    saveProfile(profile);
    setAvatar(url);
    urlInput.value = '';
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
}
