import {describe, it, expect} from 'vitest';
import {getRandomNum} from '../game/utils.js';

describe('getRandomNum', () => {
  it('devuelve un entero dentro del rango [min, max]', () => {
    for (let i = 0; i < 200; i++) {
      const result = getRandomNum(5, 10);
      expect(result).toBeGreaterThanOrEqual(5);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('devuelve exactamente min cuando min === max', () => {
    expect(getRandomNum(7, 7)).toBe(7);
  });

  it('cubre todo el rango con suficientes iteraciones', () => {
    const results = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      results.add(getRandomNum(1, 5));
    }
    expect(results.size).toBe(5);
  });
});
