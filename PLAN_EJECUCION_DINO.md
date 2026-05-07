# 🦕 Plan de Ejecución — Dino Game Standalone

## ✅ Estado: Implementado y funcional

Build de producción: **✓ 0 errores · 21 módulos · 297 ms**

---

## 📋 ¿Qué se implementó?

Se siguió la **Opción A (Standalone)** del `IMPLEMENTATION_PLAN.md`: hacer el juego
jugable en cualquier navegador moderno **sin compilar Chromium**, reemplazando las
dependencias internas de Chrome por implementaciones propias.

---

## 🗂️ Archivos nuevos creados

### Sistema de build

| Archivo | Propósito |
|---|---|
| `package.json` | Define el proyecto npm y los scripts `dev`, `build`, `preview` |
| `vite.config.ts` | Configura Vite: root en `components/neterror/resources/`, salida en `dist/` |
| `tsconfig.json` | TypeScript con target ES2022, lib DOM+ES2022 (necesario para `Array.at()`) |

### Mocks de dependencias de Chrome

| Archivo | Reemplaza |
|---|---|
| `components/neterror/resources/mocks/assert.ts` | `chrome://resources/js/assert.js` |
| `components/neterror/resources/mocks/load_time_data.ts` | `chrome://resources/js/load_time_data.js` |

**`assert.ts`** — función que lanza `Error` si la condición es falsa. Usa la firma
`asserts condition` para que TypeScript haga narrowing de tipos igual que el original.

**`load_time_data.ts`** — objeto singleton con un store interno. Expone:
- `set data(obj)` — carga todos los valores de una vez (como hace C++ en Chrome)
- `getString(key)` — devuelve el valor como string
- `valueExists(key)` — comprueba si la clave existe (usado para feature flags)

### Entry point standalone

| Archivo | Propósito |
|---|---|
| `components/neterror/resources/index.html` | HTML de la aplicación standalone |
| `components/neterror/resources/standalone.ts` | Entry point TypeScript; inicializa el juego |
| `components/neterror/resources/standalone.css` | Estilos propios sin dependencias de Chrome |

**`index.html`** — contiene la estructura mínima que Runner necesita en el DOM:
- `.interstitial-wrapper` — contenedor raíz donde Runner inyecta el canvas
- `.icon-offline` — requerido por `Runner.init()` (lo oculta al arrancar)
- `#offline-resources-1x` / `#offline-resources-2x` — sprites del juego
- `<template id="audio-resources">` — elementos `<audio>` para efectos de sonido

**`standalone.ts`** — popula `loadTimeData.data` con las strings necesarias **antes**
de llamar a `Runner.initializeInstance('.interstitial-wrapper')`. El orden importa:
Runner lee `loadTimeData` en su constructor para detectar si el juego está deshabilitado.

---

## 🔧 Archivos del juego modificados

### Reemplazo de imports (10 archivos)

Todos los archivos de `dino_game/` que importaban de `chrome://resources/js/assert.js`
ahora importan de `../mocks/assert.js`:

```
dino_game/cloud.ts
dino_game/background_el.ts
dino_game/night_mode.ts
dino_game/horizon_line.ts
dino_game/distance_meter.ts
dino_game/game_over_panel.ts
dino_game/obstacle.ts
dino_game/horizon.ts
dino_game/trex.ts
dino_game/offline.ts  ← también loadTimeData
```

### Modificación en `offline.ts`

**Problema original:** `loadSounds()` asumía que los `<audio>` tenían `src` como
data URL base64 (formato que Chrome inyecta desde C++). En standalone, los `src`
son URLs HTTP normales → `atob()` lanzaba una excepción y el juego no arrancaba.

**Solución:** detección automática del formato de la URL:
- Si empieza con `data:` → ruta de Chromium → decodifica base64 como antes
- Si no → ruta standalone → usa `fetch()` + `decodeAudioData()` directamente
- Los errores de carga de audio se capturan silenciosamente; el juego funciona sin sonido

---

## 🚀 Cómo ejecutar

```bash
# Instalar dependencias (solo la primera vez)
npm install

# Servidor de desarrollo con hot reload en http://localhost:3000
npm run dev

# Build de producción optimizado → carpeta dist/
npm run build

# Previsualizar el build de producción en http://localhost:4173
npm run preview
```

---

## 🎮 Controles del juego

| Acción | Teclado | Táctil |
|---|---|---|
| Iniciar / Saltar | `Espacio` o `↑` | Tap |
| Agacharse / Speed-drop | `↓` | — |
| Reiniciar tras game over | `Enter`, `Espacio` o clic | Tap |

---

## 🏗️ Arquitectura de la solución

```
chromium/
├── package.json          ← scripts npm
├── vite.config.ts        ← bundler: root = components/neterror/resources
├── tsconfig.json         ← ES2022, DOM
└── components/neterror/resources/
    ├── index.html        ← HTML standalone (entry de Vite)
    ├── standalone.ts     ← inicializa Runner con loadTimeData configurado
    ├── standalone.css    ← estilos del juego sin dependencias de Chrome
    ├── constants.ts      ← sin cambios (exporta HIDDEN_CLASS)
    ├── mocks/
    │   ├── assert.ts     ← reemplaza chrome://resources/js/assert.js
    │   └── load_time_data.ts  ← reemplaza chrome://resources/js/load_time_data.js
    ├── dino_game/        ← imports de chrome:// reemplazados por mocks
    │   ├── offline.ts    ← + loadSounds() adaptado para fetch
    │   └── ...
    ├── images/           ← sprites del juego (sin cambios)
    └── sounds/           ← efectos de sonido (sin cambios)
```

---

## 📦 Build de producción

El comando `npm run build` genera la carpeta `dist/` con:

```
dist/
├── index.html                        ← HTML con rutas de assets hasheadas
└── assets/
    ├── index-[hash].js               ← Todo el JS del juego minificado (~60 KB)
    ├── index-[hash].css              ← CSS minificado
    └── 200-offline-sprite-[hash].png ← Sprite 2x inlineado/copiado
```

Los sprites 1x/2x y los sonidos se copian automáticamente por Vite.
