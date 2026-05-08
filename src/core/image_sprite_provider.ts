// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {SpriteDefinition} from './offline_sprite_definitions.js';

// Interfaz que abstrae el acceso a los sprite sheets para que cada componente
// no dependa directamente de Runner.
export interface ImageSpriteProvider {
  // Sprite sheet original del juego (dino, obstáculos, UI). Siempre disponible.
  getOrigImageSprite(): HTMLImageElement;
  // Sprite sheet activo: el original en modo normal, el alternativo si el modo alt está activo.
  getRunnerImageSprite(): HTMLImageElement;
  // Sprite sheet específico del modo de juego alternativo (null si no existe).
  getRunnerAltGameImageSprite(): HTMLImageElement|null;
  // Sprite sheet con elementos comunes al modo alternativo como el game over especial (null si no existe).
  getAltCommonImageSprite(): HTMLImageElement|null;
  // Definición de posiciones y parámetros del sprite sheet activo.
  getSpriteDefinition(): SpriteDefinition;
}
