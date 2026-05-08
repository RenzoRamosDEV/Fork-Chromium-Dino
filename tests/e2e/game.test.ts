import {test, expect} from '@playwright/test';

// Runner escucha keydown en document. Despachamos directamente para no depender del foco.
async function pressKey(page: import('@playwright/test').Page, key: string, keyCode: number) {
  await page.evaluate(({key, keyCode}) => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key, code: key === ' ' ? 'Space' : key, keyCode, bubbles: true, cancelable: true,
    }));
  }, {key, keyCode});
}

const startGame = (page: import('@playwright/test').Page) => pressKey(page, ' ', 32);
const pressEnter = (page: import('@playwright/test').Page) => pressKey(page, 'Enter', 13);

// Espera a que el runner-container tenga la clase crashed (no requiere visibilidad)
async function waitForCrash(page: import('@playwright/test').Page) {
  await page.waitForSelector('.runner-container.crashed', {state: 'attached', timeout: 25_000});
}

test.describe('Dino Game — flujo principal', () => {

  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => localStorage.removeItem('dino-high-score'));
    await page.goto('/');
    await page.waitForSelector('.runner-canvas', {state: 'attached'});
  });

  test('el canvas se renderiza al cargar la página', async ({page}) => {
    await expect(page.locator('.runner-canvas')).toBeAttached();
  });

  test('el juego arranca al pulsar Space', async ({page}) => {
    await startGame(page);

    // Runner expande el contenedor vía style.width en la animación de intro
    await page.waitForFunction(
        () => {
          const el = document.querySelector('.runner-container') as HTMLElement | null;
          return el ? (parseInt(el.style.width || '0', 10) > 100) : false;
        },
        {timeout: 8000});

    const width = await page.locator('.runner-container').evaluate(
        el => parseInt((el as HTMLElement).style.width || '0', 10));
    expect(width).toBeGreaterThan(100);
  });

  test('no arranca al pulsar Space mientras se escribe el nombre', async ({page}) => {
    await page.evaluate(() => {
      const input = document.getElementById('profile-name-input') as HTMLInputElement;
      input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        keyCode: 32,
        bubbles: true,
        cancelable: true,
      }));
    });

    const isPlaying = await page.evaluate(
        () => Boolean((window as any).Runner?.getInstance?.()?.playing));
    expect(isPlaying).toBe(false);
  });

  test('aparece game over al no esquivar un obstáculo', async ({page}) => {
    await startGame(page);
    await waitForCrash(page);
    await expect(page.locator('.runner-container')).toHaveClass(/crashed/);
  });

  test('se puede reiniciar tras game over', async ({page}) => {
    await startGame(page);
    await waitForCrash(page);

    // Runner requiere 1200ms (gameoverClearTime) antes de aceptar la tecla de reinicio.
    await page.waitForTimeout(1500);
    // Usamos page.keyboard.press (CDP) para que keyCode se establezca correctamente.
    // Enfocamos body primero para que el evento llegue al document listener de Runner.
    await page.evaluate(() => (document.body as HTMLElement).focus());
    await page.keyboard.press('Enter');

    // Tras reiniciar, Runner elimina la clase crashed
    await page.waitForFunction(
        () => !document.querySelector('.runner-container')?.classList.contains('crashed'),
        {timeout: 5000});

    await expect(page.locator('.runner-container')).not.toHaveClass(/crashed/);
  });

});

test.describe('Dino Game — high score con localStorage', () => {

  test('el high score se persiste en localStorage al crashear', async ({page}) => {
    await page.addInitScript(() => localStorage.removeItem('dino-high-score'));
    await page.goto('/');
    await page.waitForSelector('.runner-canvas', {state: 'attached'});

    await startGame(page);
    await waitForCrash(page);

    const saved = await page.evaluate(() => localStorage.getItem('dino-high-score'));
    expect(saved).not.toBeNull();
    expect(Number(saved)).toBeGreaterThan(0);
  });

  test('el high score se restaura al recargar la página', async ({page}) => {
    await page.addInitScript(() => localStorage.setItem('dino-high-score', '42'));
    await page.goto('/');
    await page.waitForSelector('.runner-canvas', {state: 'attached'});

    const score = await page.evaluate(() => localStorage.getItem('dino-high-score'));
    expect(score).toBe('42');
  });

});
