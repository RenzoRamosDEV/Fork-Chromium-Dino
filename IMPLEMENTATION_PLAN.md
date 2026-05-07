# 🦕 Plan de Implementación: Juego del Dinosaurio de Chrome

## 📋 Resumen del Estado Actual

**Lo que tenemos:** Código fuente completo del juego del dinosaurio de Chrome en TypeScript
**Lo que falta:** Compilación, empaquetado y configuración para ejecutarlo

---

## 🎯 Objetivo

Hacer que el juego del dinosaurio sea **jugable en un navegador** sin necesidad de compilar todo Chromium.

---

## 📁 Estructura del Proyecto Actual

```
chromium/components/neterror/resources/
├── neterror.html                    # HTML principal (referencia JS compilado)
├── neterror.ts                      # Entry point del juego
├── neterror.css                     # Estilos
├── dino_game/                       # Código fuente del juego
│   ├── offline.ts                   # Clase Runner (controlador principal)
│   ├── trex.ts                      # Clase Trex (personaje)
│   ├── horizon.ts                   # Clase Horizon (escenario)
│   ├── obstacle.ts                  # Clase Obstacle
│   ├── distance_meter.ts            # Clase DistanceMeter (puntuación)
│   ├── game_over_panel.ts           # Clase GameOverPanel
│   ├── constants.ts                 # Constantes del juego
│   └── ... (otros módulos)
├── images/                          # Sprites del juego
│   └── default_100_percent/offline/
│       └── 100-offline-sprite.png
├── sounds/                          # Efectos de sonido
│   ├── button-press.mp3
│   ├── hit.mp3
│   └── score-reached.mp3
```

---

## ⚠️ Problemas Actuales

### 1. **Dependencias de Chrome**
El código usa imports de Chrome que no existen fuera del entorno Chromium:

```typescript
// Estos imports fallarán en un navegador normal
import {assert} from 'chrome://resources/js/assert.js';
import {loadTimeData} from 'chrome://resources/js/load_time_data.js';
import {html, render} from 'chrome://resources/lit/v3_0/lit.rollup.js';
```

### 2. **Falta el archivo JavaScript compilado**
El HTML busca:
```html
<script src="neterror.rollup.js"></script>
```
Pero el código fuente está en TypeScript y necesita compilación.

### 3. **Sistema de localización**
Usa `loadTimeData` que inyecta datos desde C++ de Chromium.

---

## 🔧 Soluciones a Implementar

### OPCIÓN A: Versión Standalone (Recomendada) ⭐
Crear una versión del juego que funcione independientemente sin dependencias de Chrome.

#### Pasos:

1. **Crear implementaciones mock de dependencias**
   - `mock/assert.ts` - Función assert simple
   - `mock/load_time_data.ts` - Simular sistema de localización
   - `mock/lit.ts` - Sustituir Lit por template strings simples

2. **Crear entry point standalone**
   - `standalone.ts` - Nueva versión que no dependa de `neterror.ts`
   - Inicializar el juego directamente sin la lógica de error page

3. **Configurar bundler**
   - Usar **Vite** o **Rollup** para:
     - Compilar TypeScript a JavaScript
     - Resolver módulos ES6
     - Empaquetar todo en un solo archivo

4. **Crear HTML standalone**
   - `index.html` - Página simple sin plantillas
   - Incluir el canvas directamente
   - Cargar el bundle JavaScript

### OPCIÓN B: Compilar con el build system de Chrome
Requiere descargar y configurar todo el entorno de desarrollo de Chromium (muy pesado).

---

## 📦 Plan de Implementación Detallado

### Fase 1: Preparar Mocks (Día 1)

#### 1.1 Crear `mocks/assert.ts`
```typescript
export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}
```

#### 1.2 Crear `mocks/load_time_data.ts`
```typescript
// Simular el sistema de localización de Chrome
export const loadTimeData = {
  data: {} as Record<string, unknown>,
  
  getValue(key: string): unknown {
    return this.data[key];
  },
  
  getString(key: string): string {
    return String(this.data[key] || '');
  },
  
  valueExists(key: string): boolean {
    return key in this.data;
  }
};
```

#### 1.3 Crear `mocks/lit.ts`
```typescript
// Sustituto simple para Lit (solo necesitamos lo básico)
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
}

export function render(template: string, container: HTMLElement): void {
  container.innerHTML = template;
}
```

### Fase 2: Crear Entry Point Standalone (Día 1-2)

#### 2.1 Crear `standalone.ts`
```typescript
import {Runner} from './dino_game/offline.js';
import {loadTimeData} from './mocks/load_time_data.js';

// Configurar datos de localización
loadTimeData.data = {
  ariaLabel: 'Dino game',
  // ... más strings necesarias
};

// Inicializar juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.game-container');
  if (container) {
    Runner.initializeInstance('.game-container');
  }
});
```

#### 2.2 Modificar imports en los archivos del juego
Reemplazar imports de Chrome por los mocks:
```typescript
// ANTES:
import {assert} from 'chrome://resources/js/assert.js';

// DESPUÉS:
import {assert} from '../mocks/assert.js';
```

### Fase 3: Configurar Build (Día 2)

#### 3.1 Crear `package.json`
```json
{
  "name": "dino-game",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### 3.2 Crear `vite.config.ts`
```typescript
import {defineConfig} from 'vite';

