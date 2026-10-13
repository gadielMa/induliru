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

test('direct index.html links are cleaned to the short Bible URL without losing the fragment', async ({ page }) => {
  await page.goto('/biblia/index.html#linea-de-tiempo');
  await expect(page).toHaveURL(/\/biblia\/#linea-de-tiempo$/);
  await expect(page.locator('#timeline-view')).toBeVisible();
  await page.goto('/biblia/lectura/?obra=rvr1909-juan&capitulo=1');
  await expect(page.getByRole('link', { name: '← Volver a la biblioteca' })).toHaveAttribute('href', '../');
});

test('the timeline adds the divine-council arc without claiming the texts name the seventy elohim', async ({ page }) => {
  await page.goto('/biblia/#linea-de-tiempo');
  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="timeline"]').click();
  const track = page.locator('#timeline-view .timeline-track');
  for (const title of ['La torre de Babel', 'Las naciones y los hijos de Dios', 'El juicio del consejo divino', 'Pentecostés', 'La cruz, los poderes y Pentecostés']) {
    await expect(track.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: title, exact: true }) })).toHaveCount(1);
  }
  const titles = await track.locator('.timeline-event h3').allTextContents();
  expect(titles.indexOf('Las naciones y los hijos de Dios')).toBeLessThan(titles.indexOf('La torre de Babel'));
  expect(titles.indexOf('Las naciones y los hijos de Dios')).toBeLessThan(titles.indexOf('El juicio del consejo divino'));
  expect(titles.indexOf('Pentecostés')).toBeLessThan(titles.indexOf('La cruz, los poderes y Pentecostés'));
  const synthesis = track.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'La cruz, los poderes y Pentecostés', exact: true }) });
  await expect(synthesis).toContainText('ninguno de estos pasajes identifica explícitamente a esos poderes con los setenta elohim');
  await expect(synthesis.getByRole('link', { name: 'Hechos 2:1–11 · Pentecostés' })).toHaveAttribute('href', /hechos&capitulo=2/);
  for (const title of ['Las naciones y los hijos de Dios', 'El juicio del consejo divino', 'La cruz, los poderes y Pentecostés']) {
    const card = track.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
    const image = card.locator('img.timeline-image');
    await image.evaluate(element => { element.loading = 'eager'; });
    await expect.poll(() => image.evaluate(element => element.naturalWidth)).toBeGreaterThan(0);
  }
});

