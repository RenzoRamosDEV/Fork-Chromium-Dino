// Entry point standalone del juego del dinosaurio.
// Reemplaza a neterror.ts, que dependía del sistema de error pages de Chrome.
// Este archivo inicializa el juego directamente sin lógica de página de error.

import {Runner} from './game/offline.js';
import {loadTimeData} from './mocks/load_time_data.js';
import {initColorPicker} from './color-picker.js';
import {initProfile} from './profile.js';
import {initRainbowMode} from './rainbow-mode.js';
import {initLeaderboard} from './leaderboard.js';

// ─── Declaraciones de tipos para propiedades de Window usadas en offline.ts ──
// En el build original estas las declaraba neterror.ts; al no usarlo, las
// declaramos aquí para que TypeScript no proteste.
declare global {
  interface Window {
    // Callback que C++ llama al cargar la página para restaurar el high score.
    // En standalone no se llama desde fuera, pero Runner lo asigna internamente.
    initializeEasterEggHighScore: (score: number) => void;
    // Controlador de la error page de Chrome. En standalone no existe;
    // offline.ts lo usa siempre dentro de guards `if (window.errorPageController)`.
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

// ─── Poblar loadTimeData ANTES de instanciar Runner ──────────────────────────
// Runner lee loadTimeData en su constructor para detectar si el juego está
// deshabilitado (disabledEasterEgg) o si hay un modo alternativo (enableAltGameMode).
// Es importante que este bloque se ejecute antes de la llamada a initializeInstance.
loadTimeData.data = {
  // ── Strings de accesibilidad (usadas por lectores de pantalla) ──────────
  // En standalone no es crítico que sean perfectas, pero las proveemos
  // para que el juego funcione en modo a11y si se activa.
  dinoGameA11yAriaLabel: 'Dino Game',
  dinoGameA11yDescription: 'Press Space or tap to play',
  dinoGameA11yGameOver: 'Game Over. Score: $1',
  dinoGameA11yHighScore: 'High Score: $1',
  dinoGameA11yJump: 'Press Space to jump',
  dinoGameA11yStartGame: 'Game started',
  dinoGameA11ySpeedToggle: 'Slow speed',

  // ── Instrucciones de inicio según tipo de dispositivo ────────────────────
  // Runner las usa para cambiar el mensaje del encabezado antes de que empiece
  // el juego (teclado, táctil o híbrido).
  dinoGameInstructionsKeyboard: 'Press Space to play',
  dinoGameInstructionsTouch: 'Tap to play',
  dinoGameInstructionsHybrid: 'Press Space or tap to play',
  dinoGameA11yAriaLabelKeyboard: 'Press Space to play Dino Game',
  dinoGameA11yAriaLabelTouch: 'Tap to play Dino Game',
  dinoGameA11yAriaLabelHybrid: 'Press Space or tap to play Dino Game',

  // ── NOTA: NO incluir estas keys para que el juego funcione normalmente ───
  // 'disabledEasterEgg' → si existiera, mostraría un snackbar y no arrancaría.
  // 'enableAltGameMode' → si existiera, intentaría cargar sprites alternativos.
};

// ─── Mock de errorPageController para persistir el high score ────────────────
// En Chrome, C++ llama a updateEasterEggHighScore() cada vez que se supera el
// récord. En standalone reemplazamos ese puente con localStorage.
// offline.ts siempre guarda estos calls dentro de `if (window.errorPageController)`,
// por lo que basta con asignar este objeto antes de que Runner arranque.
window.errorPageController = {
  updateEasterEggHighScore(score: number) {
    localStorage.setItem('dino-high-score', String(score));
    const el = document.getElementById('profile-score');
    if (el) el.textContent = String(Math.round(score * 0.025)).padStart(5, '0');
  },
  resetEasterEggHighScore() {
    localStorage.removeItem('dino-high-score');
  },
  // Los siguientes métodos son solo del error-page de Chrome; no aplican aquí.
  downloadButtonClick() {},
  reloadButtonClick() {},
  detailsButtonClick() {},
  diagnoseErrorsButtonClick() {},
  portalSigninButtonClick() {},
  savePageForLater() {},
  cancelSavePage() {},
  trackEasterEgg() {},
};

// ─── Inicializar el juego cuando el DOM esté listo ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // '.interstitial-wrapper' debe existir en index.html como contenedor raíz.
  // Runner crea dentro de él el canvas y todos los elementos de UI del juego.
  Runner.initializeInstance('.interstitial-wrapper');

  // Restaurar el high score guardado y activar la sincronización con localStorage.
  // initializeEasterEggHighScore() activa internamente syncHighestScore=true,
  // que habilita las llamadas a errorPageController.updateEasterEggHighScore()
  // al superar el récord. Debe llamarse siempre (con 0 si no hay récord guardado)
  // para que el juego sincronice desde el primer crash.
  const savedScore = parseInt(localStorage.getItem('dino-high-score') ?? '0', 10);
  window.initializeEasterEggHighScore(savedScore);

  (window as any).Runner = Runner;

  initColorPicker();
  initProfile();
  initRainbowMode();
  console.log('Iniciando leaderboard...');
  initLeaderboard();
  console.log('Leaderboard iniciado');
});
