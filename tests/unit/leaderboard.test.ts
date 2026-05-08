import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── localStorage mock ────────────────────────────────────────────────────────
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i % 256;
      return arr;
    },
  },
});

// ─── Supabase mock configurable por test ──────────────────────────────────────
let mockExistingScore = 0;
let mockInsertError: any = null;
let mockUpdateError: any = null;
let insertCalled = false;
let updateCalled = false;
let insertPayload: any = null;
let updatePayload: any = null;

vi.mock('../../src/features/leaderboard/supabase.js', () => ({
  supabase: {
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: string) => ({
          limit: (_n: number) => Promise.resolve({
            data: mockExistingScore > 0 ? [{ score: mockExistingScore }] : [],
            error: null,
          }),
        }),
      }),
      insert: (payload: any) => {
        insertCalled = true;
        insertPayload = payload;
        return Promise.resolve({ error: mockInsertError });
      },
      update: (payload: any) => ({
        eq: (_col: string, _val: string) => {
          updateCalled = true;
          updatePayload = payload;
          return Promise.resolve({ error: mockUpdateError });
        },
      }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
  },
}));

// DOM mínimo para saveScore
function setupDOM(name = 'Renzo', avatarVisible = false) {
  document.body.innerHTML = `
    <input id="profile-name-input" value="${name}">
    <img id="profile-avatar" style="display:${avatarVisible ? 'block' : 'none'}" src="https://cdn.example.com/avatar.png">
  `;
}

import { saveScore } from '../../src/features/leaderboard/index.js';

describe('saveScore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockExistingScore = 0;
    mockInsertError = null;
    mockUpdateError = null;
    insertCalled = false;
    updateCalled = false;
    insertPayload = null;
    updatePayload = null;
    setupDOM();
  });

  it('no guarda si el score es 0', async () => {
    await saveScore(0);
    expect(insertCalled).toBe(false);
    expect(updateCalled).toBe(false);
  });

  it('no guarda si el nombre está vacío', async () => {
    setupDOM('');
    await saveScore(500);
    expect(insertCalled).toBe(false);
    expect(updateCalled).toBe(false);
  });

  it('hace INSERT si no hay registro previo', async () => {
    mockExistingScore = 0;
    await saveScore(500);
    expect(insertCalled).toBe(true);
    expect(updateCalled).toBe(false);
  });

  it('el INSERT incluye nombre, score y codigo', async () => {
    mockExistingScore = 0;
    await saveScore(750);
    expect(insertPayload).toMatchObject({ nombre: 'Renzo', score: 750 });
    expect(insertPayload.codigo).toBeTruthy();
  });

  it('hace UPDATE si ya existe un registro con score menor', async () => {
    mockExistingScore = 400;
    await saveScore(900);
    expect(updateCalled).toBe(true);
    expect(insertCalled).toBe(false);
  });

  it('el UPDATE incluye el nuevo score', async () => {
    mockExistingScore = 400;
    await saveScore(900);
    expect(updatePayload).toMatchObject({ score: 900 });
  });

  it('NO guarda si el nuevo score es menor o igual al existente', async () => {
    mockExistingScore = 1000;
    await saveScore(800);
    expect(insertCalled).toBe(false);
    expect(updateCalled).toBe(false);
  });

  it('NO guarda si el nuevo score es igual al existente', async () => {
    mockExistingScore = 500;
    await saveScore(500);
    expect(insertCalled).toBe(false);
    expect(updateCalled).toBe(false);
  });

  it('incluye avatar_url cuando el avatar es visible', async () => {
    setupDOM('Renzo', true);
    mockExistingScore = 0;
    await saveScore(600);
    expect(insertPayload.avatar_url).toBe('https://cdn.example.com/avatar.png');
  });

  it('avatar_url es null cuando el avatar está oculto', async () => {
    setupDOM('Renzo', false);
    mockExistingScore = 0;
    await saveScore(600);
    expect(insertPayload.avatar_url).toBeNull();
  });
});

describe('lógica de login con código', () => {
  const DISTANCE_COEFFICIENT = 0.025;

  beforeEach(() => localStorageMock.clear());

  it('restaura el código en localStorage', () => {
    const inputCode = 'ABC123';
    localStorageMock.setItem('dino-player-code', inputCode);
    expect(localStorageMock.getItem('dino-player-code')).toBe(inputCode);
  });

  it('restaura el score: convierte display→raw para localStorage', () => {
    const serverScore = 866; // display score guardado en Supabase
    const rawScore = Math.round(serverScore / DISTANCE_COEFFICIENT);
    localStorageMock.setItem('dino-high-score', String(rawScore));
    const recovered = parseInt(localStorageMock.getItem('dino-high-score')!, 10);
    expect(Math.round(recovered * DISTANCE_COEFFICIENT)).toBe(serverScore);
  });

  it('código de 90 chars se guarda y recupera íntegro', () => {
    const longCode = 'A'.repeat(90);
    localStorageMock.setItem('dino-player-code', longCode);
    expect(localStorageMock.getItem('dino-player-code')).toHaveLength(90);
  });
});