test('genealogy shows collateral sibling branches separately from the direct line', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/biblia/#arbol-genealogico');
  const genealogy = page.locator('#genealogy-view');
  await expect(genealogy).toBeVisible();
  const siblingNodes = genealogy.locator('.tree-family-sibling');
  await expect(siblingNodes).toHaveCount(8);
  for (const name of ['Caín', 'Abel', 'Ismael', 'Esaú', 'Leví', 'José']) {
    await expect(siblingNodes.filter({ hasText: new RegExp(`^${name}`) }).first()).toBeVisible();
  }
  const jacobBranch = genealogy.locator('.tree-jacob-children');
  await expect(jacobBranch).toContainText('Otros hijos de Jacob · hermanos de Judá');
  await expect(jacobBranch).toContainText('Rama de Leví');
  expect(await jacobBranch.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('Jacob’s siblings branch horizontally and maternal labels are explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/biblia/#arbol-genealogico');
  const tree = page.locator('.family-tree');
  const jacob = tree.locator(':scope > .tree-node.tree-family-children').filter({ hasText: /^Jacob/ });
  const siblings = tree.locator('.tree-jacob-children');
  await expect(siblings).toContainText('Otros hijos de Jacob · hermanos de Judá');
  await expect(siblings.locator('.tree-other-sons-list').first().locator('span')).toHaveCount(10);
  await expect(siblings.locator('.tree-mother-of').filter({ hasText: 'Lea' })).toContainText('Madre de:');
  expect(await siblings.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(jacob.locator('.tree-mother').first()).toHaveText('Madre: Rebeca');
  await expect(tree.locator('.tree-node.tree-family-children').filter({ hasText: /^Judá/ }).locator('.tree-mother').first()).toHaveText('Madre: Lea');
  await expect(tree.locator('.tree-node.tree-has-mother').filter({ hasText: /^Fares/ }).locator('.tree-mother')).toHaveText('Madre: Tamar');
});

test('catalog dates use a centered composition-date gradient and sort chronologically', async ({ page }) => {
  await page.goto('/biblia/');
  await expect(page.getByText('Escala temporal de composición', { exact: false })).toBeVisible();
  await expect(page.getByText(/no demuestra por sí sola la fidelidad ni la autenticidad/i)).toBeVisible();
  const nearDate = page.locator('#tbody .fecha-proximity').filter({ hasText: '~95–100 d.C.' }).first();
  const distantDate = page.locator('#tbody .fecha-proximity').filter({ hasText: 'siglo IV d.C.' }).first();
  const ancientDate = page.locator('#tbody .fecha-proximity').filter({ hasText: 'siglo X–VI a.C.' }).first();
  const nearHue = await nearDate.evaluate(element => Number.parseFloat(getComputedStyle(element).getPropertyValue('--date-hue')));
  const distantHue = await distantDate.evaluate(element => Number.parseFloat(getComputedStyle(element).getPropertyValue('--date-hue')));
  const ancientHue = await ancientDate.evaluate(element => Number.parseFloat(getComputedStyle(element).getPropertyValue('--date-hue')));
  expect(ancientHue).toBe(132);
  expect(ancientHue).toBeGreaterThan(nearHue);
  expect(nearHue).toBeGreaterThan(distantHue);
  const pillTextAlign = await nearDate.evaluate(element => getComputedStyle(element).textAlign);
  expect(pillTextAlign).toBe('center');

  const dateHeader = page.locator('th[data-col="Fecha aproximada"]');
  await dateHeader.evaluate(element => element.scrollIntoView({ block: 'nearest', inline: 'center' }));
  await dateHeader.click();
  const ascendingDates = await page.locator('#tbody .fecha-proximity').allTextContents();
  expect(ascendingDates.indexOf('~100 a.C.')).toBeLessThan(ascendingDates.indexOf('~48–55 d.C.'));
  expect(ascendingDates.indexOf('~48–55 d.C.')).toBeLessThan(ascendingDates.indexOf('~150 d.C.'));
  await dateHeader.click();
  const descendingDates = await page.locator('#tbody .fecha-proximity').allTextContents();
  expect(descendingDates.indexOf('~150 d.C.')).toBeLessThan(descendingDates.indexOf('~48–55 d.C.'));
});

test('the Shroud section is one continuous body on mobile and desktop', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/biblia/');
    await page.locator('#view-menu-toggle').click();
    await page.locator('.view-tab[data-view="shroud"]').click();
    const figure = page.locator('.bilirubin-figure');
    await expect(figure).toBeVisible();
    await expect(figure.locator('img')).toHaveJSProperty('naturalWidth', 327);
    await expect(page.locator('#shroud-view > .library-single-body')).toHaveCount(1);
    const gridDisplay = await page.locator('#shroud-view .extinct-grid').evaluate(element => getComputedStyle(element).display);
    expect(gridDisplay).toBe('block');
    const cardBorders = await page.locator('#shroud-view .extinct-card').evaluateAll(cards => cards.map(card => getComputedStyle(card).borderTopWidth));
    expect(cardBorders.every(width => width === '0px')).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('Noah, Shroud, and Israel vs Judah each render as one body without nested card boxes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/biblia/');
  for (const [view, label, heading] of [
    ['ark', 'Arca de Noé', 'El Arca de Noé'],
    ['shroud', 'Sábana Santa', 'La Sábana Santa de Turín'],
    ['kingdoms', 'Israel vs Judá', 'Israel vs Judá: el reino dividido']
  ]) {
    await page.locator('#view-menu-toggle').click();
    await page.locator(`.view-tab[data-view="${view}"]`).click();
    const section = page.locator(`#${view}-view`);
    await expect(section.locator(':scope > .library-single-body')).toHaveCount(1);
    await expect(section.getByRole('heading', { name: heading })).toBeVisible();
    const cardBorders = await section.locator('.extinct-card').evaluateAll(cards => cards.map(card => getComputedStyle(card).borderTopWidth));
    expect(cardBorders.every(width => width === '0px')).toBe(true);
    if (view === 'kingdoms') await expect(page.locator('.view-tab[data-view="kingdoms"]')).toContainText(label);
  }
});

