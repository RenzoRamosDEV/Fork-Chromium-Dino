import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mocks globales ───────────────────────────────────────────────────────────

// Mock de supabase-client antes de importar profile
vi.mock('../../src/features/leaderboard/supabase.js', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'avatar_test.png' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/avatar_test.png' } }),
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

// localStorage simulado con Map
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// crypto.getRandomValues simulado
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i % 256;
      return arr;
    },
  },
});

import { getPlayerCode } from '../../src/features/profile/index.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getPlayerCode', () => {
  beforeEach(() => localStorageMock.clear());

  it('genera un código de 90 caracteres', () => {
    const code = getPlayerCode();
    expect(code).toHaveLength(90);
  });

  it('solo contiene caracteres alfanuméricos', () => {
    const code = getPlayerCode();
    expect(code).toMatch(/^[A-Za-z0-9]{90}$/);
  });

  it('devuelve el mismo código en llamadas sucesivas', () => {
    const code1 = getPlayerCode();
    const code2 = getPlayerCode();
    expect(code1).toBe(code2);
  });

  it('persiste el código en localStorage', () => {
    const code = getPlayerCode();
    expect(localStorageMock.getItem('dino-player-code')).toBe(code);
  });

  it('usa el código existente si ya está guardado', () => {
    localStorageMock.setItem('dino-player-code', 'mi-codigo-guardado');
    const code = getPlayerCode();
    expect(code).toBe('mi-codigo-guardado');
  });
});

describe('persistencia de perfil en localStorage', () => {
  beforeEach(() => localStorageMock.clear());

  it('guarda y recupera nombre del perfil', () => {
    const profile = { name: 'Renzo', avatarDataUrl: '' };
    localStorageMock.setItem('dino_profile', JSON.stringify(profile));
    const recovered = JSON.parse(localStorageMock.getItem('dino_profile')!);
    expect(recovered.name).toBe('Renzo');
  });

  it('devuelve objeto vacío si no hay perfil guardado', () => {
    const raw = localStorageMock.getItem('dino_profile');
    const profile = raw ? JSON.parse(raw) : {};
    expect(profile).toEqual({});
  });

  it('guarda y recupera avatar URL', () => {
    const profile = { name: 'Renzo', avatarDataUrl: 'https://cdn.example.com/avatar.png' };
    localStorageMock.setItem('dino_profile', JSON.stringify(profile));
    const recovered = JSON.parse(localStorageMock.getItem('dino_profile')!);
    expect(recovered.avatarDataUrl).toBe('https://cdn.example.com/avatar.png');
  });

  it('guarda y recupera high score', () => {
    localStorageMock.setItem('dino-high-score', '40000');
    const raw = parseInt(localStorageMock.getItem('dino-high-score') ?? '0', 10);
    expect(raw).toBe(40000);
    expect(Math.round(raw * 0.025)).toBe(1000); // display score
  });
});

describe('conversión de puntuación (raw → display)', () => {
  const DISTANCE_COEFFICIENT = 0.025;

  it('convierte correctamente raw a display', () => {
    expect(Math.round(40000 * DISTANCE_COEFFICIENT)).toBe(1000);
    expect(Math.round(80000 * DISTANCE_COEFFICIENT)).toBe(2000);
    expect(Math.round(0 * DISTANCE_COEFFICIENT)).toBe(0);
  });

  it('convierte correctamente display a raw para restaurar', () => {
    const displayScore = 1000;
    const rawScore = Math.round(displayScore / DISTANCE_COEFFICIENT);
    expect(rawScore).toBe(40000);
  });

  it('el score restaurado desde login coincide con el display original', () => {
    const originalDisplay = 866;
    const rawFromServer = Math.round(originalDisplay / DISTANCE_COEFFICIENT);
    const displayRecovered = Math.round(rawFromServer * DISTANCE_COEFFICIENT);
    expect(displayRecovered).toBe(originalDisplay);
  });
});
