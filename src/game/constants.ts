// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import type {Dimensions} from './dimensions.js';

// Detección de entorno: se usan para adaptar comportamiento (velocidad, controles, sonido).
// CriOS es el identificador de Chrome en iOS.
export const IS_IOS: boolean = /CriOS/.test(window.navigator.userAgent);

// devicePixelRatio > 1 significa pantalla Retina/HiDPI: se carga el sprite 2x en vez del 1x.
export const IS_HIDPI: boolean = window.devicePixelRatio > 1;

// En móvil la velocidad se escala con mobileSpeedCoefficient y los obstáculos tienen yPos diferente.
export const IS_MOBILE: boolean =
    /Android/.test(window.navigator.userAgent) || IS_IOS;

// En idiomas RTL (árabe, hebreo...) el marcador y la puntuación se invierten horizontalmente.
export const IS_RTL: boolean = document.documentElement.dir === 'rtl';

// Frecuencia de refresco objetivo del game loop (fotogramas por segundo).
export const FPS: number = 60;

// Tamaño lógico del canvas en píxeles. El canvas real puede ser mayor en HiDPI.
export const DEFAULT_DIMENSIONS: Dimensions = {
  width: 600,
  height: 150,
};
