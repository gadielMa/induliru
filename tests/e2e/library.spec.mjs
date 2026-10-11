import { test, expect } from '@playwright/test';

test('the section menu responds to scrolling at mobile and desktop widths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/biblia/');
  const navigation = page.locator('#view-navigation');
  const toggle = page.locator('#view-menu-toggle');
  const mobileNavWidth = await navigation.evaluate(element => element.getBoundingClientRect().width);
  const mobileButtonWidth = await toggle.evaluate(element => element.getBoundingClientRect().width);
  expect(Math.abs(mobileNavWidth - mobileButtonWidth)).toBeLessThanOrEqual(2);
  await page.evaluate(() => window.scrollTo(0, 80));
  await expect(navigation).toHaveClass(/is-scrolled/);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(navigation).not.toHaveClass(/is-scrolled/);
  await expect.poll(() => toggle.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(1000);
  const desktopWideWidth = await toggle.evaluate(element => element.getBoundingClientRect().width);
  await page.evaluate(() => window.scrollTo(0, 120));
  await expect(navigation).not.toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 260));
  await expect(navigation).toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(() => toggle.evaluate(element => element.getBoundingClientRect().width)).toBeLessThan(desktopWideWidth * 0.95);
  const partiallyCompactWidth = await toggle.evaluate(element => element.getBoundingClientRect().width);
  expect(partiallyCompactWidth).toBeGreaterThan(desktopWideWidth * 0.5);
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect.poll(() => toggle.evaluate(element => element.getBoundingClientRect().width)).toBeLessThan(desktopWideWidth * 0.7);
});

test('the Shroud image card fits mobile and desktop without horizontal overflow', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844, columns: 1 }, { width: 1440, height: 900, columns: 3 }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/biblia/');
    await page.locator('#view-menu-toggle').click();
    await page.locator('.view-tab[data-view="shroud"]').click();
    const figure = page.locator('.bilirubin-figure');
    await expect(figure).toBeVisible();
    await expect(figure.locator('img')).toHaveJSProperty('naturalWidth', 327);
    const columns = await page.locator('#shroud-view .extinct-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(viewport.columns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('searching Gadiel opens Gaddiel in Numbers 13:11', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/biblia/');
  await page.locator('#search').fill('Gadiel');
  const result = page.locator('.text-result').filter({ hasText: 'Gaddiel hijo de Sodi' }).first();
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('href', /obra=rvr1909-numeros&capitulo=13#pasaje-13-11/);
  await result.click();
  await expect(page.locator('#capitulo-13 .passage').filter({ hasText: 'Gaddiel hijo de Sodi' })).toBeVisible();
});

test('timeline illustrations load and Isaiah links to Prophecies', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/biblia/#linea-de-tiempo');
  for (const title of [
    'La caída y la expulsión del Edén',
    'Las diez plagas de Egipto',
    'Sansón',
    'Elías es llevado en un carro de fuego',
    'Isaías y Emanuel',
    'Daniel en el foso de los leones'
  ]) {
    const card = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: title }) });
    const image = card.locator('.timeline-image');
    await expect(image).toBeVisible();
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  const isaiah = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Isaías y Emanuel' }) });
  await isaiah.getByRole('button', { name: /Emanuel y el heredero de David/ }).click();
  await expect(page.locator('#prophecies-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Emanuel y el heredero de David' })).toBeVisible();
  for (const [title, imageCount] of [
    ['El rey ungido y el Señor de David', 1],
    ['Señales de restauración', 2]
  ]) {
    const card = page.locator('.prophecy-card').filter({ has: page.getByRole('heading', { name: title }) });
    const images = card.locator('.prophecy-card-image');
    await expect(images).toHaveCount(imageCount);
    for (const image of await images.all()) {
      await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
    }
  }
});

test('timeline adds the Annunciation, Mary manuscript links, and Revelation finale', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/biblia/#linea-de-tiempo');
  for (const [title, ref] of [
    ['La anunciación a María', 'assets/timeline/anunciacion-maria.jpg'],
    ['El jinete del caballo blanco', 'assets/timeline/jinete-caballo-blanco.jpg']
  ]) {
    const card = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: title }) });
    const image = card.locator('.timeline-image');
    await expect(image).toHaveAttribute('src', ref);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  const finale = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Juicio final y nueva creación' }) });
  await expect(finale).toBeVisible();
  await expect(finale).toContainText('Apocalipsis 20:11–15 · 21:1–5');
  const annunciation = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'La anunciación a María' }) });
  await annunciation.getByRole('button', { name: /El Elegido y el Hijo del Hombre/ }).click();
  await expect(page.locator('#prophecies-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'El Elegido y el Hijo del Hombre' })).toBeVisible();
});