test('all library images preserve their full source framing on mobile and desktop', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/biblia/');
    const imagePolicies = await page.locator('img').evaluateAll(images => images.map(image => ({
      src: image.getAttribute('src'),
      fit: getComputedStyle(image).objectFit,
      clip: getComputedStyle(image).clipPath
    })));
    expect(imagePolicies.length).toBeGreaterThan(20);
    expect(imagePolicies.filter(image => (image.fit !== 'contain' && !image.src.includes('leon-asiatico')) || image.clip !== 'none')).toEqual([]);
  }
});

test('portrait timeline cards reserve their full width and never overlap adjacent events', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/biblia/');
    await page.locator('#view-menu-toggle').click();
    await page.locator('.view-tab[data-view="timeline"]').click();
    await page.locator('#timeline-view .timeline-image').evaluateAll(images => {
      images.forEach(image => { image.loading = 'eager'; });
    });
    await expect.poll(() => page.locator('#timeline-view .timeline-event.is-portrait').count()).toBeGreaterThan(0);

    const layout = await page.locator('#timeline-view .timeline-event').evaluateAll(cards => cards.map(card => {
      const rect = card.getBoundingClientRect();
      const track = getComputedStyle(card.parentElement);
      return { title: card.querySelector('h3')?.textContent, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, minWidth: getComputedStyle(card).minWidth, autoColumns: track.gridAutoColumns, columns: track.gridTemplateColumns };
    }));
    const orderedLayout = [...layout].sort((first, second) => viewport.width <= 768 ? first.top - second.top : first.left - second.left);
    for (let index = 1; index < orderedLayout.length; index++) {
      if (viewport.width <= 768) expect(orderedLayout[index].top, `${orderedLayout[index - 1].title} / ${orderedLayout[index].title}`).toBeGreaterThanOrEqual(orderedLayout[index - 1].bottom - 1);
      else expect(orderedLayout[index].left, `${orderedLayout[index - 1].title} (${orderedLayout[index - 1].width}px, ${orderedLayout[index - 1].autoColumns}) / ${orderedLayout[index].title} (${orderedLayout[index].width}px, ${orderedLayout[index].autoColumns})`).toBeGreaterThanOrEqual(orderedLayout[index - 1].right - 1);
    }
  }
});

