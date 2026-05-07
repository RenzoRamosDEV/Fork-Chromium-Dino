# 🔲 Pendiente de Implementar

Funcionalidades que **no están bloqueantes** para jugar, pero que faltan respecto
al juego original de Chrome o que mejorarían la experiencia standalone.

---

## 🔴 Alta prioridad

### 1. High Score persistente con `localStorage`

**Problema:** El récord se guarda en memoria (variable `highestScore` de Runner)
y se pierde al recargar la página.

**En Chrome:** se sincroniza con el perfil del usuario vía `window.errorPageController.updateEasterEggHighScore()`.

**Solución standalone sugerida:** interceptar las llamadas a `errorPageController`
creando un objeto `window.errorPageController` falso en `standalone.ts` que
use `localStorage`:

```typescript
// En standalone.ts, antes de initializeInstance():
window.errorPageController = {
  updateEasterEggHighScore(score: number) {
    localStorage.setItem('dino-high-score', String(score));
  },
  resetEasterEggHighScore() {
    localStorage.removeItem('dino-high-score');
  },
  // El resto de métodos no aplican en standalone:
  downloadButtonClick() {},
  reloadButtonClick() {},
  detailsButtonClick() {},
  diagnoseErrorsButtonClick() {},
  portalSigninButtonClick() {},
  savePageForLater() {},
  cancelSavePage() {},
  trackEasterEgg() {},
};

// Restaurar el high score guardado tras inicializar Runner:
const saved = localStorage.getItem('dino-high-score');
if (saved) {
  window.initializeEasterEggHighScore(parseInt(saved, 10));
}
```

---

## 🟡 Media prioridad

### 2. Soporte para móvil / pantallas táctiles

**Estado actual:** El juego detecta correctamente si es móvil (`IS_MOBILE`) y
crea el `touchController` al primer touch. Debería funcionar, pero no está
probado en dispositivos reales.

**Pendiente:**
- Verificar que el `touchController` (div de pantalla completa) se superpone correctamente con el CSS de standalone
- Comprobar que el `preventDefault()` en `onKeyDown` evita el scroll en iOS/Android
- Ajustar `font-size` y `padding` del `standalone.css` para pantallas pequeñas

### 3. Favicon y metadatos

**Estado actual:** No hay favicon ni metadatos Open Graph.

**Pendiente:**
- Añadir `<link rel="icon">` con el sprite del dino recortado
- Añadir `<meta name="description">` para compartir en redes

---

## 🟢 Baja prioridad / Opcionales

### 4. Modo accesibilidad (audio cues)

**Estado:** El código de `GeneratedSoundFx` y `hasAudioCues` está intacto.
Se activa cuando el usuario hace foco en el canvas (click sin jugar aún).

**Pendiente:**
- Verificar que el checkbox de velocidad lenta (`.slow-speed-option`) se muestra correctamente con el CSS de standalone
- Probar el flujo completo con lector de pantalla

### 5. Modo arcade (`chrome://dino`)

**Estado:** `Runner.isArcadeMode()` comprueba si `document.title` empieza
por `chrome://dino/`. En standalone este modo no se activa.

**Pendiente (si se quiere):**
- Cambiar el título de la página a `chrome://dino/` en standalone para que el juego ocupe toda la pantalla
- O reemplazar la comprobación por una URL/flag propio

### 6. Soporte gamepad

**Estado:** El código de gamepad está completo en `offline.ts` (detecta `gamepadconnected`
y mapea botones a keyEvents). Solo aplica en `isArcadeMode()`.

**Pendiente:**
- Habilitar el gamepad fuera del modo arcade si se desea

### 7. Modo alternativo (skins de eventos especiales)

**Estado:** La arquitectura está preparada con `GAME_TYPE`, `enableAltGameMode`,
`spriteDefinitionByType`. En el build base está vacío (`GAME_TYPE = []`).

**Pendiente:**
- Crear un sprite sheet alternativo y registrarlo en `offline_sprite_definitions.ts`
- Añadir `enableAltGameMode: true` y `altGameType: '1'` a `loadTimeData.data` en `standalone.ts`

### 8. Tests

**Estado:** No hay ningún test automatizado.

**Pendiente:**
- Añadir Vitest (compatible con Vite) para tests unitarios de lógica de colisiones,
  física del salto y DistanceMeter
- Añadir Playwright para tests end-to-end del flujo de juego

---

## 📝 Notas

- Los avisos de TypeScript sobre `substr` deprecado en `distance_meter.ts`
  son **hints** (no errores). El build funciona. Se pueden corregir reemplazando
  `.substr(start, length)` por `.slice(start, start + length)`.
- Las vulnerabilidades de `npm audit` son de devDependencies (Vite) y no afectan
  al código del juego en producción.
