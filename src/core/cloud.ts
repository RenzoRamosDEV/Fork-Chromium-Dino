// Copyright 2025 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Reemplazado: el original importa de 'chrome://resources/js/assert.js'
// que solo existe dentro del runtime de Chromium.
import {assert} from '../mocks/assert.js';

import {IS_HIDPI} from './constants.js';
import type {ImageSpriteProvider} from './image_sprite_provider.js';
import type {SpritePosition} from './sprite_position.js';
import {getRandomNum} from './utils.js';

// Nube decorativa del fondo. Se mueve de derecha a izquierda a velocidad constante
// independiente de la velocidad del juego. No tiene colisiones.
// Se crea en Horizon y se marca como `remove=true` cuando sale por la izquierda.
export class Cloud {
  // Píxeles mínimos que deben separar esta nube de la siguiente.
  gap: number;
  // Posición X actual de la nube en el canvas.
  xPos: number;
  // Cuando es true, Horizon la filtra y la elimina del array.
  remove: boolean = false;
  private yPos: number = 0;
  private canvasCtx: CanvasRenderingContext2D;
  private spritePos: SpritePosition;
  private imageSpriteProvider: ImageSpriteProvider;

  constructor(
      canvas: HTMLCanvasElement, spritePos: SpritePosition,
      containerWidth: number, imageSpriteProvider: ImageSpriteProvider) {
    const canvasContext = canvas.getContext('2d');
    assert(canvasContext);
    this.canvasCtx = canvasContext;
    this.xPos = containerWidth;
    this.spritePos = spritePos;
    this.imageSpriteProvider = imageSpriteProvider;
    this.gap = getRandomNum(Config.MIN_CLOUD_GAP, Config.MAX_CLOUD_GAP);

    this.init();
  }

  /**
   * Initialise the cloud. Sets the Cloud height.
   */
  init() {
    this.yPos = getRandomNum(Config.MAX_SKY_LEVEL, Config.MIN_SKY_LEVEL);
    this.draw();
  }

  /**
   * Draw the cloud.
   */
  draw() {
    const runnerImageSprite = this.imageSpriteProvider.getRunnerImageSprite();

    this.canvasCtx.save();
    let sourceWidth = Config.WIDTH;
    let sourceHeight = Config.HEIGHT;
    const outputWidth = sourceWidth;
    const outputHeight = sourceHeight;
    if (IS_HIDPI) {
      sourceWidth = sourceWidth * 2;
      sourceHeight = sourceHeight * 2;
    }

    this.canvasCtx.drawImage(
        runnerImageSprite, this.spritePos.x, this.spritePos.y, sourceWidth,
        sourceHeight, this.xPos, this.yPos, outputWidth, outputHeight);

    this.canvasCtx.restore();
  }

  /**
   * Update the cloud position.
   */
  update(speed: number) {
    if (!this.remove) {
      this.xPos -= Math.ceil(speed);
      this.draw();

      // Mark as removable if no longer in the canvas.
      if (!this.isVisible()) {
        this.remove = true;
      }
    }
  }

  /**
   * Check if the cloud is visible on the stage.
   */
  isVisible(): boolean {
    return this.xPos + Config.WIDTH > 0;
  }
}

/**
 * Cloud object config.
 */
enum Config {
  HEIGHT = 14,
  MAX_CLOUD_GAP = 400,
  MAX_SKY_LEVEL = 30,
  MIN_CLOUD_GAP = 100,
  MIN_SKY_LEVEL = 71,
  WIDTH = 46,
}
