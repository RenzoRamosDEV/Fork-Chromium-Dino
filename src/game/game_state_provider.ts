// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Interfaz que expone el estado global del juego a los subcomponentes
// (Horizon, Obstacle, Trex) sin acoplarlos directamente a Runner.
export interface GameStateProvider {
  // true cuando el usuario activó el modo lento (accesibilidad).
  get hasSlowdown(): boolean;
  // true cuando los avisos de audio (a11y) están activados.
  get hasAudioCues(): boolean;
  // true si hay un modo de juego alternativo disponible y sus assets cargaron bien.
  isAltGameModeEnabled(): boolean;
}
