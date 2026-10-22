import { test, expect } from '@playwright/test';

test('the home page is a lightweight directory of independent sections', async ({ page }) => {
  const response = await page.goto('/biblia/');
  expect((await response.body()).byteLength).toBeLessThan(6000);
  await expect(page.getByRole('heading', { name: 'La historia completa' })).toBeVisible();
  const links = page.locator('.home-sections a');
  await expect(links).toHaveCount(27);
  await expect(links.filter({ hasText: 'Línea de tiempo' })).toHaveAttribute('href', 'seccion.html?tema=linea-de-tiempo');
  await expect(page.locator('script[src]')).toHaveCount(0);
  await expect(page.locator('img')).toHaveCount(0);
});

test('a standalone section fetches only its own content', async ({ page }) => {
  const sectionRequests = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.includes('/secciones/')) sectionRequests.push(url.pathname);
  });
  await page.goto('/biblia/seccion.html?tema=pedro-traidor');
  await expect(page.getByRole('heading', { name: 'Pedro traidor', level: 1 })).toBeVisible();
  await expect(page.locator('#pedro-traidor-view')).toContainText('¿A quién llama Jesús «Satanás»?');
  expect(sectionRequests).toEqual([expect.stringMatching(/\/secciones\/pedro-traidor\.html$/)]);
  await expect(page.locator('.section-picker-links a')).toHaveCount(27);
});

test('the timeline initializes from its own module and does not load other sections', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(new URL(request.url()).pathname));
  await page.goto('/biblia/seccion.html?tema=linea-de-tiempo');
  const timeline = page.locator('#linea-de-tiempo-view');
  await expect(timeline.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Israel aparece en la estela de Merneptah' }) })).toContainText('c. 1208 a. C. · año 5 de Merneptah');
  await expect(timeline.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'El beso de María Magdalena a Jesús según el Evangelio de Felipe' }) })).toBeVisible();
  expect(requests.some(path => path.endsWith('/scripts/timeline-page.mjs'))).toBe(true);
  expect(requests.some(path => path.endsWith('/data.json'))).toBe(false);
  expect(requests.filter(path => path.includes('/secciones/'))).toEqual([expect.stringMatching(/\/secciones\/linea-tiempo\.html$/)]);
  expect(requests.some(path => path.includes('/assets/diablos/'))).toBe(false);
});

test('the section picker opens and fits very narrow phones', async ({ page }) => {
  for (const width of [320, 280]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto('/biblia/seccion.html?tema=pedro-traidor');
    const picker = page.locator('.section-picker');
    await picker.locator('summary').click();
    const links = page.locator('.section-picker-links');
    await expect(links.getByRole('link', { name: 'Israel vs Judá' })).toBeVisible();
    const bounds = await links.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    });
    expect(bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(width);
  }
});

test('the catalog is loaded only when its own page is opened', async ({ page }) => {
  const dataRequests = [];
  page.on('request', request => { if (new URL(request.url()).pathname.endsWith('/data.json')) dataRequests.push(request.url()); });
  await page.goto('/biblia/');
  expect(dataRequests).toHaveLength(0);
  await page.goto('/biblia/seccion.html?tema=catalogo');
  await expect(page.locator('#catalogo-view #row-count')).toHaveText('Mostrando 159 de 159 textos');
  expect(dataRequests).toHaveLength(1);
  await page.getByRole('searchbox', { name: /Buscar en libros/ }).fill('Génesis');
  await expect(page.locator('#catalogo-view #row-count')).not.toHaveText('Mostrando 159 de 159 textos');
});

