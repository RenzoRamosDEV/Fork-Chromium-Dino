import {describe, it, expect} from 'vitest';

// Física del salto extraída de trex.ts (valores por defecto del config normal).
// Se testea la lógica pura sin instanciar Trex (que necesita canvas y sprite).

const DEFAULT_CONFIG = {
  gravity: 0.25,
  initialJumpVelocity: -20,
  dropVelocity: -5,
  maxJumpHeight: 50,
  minJumpHeight: 45,
  speedDropCoefficient: 3,
};

// Replica setJumpVelocity de Trex
function setJumpVelocity(config: typeof DEFAULT_CONFIG, setting: number) {
  return {
    ...config,
    initialJumpVelocity: -setting,
    dropVelocity: -setting / 2,
  };
}

// Simula un frame de salto: devuelve el nuevo yPos y velocidad.
function applyJumpFrame(
    yPos: number, velocity: number, gravity: number, framesElapsed: number) {
  const newY = yPos - Math.round(velocity * framesElapsed);
  const newVelocity = velocity + gravity * framesElapsed;
  return {yPos: newY, velocity: newVelocity};
}

describe('setJumpVelocity', () => {
  it('establece initialJumpVelocity como el negativo del setting', () => {
    const cfg = setJumpVelocity({...DEFAULT_CONFIG}, 20);
    expect(cfg.initialJumpVelocity).toBe(-20);
  });

  it('establece dropVelocity como -setting/2', () => {
    const cfg = setJumpVelocity({...DEFAULT_CONFIG}, 20);
    expect(cfg.dropVelocity).toBe(-10);
  });

  it('una velocidad mayor produce un salto más alto', () => {
    // Calcula cuántos píxeles sube el dino antes de que la gravedad invierta la dirección.
    // Suma el desplazamiento vertical total mientras velocity < 0.
    function totalRise(initialVelocity: number, gravity: number): number {
      let v = initialVelocity;
      let totalDelta = 0;
      for (let i = 0; i < 200; i++) {
        if (v >= 0) break;
        totalDelta += Math.abs(Math.round(v)); // píxeles subidos este frame
        v += gravity;
      }
      return totalDelta;
    }

    const highJump = totalRise(-25, DEFAULT_CONFIG.gravity);
    const lowJump  = totalRise(-15, DEFAULT_CONFIG.gravity);
    expect(highJump).toBeGreaterThan(lowJump);
  });
});

describe('física del salto frame a frame', () => {
  it('la gravedad incrementa la velocidad cada frame', () => {
    let v = DEFAULT_CONFIG.initialJumpVelocity;
    for (let i = 0; i < 10; i++) {
      const prev = v;
      v += DEFAULT_CONFIG.gravity;
      expect(v).toBeGreaterThan(prev);
    }
  });

  it('el dino sube durante la fase de impulso y baja cuando la gravedad supera la velocidad', () => {
    // Contamos frames subiendo (velocity < 0) y bajando (velocity > 0)
    let velocity = DEFAULT_CONFIG.initialJumpVelocity;
    let framesUp = 0;
    let framesDown = 0;

    for (let i = 0; i < 120; i++) {
      if (velocity < 0) framesUp++;
      else framesDown++;
      velocity += DEFAULT_CONFIG.gravity;
      if (framesDown > 5) break; // suficiente para confirmar que baja
    }

    expect(framesUp).toBeGreaterThan(0);
    expect(framesDown).toBeGreaterThan(0);
    // La fase de subida dura más que 1 frame con initialJumpVelocity = -20
    expect(framesUp).toBeGreaterThan(1);
  });
});
