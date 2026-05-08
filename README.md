# Dinochorme

Una versión personalizada y standalone del dinosaurio offline de Chrome, con leaderboard global en tiempo real, perfiles de jugador y personalización de color.

---

## Qué es esto

El juego del dinosaurio de Chrome cuando no hay internet. Esta versión lo extrae del navegador, lo convierte en una app web independiente con TypeScript + Vite, y le añade funcionalidades multijugador usando Supabase como backend.

---

## URL

https://renzoramosdev.github.io/Fork-Chromium-Dino/

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript 5.4 |
| Build | Vite 5.4 |
| Backend / DB | Supabase (PostgreSQL + Realtime + Storage) |
| Tests unitarios | Vitest 4.1 |
| Tests E2E | Playwright 1.59 |
| Runtime | ES2022, ESNext modules, SPA sin servidor |

---

## Estructura del proyecto

```
dinochorme/
└── chromium/
    ├── src/
    │   ├── main.ts                   # Punto de entrada
    │   ├── index.html                # HTML principal
    │   ├── constants.ts              # Constantes globales
    │   ├── core/                     # Motor del juego (port del código de Chromium)
    │   │   ├── offline.ts            # Runner: loop principal del juego
    │   │   ├── trex.ts               # Dinosaurio: física de salto y animaciones
    │   │   ├── horizon.ts            # Escenario: obstáculos, nubes, suelo
    │   │   ├── obstacle.ts           # Cactus, pterodáctilos, coleccionables
    │   │   ├── game_config.ts        # Velocidad, gaps, física configurable
    │   │   └── ...                   # Más módulos del motor
    │   ├── features/
    │   │   ├── profile/              # Perfil de jugador + localStorage + Supabase
    │   │   ├── leaderboard/          # Ranking global en tiempo real (Supabase)
    │   │   ├── color/                # Color picker para el dinosaurio
    │   │   └── rainbow/              # Modo arcoíris (easter egg)
    │   ├── mocks/                    # Mocks de APIs internas de Chrome
    │   ├── sounds/                   # Audio procedural
    │   └── images/                   # Sprites del juego
    ├── tests/
    │   ├── unit/                     # Tests con Vitest + jsdom
    │   └── e2e/                      # Tests con Playwright
    ├── package.json
    ├── vite.config.ts
    └── playwright.config.ts
```

---

## Base de datos

### Supabase — tabla `scores`

Es la única tabla del sistema. Almacena el perfil y el high score de cada jugador.

```sql
scores (
  id          bigint       -- PK auto-incremental
  codigo      text         -- Código único de 90 chars del jugador (base64 aleatorio)
  nome        text         -- Nombre de display del jugador
  avatar_url  text | null  -- URL pública de la foto en Supabase Storage
  score       bigint       -- High score como distancia cruda del juego
  fecha       timestamp    -- Última actualización
)
```

**Row-Level Security (RLS):** activado. La anon key solo permite lectura pública y escritura propia.

**Realtime:** la tabla tiene subscripción activa a `postgres_changes` para INSERT y UPDATE. Todos los clientes conectados reciben el nuevo ranking al instante.

### Supabase Storage — bucket `avatars`

- Acceso público de lectura
- Los avatares se suben como `avatar_${Date.now()}.{ext}`

### localStorage (cliente)

```
dino-high-score   → distancia cruda del récord local
dino-player-code  → código único de 90 chars
dino_profile      → JSON con { name, avatarDataUrl }
```

---

## Cómo funciona el juego

### Loop principal (`Runner` en `core/offline.ts`)

```
requestAnimationFrame
    └── Runner.update()
          ├── Actualiza posición del dinosaurio (gravedad, salto)
          ├── Genera y mueve obstáculos
          ├── Detecta colisiones
          ├── Actualiza velocidad y distancia
          └── Renderiza todo en canvas
```

### Estados del Runner

| Estado | Descripción |
|---|---|
| `playingIntro` | El dino entra deslizándose al inicio |
| `playing` | Juego en curso |
| `crashed` | Colisión detectada, juego pausado |
| `paused` | Tab oculta o foco perdido |

### Flujo completo de una partida

```
1. Carga de página
   → main.ts inicializa Runner, Profile, Leaderboard, Color Picker

2. El jugador presiona Space o toca la pantalla
   → Runner.start() → intro → game loop

3. Colisión detectada
   → Runner.crashed = true
   → localStorage actualiza high score
   → Profile feature: actualiza "último puntaje"
   → Leaderboard feature: llama saveScore()

4. saveScore()
   → Si el nuevo score > score guardado en Supabase:
     - INSERT si es primera vez
     - UPDATE si ya existe entrada
   → Supabase dispara evento Realtime
   → Todos los clientes refrescan el leaderboard
```

---

## Features

### Perfil de jugador

- Nombre editable, guardado en localStorage
- Avatar que se sube a Supabase Storage
- Código único de 90 chars para identificar al jugador entre sesiones/dispositivos
- "Login con código": restaurar cuenta en otro dispositivo pegando el código

### Leaderboard global

- Top 10 jugadores por high score
- Actualización en tiempo real vía WebSocket (Supabase Realtime)
- Muestra avatar, nombre y puntaje de cada jugador
- Solo guarda si el jugador tiene nombre y el score mejora su récord anterior

### Color picker

- Selección de color en espacio HSV con gradiente interactivo
- Barra de tono (hue)
- Inputs para HEX, RGB, HSL, HSV
- Aplica el color al dinosaurio via CSS filters: `sepia → hue-rotate → saturate → brightness`
- Soporte mouse y touch

### Modo arcoíris (easter egg)

Se desbloquea si:
- High score ≥ 5000 puntos o encuentras el codigo secreto

Una vez activo, cicla el tono del dinosaurio continuamente en el game loop.

### Conversión de puntaje

El motor interno usa distancia cruda. La conversión a puntos de display es:

```
puntaje_display = distancia_cruda × 0.025
```

---

## Comandos

```bash
# Desarrollo
npm run dev           # Servidor en :3000, abre el navegador automáticamente

# Build
npm run build         # Bundle a dist/
npm run preview       # Sirve dist/ en :4173

# Tests
npm run test          # Vitest (unitarios)
npm run test:watch    # Vitest en modo watch
npm run test:e2e      # Playwright (requiere npm run preview corriendo)
npm run test:all      # Todos juntos
```

---

## Despliegue

La app es un SPA estático. `npm run build` genera `dist/` que se puede subir a Vercel, Netlify, GitHub Pages o cualquier hosting estático.

Requisitos:
- Un proyecto de Supabase con la tabla `scores` creada (ver schema arriba)
- Un bucket público `avatars` en Supabase Storage
- Actualizar la URL y anon key en `src/features/leaderboard/supabase.ts`
