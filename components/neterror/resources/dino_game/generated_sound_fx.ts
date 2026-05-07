// Copyright 2024 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import {IS_IOS} from './constants.js';

// Interfaz para que Runner exponga el generador de sonido a Trex.
export interface GeneratedSoundFxProvider {
  getGeneratedSoundFx(): GeneratedSoundFx|null;
}

// Motor de sonido procedural mediante Web Audio API.
// Se usa exclusivamente cuando los avisos de audio (a11y) están activados;
// el modo normal usa archivos .mp3 precargados como AudioBuffer.
export class GeneratedSoundFx {
  constructor() {
    this.context = new AudioContext();
    // En iOS el AudioContext arranca suspendido y hay que reanudarlos manualmente.
    if (IS_IOS) {
      this.context.onstatechange = () => {
        if (this.context.state !== 'running') {
          this.context.resume();
        }
      };
      this.context.resume();
    }
    // StereoPanner permite pan izquierda/derecha; si el navegador no lo soporta queda null.
    this.panner = this.context.createStereoPanner ?
        this.context.createStereoPanner() :
        null;
  }
  private context: AudioContext;
  private panner: StereoPannerNode|null = null;
  // ID del setInterval que genera los pasos del dino mientras corre.
  private bgSoundIntervalId: number|null = null;

  stopAll() {
    this.cancelFootSteps();
  }

  // Genera un tono sintético con dos osciladores triangle ligeramente desafinados
  // (efecto chorus) durante `duration` segundos a partir de `startTime`.
  // `pan` en rango [-1, 1]: -1 izquierda, 1 derecha.
  playNote(
      frequency: number, startTime: number, duration: number,
      vol: number = 0.01, pan: number = 0) {
    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const volume = this.context.createGain();

    osc1.type = 'triangle';
    osc2.type = 'triangle';
    volume.gain.value = 0.1;

    if (this.panner) {
      this.panner.pan.value = pan;
      osc1.connect(volume).connect(this.panner);
      osc2.connect(volume).connect(this.panner);
      this.panner.connect(this.context.destination);
    } else {
      osc1.connect(volume);
      osc2.connect(volume);
      volume.connect(this.context.destination);
    }

    // +1 / -2 Hz de detuning para efecto de coro.
    osc1.frequency.value = frequency + 1;
    osc2.frequency.value = frequency - 2;

    // Fade out lineal en los últimos 50 ms para evitar clicks de audio.
    volume.gain.setValueAtTime(vol, startTime + duration - 0.05);
    volume.gain.linearRampToValueAtTime(0.00001, startTime + duration);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  // Sonido de inicio/reanudación: dos notas cortas seguidas de los pasos en loop.
  background() {
    const now = this.context.currentTime;
    this.playNote(493.883, now, 0.116);        // Si4
    this.playNote(659.255, now + 0.116, 0.232); // Mi5
    this.loopFootSteps();
  }

  // Inicia el loop de pasos del dinosaurio (cada 280 ms se tocan dos notas graves).
  loopFootSteps() {
    if (!this.bgSoundIntervalId) {
      this.bgSoundIntervalId = setInterval(() => {
        this.playNote(73.42, this.context.currentTime, 0.05, 0.16);
        this.playNote(69.30, this.context.currentTime + 0.116, 0.116, 0.16);
      }, 280);
    }
  }

  // Detiene los pasos y toca dos notas de "aterrizaje".
  cancelFootSteps() {
    if (this.bgSoundIntervalId) {
      clearInterval(this.bgSoundIntervalId);
      this.bgSoundIntervalId = null;
      this.playNote(103.83, this.context.currentTime, 0.232, 0.02);
      this.playNote(116.54, this.context.currentTime + 0.116, 0.232, 0.02);
    }
  }

  // Sonido de recoger un coleccionable: dos notas ascendentes agudas.
  collect() {
    this.cancelFootSteps();
    const now = this.context.currentTime;
    this.playNote(830.61, now, 0.116);
    this.playNote(1318.51, now + 0.116, 0.232);
  }

  // Sonido de salto: dos notas ascendentes con pan a la izquierda.
  jump() {
    const now = this.context.currentTime;
    this.playNote(659.25, now, 0.116, 0.3, -0.6);
    this.playNote(880, now + 0.116, 0.232, 0.3, -0.6);
  }
}
