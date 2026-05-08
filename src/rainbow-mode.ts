const RAINBOW_HI_REQUIRED = 2000;
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

  function updateButtonState() {
    const raw = parseInt(localStorage.getItem('dino-high-score') || '0', 10);
    const hi = Math.round(raw * DISTANCE_COEFFICIENT);
    btn.disabled = hi < RAINBOW_HI_REQUIRED;
    if (btn.disabled && rainbowActive) {
      stopRainbow();
      btn.classList.remove('rainbow-active');
    }
  }

  updateButtonState();

  // Recheck cuando cambia el high score
  const origUpdate = (window as any).errorPageController?.updateEasterEggHighScore;
  const observer = new MutationObserver(updateButtonState);
  observer.observe(document.getElementById('profile-score')!, { childList: true, characterData: true, subtree: true });

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
