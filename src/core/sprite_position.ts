// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Coordenadas (x, y) de un elemento dentro del sprite sheet (imagen atlas).
// Todo el juego usa una sola imagen con todas las piezas; esta interfaz indica
// dónde empieza cada pieza dentro de esa imagen.
export interface SpritePosition {
  x: number;
  y: number;
}