test('mobile portrait art uses its natural height and the Tartarus citation is styled', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/biblia/');
  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="ascended"]').click();
  const Moses = page.locator('#ascended-view .extinct-card').filter({ has: page.getByRole('heading', { name: 'Moisés' }) }).locator('.extinct-card-image');
  await Moses.scrollIntoViewIfNeeded();
  await expect.poll(() => Moses.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const MosesDimensions = await Moses.evaluate(image => ({ width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height, naturalRatio: image.naturalWidth / image.naturalHeight }));
  expect(MosesDimensions.width).toBeGreaterThan(300);
  expect(MosesDimensions.height / MosesDimensions.width).toBeCloseTo(1 / MosesDimensions.naturalRatio, 1);

  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="prophecies"]').click();
  const prophecy = page.locator('#prophecies-view .prophecy-card').filter({ has: page.getByRole('heading', { name: 'Mirarán al que traspasaron' }) });
  const prophecyImage = prophecy.locator('.prophecy-card-image');
  await prophecyImage.scrollIntoViewIfNeeded();
  await expect.poll(() => prophecyImage.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const prophecyDimensions = await prophecyImage.evaluate(image => ({ width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height, naturalRatio: image.naturalWidth / image.naturalHeight }));
  expect(prophecyDimensions.width).toBeGreaterThan(300);
  expect(prophecyDimensions.height / prophecyDimensions.width).toBeCloseTo(1 / prophecyDimensions.naturalRatio, 1);
  const pairedImages = page.locator('#prophecies-view .prophecy-image-pair .prophecy-card-image');
  expect(await pairedImages.first().evaluate(image => getComputedStyle(image.parentElement).gridTemplateColumns.split(' ').length)).toBe(1);

  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="afterlife"]').click();
  const quotation = page.locator('#afterlife-view .extinct-card-body > blockquote').first();
  await expect(quotation).toBeVisible();
  expect(await quotation.evaluate(element => getComputedStyle(element).borderLeftWidth)).toBe('3px');

  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="animals"]').click();
  const lion = page.locator('#extinct-view .extinct-card').filter({ has: page.getByRole('heading', { name: 'León asiático' }) }).locator('.extinct-card-image');
  await lion.scrollIntoViewIfNeeded();
  const lionRatio = await lion.evaluate(image => image.getBoundingClientRect().width / image.getBoundingClientRect().height);
  expect(lionRatio).toBeCloseTo(1.57, 1);
  expect(await lion.evaluate(image => getComputedStyle(image).objectPosition)).toMatch(/0%$/);
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
    'La tierra caótica y el Espíritu sobre las aguas',
    'Los hijos de Dios celebran la fundación de la tierra',
    'Creación del mundo y del ser humano',
    'La caída y la expulsión del Edén',
    'Caín teme ser hallado',
    'Jacobo es curado de una mordedura de víbora',
    'María Magdalena consuela a los discípulos',
    'Las diez plagas de Egipto',
    'Se abren las fuentes del gran abismo',
    'Juicio contra los dioses de Egipto',
    'Sansón',
    'Elías humilla a los profetas de Baal',
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
  const egyptJudgment = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Juicio contra los dioses de Egipto' }) });
  await expect(egyptJudgment).toContainText('no los identifica con los setenta elohim');
  await expect(egyptJudgment.getByRole('link', { name: 'Éxodo 12:12' })).toHaveAttribute('href', /obra=rvr1909-exodo&capitulo=12/);
  const abraham = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'El llamado de Abraham' }) });
  await expect(abraham).toContainText('promete dar esa tierra a su descendencia');
  const genesisBeginning = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'La tierra caótica y el Espíritu sobre las aguas' }) });
  await expect(genesisBeginning).toContainText('el Espíritu de Dios aleteaba sobre las aguas');
  const cainTitles = await page.locator('.timeline-event h3').allTextContents();
  expect(cainTitles.indexOf('Caín teme ser hallado')).toBe(cainTitles.indexOf('Caín y Abel') + 1);
  const cainFear = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Caín teme ser hallado' }) });
  await expect(cainFear).toContainText('cualquiera que me halle me matará');
  await expect(cainFear).toContainText('¿Cómo había más hombres en la tierra si Adán fue el primero?');
  await expect(cainFear).toContainText('Génesis dice después que Adán tuvo otros hijos e hijas');
  await expect(cainFear.getByRole('link', { name: 'Génesis 5:4' })).toHaveAttribute('href', /obra=rvr1909-genesis&capitulo=5#pasaje-5-4/);
  const davidGoliath = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'David derrota a Goliat' }) });
  await expect(davidGoliath).toContainText('Si los Nefilim murieron en el diluvio, ¿de dónde salió Goliat? ¿Sobrevivió?');
  await expect(davidGoliath).toContainText('La Biblia no dice que Goliat fuera un Nefilim');
  await expect(davidGoliath.getByRole('link', { name: 'Génesis 6:4', exact: true })).toHaveAttribute('href', /obra=rvr1909-genesis&capitulo=6#pasaje-6-4/);
  await expect(davidGoliath.getByRole('link', { name: '2 Samuel 21:15–22', exact: true })).toHaveAttribute('href', /obra=rvr1909-2-samuel&capitulo=21#pasaje-21-15/);
  const infancyTitles = await page.locator('.timeline-event h3').allTextContents();
  expect(infancyTitles.indexOf('Jacobo es curado de una mordedura de víbora')).toBe(infancyTitles.indexOf('Relatos del niño Jesús') + 1);
  const jamesViper = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Jacobo es curado de una mordedura de víbora' }) });
  await expect(jamesViper).toContainText('Evangelio de la infancia de Tomás cuenta que José envió a su hijo Jacobo');
  await expect(jamesViper.getByRole('link', { name: 'Evangelio de la infancia de Tomás 16:1–2' })).toHaveAttribute('href', /obra=infancy-thomas-es&capitulo=16/);
  const maryTitles = await page.locator('.timeline-event h3').allTextContents();
  expect(maryTitles.indexOf('María Magdalena consuela a los discípulos')).toBe(maryTitles.indexOf('Elección de Matías') + 1);
  const maryComforts = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'María Magdalena consuela a los discípulos' }) });
  await expect(maryComforts).toContainText('No lloréis. No os aflijáis');
  await expect(maryComforts.getByRole('link', { name: 'Evangelio de María 5:2' })).toHaveAttribute('href', /obra=gospel-mary-es&capitulo=3#pasaje-3-1/);
  const earlyTitles = await page.locator('.timeline-event h3').allTextContents();
  expect(earlyTitles.indexOf('La tierra caótica y el Espíritu sobre las aguas')).toBe(earlyTitles.indexOf('Los hijos de Dios celebran la fundación de la tierra') - 1);
  const floodTitles = await page.locator('.timeline-event h3').allTextContents();
  expect(floodTitles.indexOf('Se abren las fuentes del gran abismo')).toBe(floodTitles.indexOf('Cuarenta días y cuarenta noches de tormenta') - 1);
  const floodStart = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Se abren las fuentes del gran abismo' }) });
  await expect(floodStart).toContainText('año 600 de Noé · mes 2, día 17');
  await expect(floodStart.getByRole('link', { name: 'Génesis 7:11' })).toHaveAttribute('href', /obra=rvr1909-genesis&capitulo=7#pasaje-7-11/);
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
  await page.getByRole('button', { name: /Jesús sana al ciego/ }).click();
  const blind = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Jesús sana al ciego' }) });
  await expect(blind).toBeVisible();
  await expect(blind.locator('.timeline-image')).toHaveAttribute('src', 'assets/linea-tiempo/jesus-sana-ciego.png');
  await blind.getByRole('button', { name: /Señales de restauración/ }).click();
  await expect(page.locator('#prophecies-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Señales de restauración' })).toBeVisible();
});