export default defineConfig({
  root: 'components/neterror/resources',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'standalone.html'
    }
  }
});
```

#### 3.3 Crear `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Fase 4: Crear HTML Standalone (Día 2)

#### 4.1 Crear `standalone.html`
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dino Game</title>
  <style>
    body {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f7f7f7;
      font-family: Arial, sans-serif;
    }
    .game-container {
      position: relative;
    }
    #offline-resources {
      display: none;
    }
  </style>
</head>
<body>
  <div class="game-container"></div>
  
  <!-- Recursos del juego -->
  <div id="offline-resources">
    <img id="offline-resources-1x" src="images/default_100_percent/offline/100-offline-sprite.png">
    <img id="offline-resources-2x" src="images/default_200_percent/offline/200-offline-sprite.png">
    <template id="audio-resources">
      <audio id="offline-sound-press" src="sounds/button-press.mp3"></audio>
      <audio id="offline-sound-hit" src="sounds/hit.mp3"></audio>
      <audio id="offline-sound-reached" src="sounds/score-reached.mp3"></audio>
    </template>
  </div>
  
  <script type="module" src="standalone.ts"></script>
</body>
</html>
```

### Fase 5: Adaptar Código del Juego (Día 2-3)

#### 5.1 Modificar `offline.ts`
- Reemplazar imports de Chrome
- Simplificar lógica de ErrorPageController
- Mantener toda la lógica del juego intacta

#### 5.2 Modificar `trex.ts`
- Reemplazar imports
- Verificar que las físicas funcionen

#### 5.3 Modificar otros archivos del juego
- Hacer lo mismo para todos los archivos en `dino_game/`

### Fase 6: Estilos CSS (Día 3)

#### 6.1 Crear `standalone.css`
Copiar estilos necesarios de `neterror.css` y adaptarlos:
- Estilos del canvas
- Estilos del contenedor
- Animaciones
- Estados del juego (crashed, etc.)

### Fase 7: Testing y Ajustes (Día 3-4)

#### 7.1 Verificar funcionalidad:
- [ ] El dinosaurio corre
- [ ] Salto con tecla espacio/flecha arriba
- [ ] Agacharse con flecha abajo
- [ ] Obstáculos aparecen
- [ ] Colisiones funcionan
- [ ] Puntuación se muestra
- [ ] Game over funciona
- [ ] Reinicio funciona
- [ ] Sonidos funcionan (opcional)
- [ ] Modo noche funciona (opcional)

---

## 🛠️ Alternativa Rápida: Script de Conversión

Crear un script que automatice la conversión:

```bash
#!/bin/bash
# convert-to-standalone.sh

# 1. Crear estructura de directorios
mkdir -p dino-standalone/mocks
mkdir -p dino-standalone/dino_game
mkdir -p dino-standalone/images
mkdir -p dino-standalone/sounds

# 2. Copiar archivos del juego
cp -r components/neterror/resources/dino_game/* dino-standalone/dino_game/
cp -r components/neterror/resources/images/* dino-standalone/images/
cp -r components/neterror/resources/sounds/* dino-standalone/sounds/

# 3. Crear mocks
# ... (crear archivos mock)

# 4. Reemplazar imports
find dino-standalone -name "*.ts" -exec sed -i \
  's/chrome:\/\/resources\/js\/assert\.js/..\/mocks\/assert.js/g' {} \;

# ... más reemplazos

echo "Conversión completa. Revisa los archivos generados."
```

---

## ✅ Checklist Final

Antes de considerar el proyecto funcional, verificar:

### Funcionalidad Básica
- [ ] Juego inicia al presionar espacio/flecha arriba
- [ ] Dinosaurio salta
- [ ] Dinosaurio se agacha
- [ ] Obstáculos generan aleatoriamente
- [ ] Colisiones detectan correctamente
- [ ] Game Over muestra pantalla final
- [ ] Puntuación incrementa correctamente
- [ ] High score se guarda (localStorage)
- [ ] Juego reinicia con Enter/clic

### Funcionalidad Avanzada (Opcional)
- [ ] Modo noche (inversión de colores)
- [ ] Velocidad incrementa progresivamente
- [ ] Sonidos funcionan
- [ ] Soporte para móvil/touch
- [ ] Gamepad funciona
- [ ] Modo accesibilidad (audio cues)

### Compatibilidad
- [ ] Funciona en Chrome/Edge
- [ ] Funciona en Firefox
- [ ] Funciona en Safari
- [ ] Responsive en móviles
- [ ] Sin errores en consola

---

## 🚀 Próximos Pasos Inmediatos

1. **Decidir el enfoque:** ¿Standalone o usar build system de Chrome?
2. **Si standalone:**
   - Instalar Node.js + npm
   - Crear mocks básicos
   - Configurar Vite
   - Crear HTML standalone
3. **Probar:** Ejecutar `npm run dev` y verificar que funcione
4. **Iterar:** Arreglar bugs y ajustar comportamiento

---

## 📚 Recursos Útiles

- [Código fuente del juego original](https://source.chromium.org/chromium/chromium/src/+/main:components/neterror/resources/)
- [Documentación de Vite](https://vitejs.dev/)
- [Canvas API - MDN](https://developer.mozilla.org/es/docs/Web/API/Canvas_API)

---

**¿Listo para empezar?** Comencemos con la Fase 1: Crear los mocks de las dependencias de Chrome.
