
import {
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

export type FavoriteProduct = {
  card: Locator;
  button: Locator;
  identifier: string;
  name: string;
};

export class FavoritesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==========================================
  // SELECTORES DE FAVORITOS
  // ==========================================

  private getFavoriteIconSelector(): string {
    return [
      'svg[aria-label="Agregar a favoritos"]',
      'svg[aria-label="Quitar de favoritos"]',
    ].join(", ");
  }

  getProductCards(): Locator {
    return this.page
      .locator(".MuiPaper-root")
      .filter({
        has: this.page.locator(
          this.getFavoriteIconSelector(),
        ),
      })
      .filter({
        has: this.page.locator(
          'a[href^="/products/"]',
        ),
      });
  }

  getFavoriteButton(card: Locator): Locator {
    return card
      .locator("button")
      .filter({
        has: this.page.locator(
          this.getFavoriteIconSelector(),
        ),
      })
      .first();
  }

  // ==========================================
  // IDENTIFICAR PRODUCTO
  // ==========================================

  async getProductIdentifier(
    card: Locator,
  ): Promise<string> {
    const link = card
      .locator('a[href^="/products/"]')
      .first();

    const href = await link.getAttribute("href");

    expect(
      href,
      "El producto debe tener un enlace identificable",
    ).toBeTruthy();

    return href!;
  }

  async getProductName(
    card: Locator,
  ): Promise<string> {
    const link = card
      .locator('a[href^="/products/"]')
      .first();

    const name = (
      await link.innerText()
    )
      .trim()
      .replace(/\s+/g, " ");

    if (name) {
      return name;
    }

    const image = card.locator("img[alt]").first();

    if (await image.count()) {
      const alt = await image.getAttribute("alt");

      if (alt?.trim()) {
        return alt.trim();
      }
    }

    return await this.getProductIdentifier(card);
  }

  // ==========================================
  // OBTENER PRODUCTOS DISPONIBLES
  // ==========================================

  async getAvailableProducts(
    excludedIdentifiers: string[] = [],
    requiredState?: boolean,
  ): Promise<FavoriteProduct[]> {
    const cards = this.getProductCards();

    await expect
      .poll(
        async () => cards.count(),
        {
          timeout: 30000,
          message:
            "Esperando tarjetas con botones de favoritos",
        },
      )
      .toBeGreaterThan(0);

    const available: FavoriteProduct[] = [];

    const seen = new Set<string>();

    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      if (!(await card.isVisible())) {
        continue;
      }

      const button = this.getFavoriteButton(card);

      if (!(await button.isEnabled())) {
        continue;
      }

      const identifier =
        await this.getProductIdentifier(card);

      if (
        seen.has(identifier) ||
        excludedIdentifiers.includes(identifier)
      ) {
        continue;
      }

      if (requiredState !== undefined) {
        const currentState =
          await this.isFavorite(button);

        if (currentState !== requiredState) {
          continue;
        }
      }

      seen.add(identifier);

      available.push({
        card,
        button,
        identifier,
        name: await this.getProductName(card),
      });
    }

    return available;
  }

  // ==========================================
  // SELECCIONAR PRODUCTO ALEATORIO
  // ==========================================

  async getRandomProduct(
    excludedIdentifiers: string[] = [],
    requiredState = false,
  ): Promise<FavoriteProduct> {
    const products =
      await this.getAvailableProducts(
        excludedIdentifiers,
        requiredState,
      );

    expect(
      products.length,
      "Debe existir un producto disponible con el estado solicitado",
    ).toBeGreaterThan(0);

    const index = Math.floor(
      Math.random() * products.length,
    );

    return products[index];
  }

  // ==========================================
  // VALIDAR ESTADO DEL CORAZÓN
  // ==========================================

  async isFavorite(
    button: Locator,
  ): Promise<boolean> {
    const selectedIcon = button.locator(
      'svg[aria-label="Quitar de favoritos"]',
    );

    const unselectedIcon = button.locator(
      'svg[aria-label="Agregar a favoritos"]',
    );

    if (await selectedIcon.count()) {
      return true;
    }

    if (await unselectedIcon.count()) {
      return false;
    }

    throw new Error(
      "No se pudo identificar el estado del corazón",
    );
  }

  async expectFavoriteState(
    button: Locator,
    expectedState: boolean,
  ): Promise<void> {
    const expectedLabel = expectedState
      ? "Quitar de favoritos"
      : "Agregar a favoritos";

    await expect(
      button.locator(
        `svg[aria-label="${expectedLabel}"]`,
      ),
      expectedState
        ? "El corazón debe quedar seleccionado"
        : "El corazón debe quedar desmarcado",
    ).toBeVisible({
      timeout: 10000,
    });
  }

  // ==========================================
  // CENTRAR TARJETA PARA EVIDENCIAS
  // ==========================================

  async centerProductCard(
    card: Locator,
  ): Promise<void> {
    await card.scrollIntoViewIfNeeded();

    await card.evaluate((element) => {
      element.scrollIntoView({
        behavior: "instant",
        block: "center",
        inline: "nearest",
      });
    });

    await expect(card).toBeVisible();
  }

  // ==========================================
  // ESPERAR IMAGEN DEL PRODUCTO
  // ==========================================

  async waitForProductImage(
    card: Locator,
  ): Promise<void> {
    const image = card.locator("img").first();

    if (!(await image.count())) {
      return;
    }

    await expect
      .poll(
        async () => {
          return image.evaluate(
            (element: HTMLImageElement) => {
              return (
                element.complete &&
                element.naturalWidth > 0
              );
            },
          );
        },
        {
          timeout: 30000,
          message:
            "Esperando imagen del producto seleccionado",
        },
      )
      .toBe(true);
  }

  // ==========================================
  // ENCONTRAR PRODUCTO POR IDENTIFICADOR
  // ==========================================

  getCardByIdentifier(
    identifier: string,
  ): Locator {
    return this.getProductCards()
      .filter({
        has: this.page.locator(
          `a[href="${identifier}"]`,
        ),
      })
      .first();
  }

  // ==========================================
  // ABRIR SECCIÓN DE FAVORITOS
  // ==========================================

  async openFavorites(): Promise<void> {
    const favoriteLink = this.page
      .locator("a[href]")
      .filter({
        has: this.page.locator(
          'svg[data-testid*="Favorite"], svg[data-testid*="favorite"]',
        ),
      })
      .first();

    if (await favoriteLink.count()) {
      await favoriteLink.click();
      return;
    }

    const alternativeLink = this.page.locator(
      'a[href*="favorit"], a[href*="wishlist"]',
    ).first();

    await expect(
      alternativeLink,
      "No se encontró el acceso a favoritos",
    ).toBeVisible();

    await alternativeLink.click();
  }

  // ==========================================
  // VOLVER AL INICIO
  // ==========================================

  async returnHome(): Promise<void> {
    const logo = this.page.getByRole(
      "link",
      {
        name: "logo",
      },
    );

    await expect(logo).toBeVisible();

    await logo.click();

    await expect(this.page).toHaveURL(
      "https://www.solotodo.cl/",
    );
  }
}
