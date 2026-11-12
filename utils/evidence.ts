
import {
  expect,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';

export async function captureEvidence(
  page: Page,
  testInfo: TestInfo,
  name: string
): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({
      fullPage: false,
      animations: 'disabled',
    }),
    contentType: 'image/png',
  });
}

export async function captureClickEvidence(
  page: Page,
  testInfo: TestInfo,
  target: Locator,
  name: string
): Promise<void> {
  await expect(target).toBeVisible();
  await target.scrollIntoViewIfNeeded();

  const box = await target.boundingBox();

  if (!box) {
    throw new Error(`No se pudo localizar: ${name}`);
  }

  const id = `qa-highlight-${Date.now()}`;

  await page.evaluate(
    ({ box, id }) => {
      const highlight = document.createElement('div');

      highlight.id = id;
      highlight.style.position = 'fixed';
      highlight.style.left = `${box.x}px`;
      highlight.style.top = `${box.y}px`;
      highlight.style.width = `${box.width}px`;
      highlight.style.height = `${box.height}px`;
      highlight.style.border = '3px solid #ff0000';
      highlight.style.borderRadius = '6px';
      highlight.style.boxSizing = 'border-box';
      highlight.style.pointerEvents = 'none';
      highlight.style.zIndex = '2147483647';

      const arrow = document.createElement('div');

      arrow.textContent = '⬇';
      arrow.style.position = 'absolute';
      arrow.style.left = '50%';
      arrow.style.bottom = '100%';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.fontSize = '42px';
      arrow.style.fontWeight = 'bold';
      arrow.style.lineHeight = '1';
      arrow.style.color = '#ff0000';

      highlight.appendChild(arrow);
      document.body.appendChild(highlight);
    },
    { box, id }
  );

  try {
    await captureEvidence(page, testInfo, name);
  } finally {
    await page.evaluate((id) => {
      document.getElementById(id)?.remove();
    }, id);
  }
}
