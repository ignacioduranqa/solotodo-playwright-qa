
import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly body: Locator;

  constructor(page: Page) {
    this.page = page;
    this.body = page.locator('body');
  }

  // Abrir la página principal de SoloTodo.
  async navigate(): Promise<void> {
    await this.page.goto('/', {
      waitUntil: 'domcontentloaded',
    });

    await expect(this.body).toBeVisible();
  }

  // Obtener el título de la página.
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  // Obtener los botones de categorías principales.
  // No se utilizan nombres fijos de categorías.
  getCategoryButtons(): Locator {
    return this.page.locator(
      'div.MuiBox-root:has(> div.MuiBox-root > button.MuiButton-root) > div.MuiBox-root > button.MuiButton-root'
    );
  }

  // Descubrir categorías visibles y habilitadas.
  async getAvailableCategoryButtons(): Promise<Locator[]> {
    const buttons = this.getCategoryButtons();

    await expect
      .poll(
        async () => buttons.count(),
        {
          timeout: 10000,
          message: 'Esperando categorías principales',
        }
      )
      .toBeGreaterThan(0);

    const available: Locator[] = [];
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();

      if (!isVisible || !isEnabled) {
        continue;
      }

      const name = (await button.innerText()).trim();

      if (name.length > 0) {
        available.push(button);
      }
    }

    return available;
  }

  // Buscar enlaces dentro de paneles Material UI.
  // Excluye tarjetas de productos y barra superior.
  getOpenMenuLinks(): Locator {
    return this.page.locator(
      '.MuiPaper-root:not(.MuiCard-root):not(.MuiAppBar-root) a[href]'
    );
  }

  // Descubrir subcategorías disponibles.
  async getAvailableSubcategoryLinks(): Promise<Locator[]> {
    const links = this.getOpenMenuLinks();

    // Esperar a que aparezcan enlaces visibles.
    await expect
      .poll(
        async () => {
          return links.filter({ visible: true }).count();
        },
        {
          timeout: 10000,
          message: 'Esperando subcategorías del menú',
        }
      )
      .toBeGreaterThan(0);

    const available: Locator[] = [];
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);

      if (!(await link.isVisible())) {
        continue;
      }

      const name = (await link.innerText()).trim();
      const href = await link.getAttribute('href');

      // Aceptar solamente enlaces internos válidos.
      if (
        name.length > 0 &&
        href?.startsWith('/') &&
        !href.startsWith('/products/') &&
        name.toLowerCase() !== 'ver todos'
      ) {
        available.push(link);
      }
    }

    return available;
  }
}
