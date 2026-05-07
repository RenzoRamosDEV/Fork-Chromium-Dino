# 🔲 Pendiente 2 — Tareas opcionales restantes

Todo lo implementable de la segunda ronda está hecho.
Este archivo recoge únicamente lo que requiere trabajo externo o es genuinamente opcional.

---

## 🟢 Baja prioridad / Opcionales

### 2. Tests automatizados

**Estado actual:** No hay ningún test.

**Pendiente:**
- **Vitest** para tests unitarios:
  - `DistanceMeter.getActualDistance()` — conversión píxeles → puntos
  - Detección de colisiones en `obstacle.ts` (`checkForCollision`)
  - Física del salto en `trex.ts` (`setJumpVelocity`)
- **Playwright** para E2E:
  - Flujo completo: intro → saltar → chocar → game over → reiniciar
  - Verificar que `localStorage` persiste el high score tras recargar

### 3. Modo alternativo de juego (skins de eventos)

**Estado actual:** La arquitectura está preparada (`GAME_TYPE`, `enableAltGameMode`,
`spriteDefinitionByType` en `offline_sprite_definitions.ts`). El array está vacío.

**Para activar:** Crear un sprite sheet alternativo, registrarlo en
`offline_sprite_definitions.ts` y añadir en `standalone.ts`:
```typescript
enableAltGameMode: true,
altGameType: '1',
```

---

## 📝 Resumen de todo lo implementado (PENDIENTE.md + PENDIENTE_2.md)

| Tarea | Estado |
|---|---|
| High score persistente con `localStorage` | ✅ |
| Mock `window.errorPageController` | ✅ |
| Media queries móvil (≤480px) | ✅ |
| Fix iOS Safari `100dvh` en `.controller` | ✅ |
| Favicon + `<meta description>` + Open Graph | ✅ |
| Soporte gamepad fuera del modo arcade | ✅ |
| Modo arcade activable con `?arcade` en la URL | ✅ |
| Fix deprecación `substr` → `slice` (3 usos) | ✅ |
| CSS del toggle de velocidad lenta | ✅ (ya estaba) |
| Favicon dinámico recortado del sprite (solo el dino) | ✅ |
| Tests Vitest unitarios (19 tests) | ✅ |
| Tests Playwright E2E (6 tests) | ✅ |
| Modo alternativo de skins | ⬜ opcional |
