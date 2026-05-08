// Configuración de Vite para el juego standalone del dinosaurio.
// Vite actúa como: servidor de desarrollo con HMR + bundler de producción (Rollup).

import {defineConfig} from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Raíz del proyecto: donde vive index.html y los archivos del juego.
  // Todas las rutas relativas de Vite parten desde aquí.
  root: path.resolve(__dirname, 'src'),

  build: {
    // Carpeta de salida para `npm run build` (relativa a la raíz del proyecto,
    // no a `root`). Queda fuera de la carpeta de fuentes para no contaminarla.
    outDir: path.resolve(__dirname, 'dist'),
    // Limpia la carpeta dist antes de cada build para evitar archivos obsoletos.
    emptyOutDir: true,
  },

  server: {
    port: 3000,
    // Abre el navegador automáticamente al ejecutar `npm run dev`.
    open: true,
  },

  preview: {
    // Puerto para `npm run preview` (sirve el build de producción localmente).
    port: 4173,
  },

  resolve: {
    alias: {
      '../game': path.resolve(__dirname, 'src/game'),
      '../mocks': path.resolve(__dirname, 'src/mocks'),
    },
  },

  test: {
    // Tests unitarios con entorno de navegador simulado (jsdom).
    environment: 'jsdom',
    // Rutas absolutas para que Vitest encuentre los tests independientemente del root de Vite.
    include: [path.resolve(__dirname, 'tests/unit/**/*.test.ts')],
    globals: true,
  },
});