test('Ascendidos distingue las tradiciones y enlaza la roca y el reino con sus secciones', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/biblia/#ascendidos');
  const ascended = page.locator('#ascended-view');
  await expect(ascended).toBeVisible();
  for (const title of ['Enoc', 'Elías', 'Jesús', 'María, madre de Jesús']) {
    const card = ascended.locator('.extinct-card').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
    await expect(card).toBeVisible();
    await expect(card.locator('img')).toHaveCount(1);
  }
  await expect(ascended).toContainText('no afirma que fuera una ascensión corporal');
  await expect(ascended).toContainText('no un episodio narrado en la Biblia');

  await ascended.getByRole('button', { name: /Elías es llevado en un carro de fuego/ }).click();
  await expect(page.locator('#timeline-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Elías es llevado en un carro de fuego' })).toBeVisible();
  await page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'La Roca de Moisés' }) })
    .getByRole('button', { name: /La Roca de Moisés/ }).click();
  await expect(page.locator('#objects-view')).toBeVisible();
  await expect(page.locator('#objects-view').getByRole('heading', { name: 'La Roca de Moisés' })).toBeVisible();

  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="timeline"]').click();
  await page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'La división del reino' }) })
    .getByRole('button', { name: /Roboam y Jeroboam/ }).click();
  await expect(page.locator('#kingdoms-view')).toBeVisible();
  await expect(page.locator('#kingdoms-view').getByRole('heading', { name: 'Roboam y Jeroboam' })).toBeVisible();
});

test('extinct animals and lost places are separate views and their images load', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/biblia/#animales-extintos');
  await expect(page.locator('#extinct-view')).toBeVisible();
  await expect(page.locator('#extinct-view')).toContainText('El uro (re’em)');
  await expect(page.locator('#extinct-view')).not.toContainText('La ciudad de Enoc');

  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="lostPlaces"]').click();
  const lostPlaces = page.locator('#lost-places-view');
  await expect(lostPlaces).toBeVisible();
  for (const title of ['La ciudad de Enoc', 'Ofir', 'Nínive', 'Babilonia', 'Siquem']) {
    const card = lostPlaces.locator('.extinct-card').filter({ has: page.getByRole('heading', { name: title }) });
    await expect(card).toBeVisible();
    const image = card.locator('img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  }

  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="enoch"]').click();
  const azazel = page.locator('#enoch-view .enoch-passage').filter({ has: page.getByRole('heading', { name: 'Enoc 10:4' }) }).locator('img');
  await expect(azazel).toBeVisible();
  await expect.poll(() => azazel.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
});

test('every passage card in Gnostic traditions has a loaded illustration', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/biblia/#gnosticismo');
  const cards = page.locator('#gnosticism-view .gnostic-passages > .enoch-passage');
  await expect(cards).toHaveCount(13);
  for (const card of await cards.all()) {
    const image = card.locator('img');
    await expect(image).toHaveCount(1);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  }
});

test('Israel and Judah banner and unified Seol/Hades references display correctly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/biblia/#israel-y-juda');
  const banner = page.locator('#kingdoms-view .kingdoms-banner img');
  await expect(banner).toBeVisible();
  await expect.poll(() => banner.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);

  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="afterlife"]').click();
  const afterlife = page.locator('#afterlife-view');
  await expect(afterlife.locator('.extinct-card')).toHaveCount(5);
  const seol = afterlife.locator('.extinct-card').filter({ has: page.getByRole('heading', { name: 'Seol / Hades' }) });
  await expect(seol).toBeVisible();
  await expect(seol.locator('img')).toHaveAttribute('src', 'assets/mas-alla/seol-cueva.png');
  await expect(seol).toContainText('Evangelio de Nicodemo · descenso al Hades');
  await expect(afterlife).not.toContainText('¿Adónde van los muertos después de la victoria de Cristo?');
  const tartarus = afterlife.locator('.extinct-card').filter({ has: page.getByRole('heading', { name: 'El Tártaro / Segundo Cielo' }) });
  await expect(tartarus).toContainText('2 Pedro 2:4');
  await expect(tartarus).toContainText(/segundo cielo y el Tártaro sean el mismo lugar/i);
  await expect(tartarus.locator('img')).toHaveCount(1);
  await expect(tartarus.locator('img')).toHaveAttribute('src', 'assets/mas-alla/segundo-cielo.png');

  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="gnosticism"]').click();
  const john17 = page.locator('#gnosticism-view .enoch-passage').filter({ has: page.getByRole('heading', { name: 'Juan 17:15–16' }) });
  await expect(john17).toContainText('No ruego que los quites del mundo, sino que los guardes del mal. No son del mundo, como tampoco yo soy del mundo');
  await expect(john17).not.toContainText('paráfrasis interpretativa');
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