test('the Jubilees calendar converts the reference date and navigates between months', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-13T12:00:00-03:00'));
  await page.goto('/biblia/seccion.html?tema=calendario-jubileos');
  await expect(page.getByRole('heading', { name: 'Calendario Los Jubileos', level: 1 })).toBeVisible();
  await expect(page.locator('#jubilee-today-date')).toHaveText('12 de Septiembre, año 2033');
  await expect(page.locator('#jubilee-day-number')).toHaveText('254');
  await expect(page.locator('#jubilee-month-name')).toHaveText('Septiembre');
  await expect(page.locator('#jubilee-calendar-grid .jubilee-day')).toHaveCount(31);
  await page.getByRole('button', { name: 'Mes siguiente' }).click();
  await expect(page.locator('#jubilee-month-name')).toHaveText('Octubre');
  await expect(page.locator('#jubilee-calendar-grid .jubilee-day')).toHaveCount(30);
  await page.getByRole('button', { name: 'Hoy' }).click();
  await expect(page.locator('#jubilee-month-name')).toHaveText('Septiembre');
});

test('Spanish Psalms of Solomon reader shows the complete chapters', async ({ page }) => {
  await page.goto('/biblia/lectura/?obra=psalms-solomon-es&capitulo=1');
  await expect(page.locator('#pasaje-1-8')).toContainText('cosas santas del Señor');
  await page.goto('/biblia/lectura/?obra=psalms-solomon-es&capitulo=2');
  await expect(page.locator('#pasaje-2-37')).toContainText('Bendito sea el Señor');
});

test('Spanish Apocryphon of John reader reaches the beginning and final commission', async ({ page }) => {
  await page.goto('/biblia/lectura/?obra=apocryphon-john-es&capitulo=1');
  await expect(page.getByRole('heading', { name: /Prólogo y pregunta de Juan/ })).toBeVisible();
  await expect(page.locator('.book-summary')).toBeVisible();
  await expect(page.locator('#pasaje-1-1')).toContainText('La enseñanza del salvador');
  await page.goto('/biblia/lectura/?obra=apocryphon-john-es&capitulo=21');
  await expect(page.getByRole('heading', { name: /Encargo final a Juan/ })).toBeVisible();
  await expect(page.locator('#pasaje-21-1')).toContainText('misterio de la raza inmóvil');
});

test('Spanish Bible reader navigates Numbers chapters without repeating generic titles', async ({ page }) => {
  await page.goto('/biblia/lectura/?obra=rvr1909-numeros&capitulo=14');
  await expect(page.getByRole('heading', { name: 'Capítulo 14', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Siguiente →' }).first()).toHaveAttribute('href', /obra=rvr1909-numeros&capitulo=15/);
  await page.getByRole('link', { name: 'Siguiente →' }).first().click();
  await expect(page).toHaveURL(/obra=rvr1909-numeros&capitulo=15/);
  await expect(page.getByRole('heading', { name: 'Capítulo 15', exact: true })).toBeVisible();
});

test('readers open the surviving Egerton and Oxyrhynchus gospel fragments', async ({ page }) => {
  await page.goto('/biblia/lectura/?obra=egerton-gospel-es');
  await expect(page.getByRole('heading', { name: 'Evangelio desconocido (Papiro Egerton 2)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Fragmento 1, reverso/ })).toBeVisible();
  await expect(page.locator('.book-summary')).toBeVisible();
  await expect(page.locator('#pasaje-2-2')).toContainText('Quiero; queda limpio');
  await page.goto('/biblia/lectura/?obra=oxyrhynchus-840-es');
  await expect(page.getByRole('heading', { name: 'Evangelio de Oxirrinco 840' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /La pureza verdadera/ })).toBeVisible();
  await expect(page.locator('#pasaje-2-3')).toContainText('escorpiones');
});

test('John 20 proceeds to John 21 and the last chapter proceeds to Acts 1', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/biblia/lectura/?obra=rvr1909-juan&capitulo=20');
  const next = page.locator('.chapter-navigation a[rel="next"]').first();
  await expect(next).toHaveAttribute('href', /obra=rvr1909-juan&capitulo=21/);
  await next.click();
  await expect(page.locator('.chapter-position').first()).toHaveText('Capítulo 21 de 21');
  const acts = page.locator('.chapter-navigation a[rel="next"]').first();
  await expect(acts).toContainText('Hechos 1');
  await acts.click();
  await expect(page.locator('#title')).toHaveText('Hechos');
  await expect(page.locator('.chapter-position').first()).toHaveText('Capítulo 1 de 28');
});
