// Mock de chrome://resources/js/assert.js
// En Chromium, assert es una función de bajo nivel del runtime C++.
// Aquí la reemplazamos con un lanzamiento de Error estándar de JS.

/**
 * Lanza un Error si la condición es falsa o falsy.
 * La firma `asserts condition` le indica a TypeScript que, si la función
 * retorna sin lanzar, `condition` es verdadera (narrowing de tipos).
 */
export function assert(
    condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}
