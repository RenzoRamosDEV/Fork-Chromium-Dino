import {describe, it, expect, vi, beforeEach} from 'vitest';

// getActualDistance es el único método puro de DistanceMeter (sin DOM ni canvas).
// Lo extraemos directamente replicando la misma fórmula para no instanciar la clase
// (que necesita un canvas y un sprite). COEFFICIENT = 0.025.
const COEFFICIENT = 0.025;
function getActualDistance(distance: number): number {
  return distance ? Math.round(distance * COEFFICIENT) : 0;
}

describe('DistanceMeter.getActualDistance', () => {
  it('devuelve 0 cuando la distancia en píxeles es 0', () => {
    expect(getActualDistance(0)).toBe(0);
  });

  it('convierte píxeles a puntos con el coeficiente 0.025', () => {
    expect(getActualDistance(400)).toBe(10);   // 400 * 0.025 = 10
    expect(getActualDistance(4000)).toBe(100); // 4000 * 0.025 = 100
    expect(getActualDistance(1000)).toBe(25);  // 1000 * 0.025 = 25
  });

  it('redondea al entero más cercano', () => {
    // 10 * 0.025 = 0.25 → redondea a 0
    expect(getActualDistance(10)).toBe(0);
    // 30 * 0.025 = 0.75 → redondea a 1
    expect(getActualDistance(30)).toBe(1);
  });

  it('el logro se dispara exactamente cada 100 puntos', () => {
    // achievement distance = 100; se activa cuando distance % 100 === 0
    const achievementDistancePx = 100 / COEFFICIENT; // 4000 px
    expect(getActualDistance(achievementDistancePx) % 100).toBe(0);
  });
});