test('Jesus resurrection links to the Shroud and Mary references identify Mary Magdalene', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/biblia/#linea-de-tiempo');
  const resurrection = page.locator('.timeline-event').filter({ has: page.getByRole('heading', { name: 'Resurrección de Jesús' }) });
  await resurrection.getByRole('button', { name: /Qué dicen los Evangelios/ }).click();
  await expect(page.locator('#shroud-view')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qué dicen los Evangelios' })).toBeVisible();
  await page.getByRole('button', { name: 'Secciones · Sábana Santa' }).click();
  await page.getByRole('button', { name: 'Gnosticismo' }).click();
  await expect(page.getByRole('heading', { name: /Evangelio de María Magdalena · BG 8502, pp\. 7–10/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Evangelio de María Magdalena · BG 8502, pp\. 15–19/ })).toBeVisible();
});

test('Testament of Simeon prophecy displays its image and chapter reference', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/biblia/#profecias');
  const card = page.locator('#prophecies-view .prophecy-card').filter({ has: page.getByRole('heading', { name: 'La salvación vendrá de Leví y Judá' }) });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Testamento de Simeón');
  await expect(card).toContainText('posibles interpolaciones cristianas');
  await expect(card.getByRole('link', { name: /Testamento de Simeón 7:1–3/ })).toHaveAttribute('href', /obra=testament-12-patriarchs-es&capitulo=7/);
  const image = card.locator('.prophecy-card-image');
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
});

