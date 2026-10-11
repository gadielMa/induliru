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
  const desktopWideWidth = await toggle.evaluate(element => element.getBoundingClientRect().width);
  await page.evaluate(() => window.scrollTo(0, 120));
  await expect(navigation).not.toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo(0, 260));
  await expect(navigation).toHaveClass(/is-scrolled/);
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
