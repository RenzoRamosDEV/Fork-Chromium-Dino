// Modo rainbow: cicla el filtro hue-rotate del canvas en cada frame.
// Se desbloquea al llegar a HI >= 5000 o escribiendo el easter egg en el nombre.
// Se pausa automáticamente en game over y se reanuda al reiniciar.

// HI mínimo para desbloquear el modo rainbow de forma normal
const RAINBOW_HI_REQUIRED = 5000;
// Nombre exacto que activa el easter egg sin necesidad de llegar al HI
const EASTER_EGG_CODE = 'X180904250507X';
const DISTANCE_COEFFICIENT = 0.025;

let rainbowActive = false;
let rafId: number | null = null;
let hue = 0;

function applyRainbow() {
  const canvas = document.querySelector<HTMLElement>('.runner-canvas');
  if (!canvas) return;
  hue = (hue + 1.5) % 360;
  canvas.style.filter = `sepia(1) hue-rotate(${hue - 30}deg) saturate(5) brightness(1.0)`;
}

function startRainbow() {
  rainbowActive = true;
  const tick = () => {
    applyRainbow();
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function stopRainbow() {
  rainbowActive = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  const canvas = document.querySelector<HTMLElement>('.runner-canvas');
  if (canvas) canvas.style.filter = '';
}

export function initRainbowMode() {
  const btn = document.getElementById('cp-especial') as HTMLButtonElement;
  if (!btn) return;

  const nameInput = document.getElementById('profile-name-input') as HTMLInputElement;

  function isUnlocked(): boolean {
    const raw = parseInt(localStorage.getItem('dino-high-score') || '0', 10);
    const hi = Math.round(raw * DISTANCE_COEFFICIENT);
    return hi >= RAINBOW_HI_REQUIRED || nameInput?.value === EASTER_EGG_CODE;
  }

  function updateButtonState() {
    const unlocked = isUnlocked();
    btn.disabled = !unlocked;
    if (!unlocked && rainbowActive) {
      stopRainbow();
      btn.classList.remove('rainbow-active');
    }
  }

  updateButtonState();

  // Recheck cuando cambia el high score
  const observer = new MutationObserver(updateButtonState);
  observer.observe(document.getElementById('profile-score')!, { childList: true, characterData: true, subtree: true });

  // Recheck cuando cambia el nombre
  nameInput?.addEventListener('input', updateButtonState);

  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    if (rainbowActive) {
      stopRainbow();
      btn.classList.remove('rainbow-active');
    } else {
      startRainbow();
      btn.classList.add('rainbow-active');
    }
  });

  // Pausar rainbow cuando hay game over, reanudar al reiniciar
  const waitForContainer = setInterval(() => {
    const container = document.querySelector('.runner-container');
    if (!container) return;
    clearInterval(waitForContainer);

    new MutationObserver(() => {
      const crashed = container.classList.contains('crashed');
      if (crashed && rainbowActive && rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!crashed && rainbowActive && rafId === null) {
        const tick = () => {
          applyRainbow();
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      }
    }).observe(container, { attributes: true, attributeFilter: ['class'] });
  }, 200);
}