test('Psalms of Solomon prophecy links to the restored Davidic king passage', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/biblia/#profecias');
  const card = page.locator('#prophecies-view .prophecy-card').filter({ has: page.getByRole('heading', { name: 'El Hijo de David y la vara de hierro' }) });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Con vara de hierro');
  await expect(card).toContainText('obra no canónica anterior al cristianismo');
  await expect(card.getByRole('link', { name: 'Salmos de Salomón 17:21–24' })).toHaveAttribute('href', /obra=psalms-solomon-es&capitulo=17#pasaje-17-21/);
  const image = card.locator('.prophecy-card-image');
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);

  await card.getByRole('link', { name: 'Salmos de Salomón 17:21–24' }).click();
  await expect(page.locator('#pasaje-17-21')).toContainText('el hijo de David');
  await expect(page.locator('#pasaje-17-24')).toContainText('vara de hierro');
});

test('Spanish Psalms of Solomon reader shows the complete chapters', async ({ page }) => {
  await page.goto('/biblia/lectura/?obra=psalms-solomon-es&capitulo=1');
  await expect(page.locator('#pasaje-1-8')).toContainText('cosas santas del Señor');

  await page.goto('/biblia/lectura/?obra=psalms-solomon-es&capitulo=2');
  await expect(page.locator('#pasaje-2-37')).toContainText('Bendito sea el Señor');
});

test('Jubilees calendar converts the reference date and navigates between months', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-13T12:00:00-03:00'));
  await page.goto('/biblia/#calendario-los-jubileos');

  await expect(page.getByRole('heading', { name: 'Calendario Los Jubileos' })).toBeVisible();
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

test('devil and related-figure cards are alphabetized and new ancient deities have illustrations', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/biblia/');
  await page.locator('#view-menu-toggle').click();
  await page.locator('.view-tab[data-view="devils"]').click();
  const grid = page.locator('#devils-view .extinct-grid');
  await expect(grid).toContainText('Asera / Asherah');
  await expect(grid).toContainText('Astarot / Astarté');
  await expect(grid).toContainText('Quemos / Chemosh');
  await expect(grid).toContainText('Moloc / Molok');
  await expect(grid).toContainText('Dagón');
  await expect(grid).toContainText('Tamuz / Tammuz');
  await expect(page.locator('#devils-view .extinct-intro')).toContainText('no significa que sus propias tradiciones las consideraran demonios');
  const Shemihaza = grid.locator('.extinct-card').filter({ has: page.getByRole('heading', { name: 'Shemihaza y los Vigilantes', exact: true }) });
  await expect(Shemihaza.locator('img')).toHaveAttribute('src', 'assets/enoc/vigilantes.jpg');
  await expect(Shemihaza).toContainText('no los llaman Shemihaza');

  const titles = await grid.locator(':scope > .extinct-card h3').allTextContents();
  const sortedTitles = [...titles].sort((first, second) => first.localeCompare(second, 'es', { sensitivity: 'base', numeric: true }));
  expect(titles).toEqual(sortedTitles);

  for (const slug of ['asera', 'astarte', 'quemos', 'dagon', 'tamuz', 'moloc']) {
    const image = page.locator(`#diablos-${slug} img`);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  }
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
  await expect(afterlife.getByRole('heading', { name: 'El Abismo', exact: true })).toBeAttached();
  await expect(afterlife).not.toContainText('El abismo y Abaddón');

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
