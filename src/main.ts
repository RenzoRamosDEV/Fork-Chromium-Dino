// Punto de entrada de Dinochorme.
// Inicializa el Runner del juego y todas las features propias:
// perfil de jugador, leaderboard, selector de color y modo rainbow.

import { Runner } from './core/offline.js';
import { loadTimeData } from './mocks/load_time_data.js';
import { initColorPicker } from './features/color/index.js';
import { initProfile } from './features/profile/index.js';
import { initRainbowMode } from './features/rainbow/index.js';
import { initLeaderboard } from './features/leaderboard/index.js';

declare global {
  interface Window {
    // Callback que el Runner asigna internamente para restaurar el high score.
    initializeEasterEggHighScore: (score: number) => void;
    // Controlador de la error page de Chrome; en standalone se mockea abajo.
    errorPageController?: {
      downloadButtonClick(): void;
      reloadButtonClick(url?: string): void;
      detailsButtonClick(): void;
      diagnoseErrorsButtonClick(): void;
      portalSigninButtonClick(): void;
      savePageForLater(): void;
      cancelSavePage(): void;
      updateEasterEggHighScore(score: number): void;
      resetEasterEggHighScore(): void;
      trackEasterEgg(): void;
    };
  }
}

// Poblar loadTimeData ANTES de instanciar Runner.
// Runner lo lee en su constructor para detectar si el juego está deshabilitado
// o si debe activar un modo alternativo.
loadTimeData.data = {
  dinoGameA11yAriaLabel: 'Dino Game',
  dinoGameA11yDescription: 'Press Space or tap to play',
  dinoGameA11yGameOver: 'Game Over. Score: $1',
  dinoGameA11yHighScore: 'High Score: $1',
  dinoGameA11yJump: 'Press Space to jump',
  dinoGameA11yStartGame: 'Game started',
  dinoGameA11ySpeedToggle: 'Slow speed',
  dinoGameInstructionsKeyboard: 'Press Space to play',
  dinoGameInstructionsTouch: 'Tap to play',
  dinoGameInstructionsHybrid: 'Press Space or tap to play',
  dinoGameA11yAriaLabelKeyboard: 'Press Space to play Dino Game',
  dinoGameA11yAriaLabelTouch: 'Tap to play Dino Game',
  dinoGameA11yAriaLabelHybrid: 'Press Space or tap to play Dino Game',
  // NO incluir 'disabledEasterEgg' ni 'enableAltGameMode' para que el juego arranque normal
};

// Mock de errorPageController para persistir el high score en localStorage.
// En Chrome real, C++ llama a updateEasterEggHighScore al superar el récord.
// Aquí reemplazamos ese puente para que funcione en standalone.
window.errorPageController = {
  updateEasterEggHighScore(score: number) {
    localStorage.setItem('dino-high-score', String(score));
    const el = document.getElementById('profile-score');
    if (el) el.textContent = String(Math.round(score * 0.025)).padStart(5, '0');
  },
  resetEasterEggHighScore() {
    localStorage.removeItem('dino-high-score');
  },
  downloadButtonClick() {},
  reloadButtonClick() {},
  detailsButtonClick() {},
  diagnoseErrorsButtonClick() {},
  portalSigninButtonClick() {},
  savePageForLater() {},
  cancelSavePage() {},
  trackEasterEgg() {},
};

document.addEventListener('DOMContentLoaded', () => {
  Runner.initializeInstance('.interstitial-wrapper');

  // Restaurar HI guardado y activar sincronización con localStorage.
  // Debe llamarse siempre (con 0 si no hay récord) para que el juego
  // llame a updateEasterEggHighScore al superar el récord.
  const savedScore = parseInt(localStorage.getItem('dino-high-score') ?? '0', 10);
  window.initializeEasterEggHighScore(savedScore);

  // Exponer Runner globalmente para que profile y leaderboard lean distanceRan
  (window as any).Runner = Runner;

  initColorPicker();
  initProfile();
  initRainbowMode();
  initLeaderboard();
});
