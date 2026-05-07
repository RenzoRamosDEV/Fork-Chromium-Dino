// Mock de chrome://resources/js/load_time_data.js
// En Chromium, loadTimeData es un objeto que el backend C++ inyecta con datos
// de configuración y strings localizadas antes de que cargue la página.
// Aquí lo simulamos como un objeto JavaScript plano que podemos poblar
// manualmente desde standalone.ts antes de arrancar el juego.

/**
 * Almacén interno de datos. Se popula desde standalone.ts antes de
 * que Runner sea instanciado.
 */
const store: Record<string, unknown> = {};

export const loadTimeData = {
  // Permite que código externo (standalone.ts, neterror.ts) inyecte el mapa
  // de datos completo de una vez, igual que hace el runtime de Chrome.
  set data(newData: Record<string, unknown>) {
    // Copia todas las propiedades al store interno.
    Object.assign(store, newData);
  },

  /**
   * Devuelve el valor asociado a `key` sin conversión de tipo.
   * Equivale a loadTimeData.getValue en el original de Chrome.
   */
  getValue(key: string): unknown {
    return store[key];
  },

  /**
   * Devuelve el valor como string. Si no existe, devuelve cadena vacía.
   * Usado por Runner para leer strings de accesibilidad (a11y).
   */
  getString(key: string): string {
    return store[key] != null ? String(store[key]) : '';
  },

  /**
   * Devuelve true si la clave existe en el store.
   * Se usa para flags de feature como 'disabledEasterEgg' o 'enableAltGameMode'.
   */
  valueExists(key: string): boolean {
    return key in store;
  },
};
