// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {IS_IOS} from './constants.js';


// Devuelve un entero aleatorio entre min y max (ambos incluidos).
// Se usa para las nubes (altura aleatoria), obstáculos (gap aleatorio), etc.
export function getRandomNum(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Devuelve el timestamp actual en milisegundos.
// En iOS se usa Date.getTime() porque performance.now() puede tener problemas
// en WKWebView; en el resto de plataformas performance.now() es más preciso.
export function getTimeStamp(): number {
  return IS_IOS ? new Date().getTime() : performance.now();
}
