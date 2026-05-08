import {describe, it, expect} from 'vitest';
import {CollisionBox} from '../game/offline_sprite_definitions.js';

// Función AABB pura equivalente a la que usa checkForCollision internamente.
// Dos cajas colisionan si se solapan en ambos ejes.
function boxesOverlap(a: CollisionBox, b: CollisionBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

describe('CollisionBox', () => {
  it('crea una caja con las propiedades correctas', () => {
    const box = new CollisionBox(10, 20, 30, 40);
    expect(box.x).toBe(10);
    expect(box.y).toBe(20);
    expect(box.width).toBe(30);
    expect(box.height).toBe(40);
  });
});

describe('detección de colisión AABB', () => {
  it('detecta colisión cuando las cajas se superponen', () => {
    const a = new CollisionBox(0, 0, 50, 50);
    const b = new CollisionBox(25, 25, 50, 50);
    expect(boxesOverlap(a, b)).toBe(true);
  });

  it('no detecta colisión cuando las cajas están separadas horizontalmente', () => {
    const a = new CollisionBox(0, 0, 40, 40);
    const b = new CollisionBox(50, 0, 40, 40);
    expect(boxesOverlap(a, b)).toBe(false);
  });

  it('no detecta colisión cuando las cajas están separadas verticalmente', () => {
    const a = new CollisionBox(0, 0, 40, 40);
    const b = new CollisionBox(0, 50, 40, 40);
    expect(boxesOverlap(a, b)).toBe(false);
  });

  it('no hay colisión cuando las cajas solo se tocan en el borde (sin solapamiento real)', () => {
    // El dino salta exactamente por encima del obstáculo: sus bordes se tocan
    // pero no se penetran → no debe ser colisión.
    const dino  = new CollisionBox(0, 0, 44, 47);
    const cactus = new CollisionBox(44, 0, 20, 47); // empieza justo donde acaba el dino
    expect(boxesOverlap(dino, cactus)).toBe(false);
  });

  it('detecta colisión de un pixel de solapamiento', () => {
    const dino  = new CollisionBox(0, 0, 44, 47);
    const cactus = new CollisionBox(43, 0, 20, 47); // 1 px de solapamiento
    expect(boxesOverlap(dino, cactus)).toBe(true);
  });

  it('la caja contenida dentro de otra colisiona', () => {
    const outer = new CollisionBox(0, 0, 100, 100);
    const inner = new CollisionBox(10, 10, 20, 20);
    expect(boxesOverlap(outer, inner)).toBe(true);
  });
});
