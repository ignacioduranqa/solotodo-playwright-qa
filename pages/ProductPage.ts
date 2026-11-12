import { expect, type Locator, type Page } from "@playwright/test";

export class ProductPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==========================================
  // OBTENER PRODUCTOS DEL LISTADO
  // ==========================================

  getProductLinks(): Locator {
    return this.page.locator('a[href^="/products/"]:visible');
  }

  // Obtener productos disponibles sin duplicados.

  async getAvailableProducts(): Promise<Locator[]> {
    const products = this.page.locator('a[href^="/products/"]:visible');

    await expect
      .poll(async () => products.count(), {
        timeout: 30000,
        message: "Esperando productos disponibles en el listado",
      })
      .toBeGreaterThan(0);

    // Guardamos las URLs en una sola lectura del DOM.
    // Así evitamos recorrer elementos nth() que
    // pueden desaparecer mientras carga el listado.
    const hrefs = await products.evaluateAll((elements) => {
      return elements
        .map((element) => element.getAttribute("href"))
        .filter(
          (href): href is string =>
            href !== null && href.startsWith("/products/"),
        );
    });

    const uniqueHrefs = [...new Set(hrefs)];

    const availableProducts: Locator[] = [];

    for (const href of uniqueHrefs) {
      const product = this.page.locator(`a[href="${href}"]:visible`).first();

      availableProducts.push(product);
    }

    return availableProducts;
  }

  // ==========================================
  // OBTENER NOMBRE DEL PRODUCTO
  // ==========================================

  async getProductName(product: Locator): Promise<string> {
    // Primero buscar un título dentro del enlace.
    const heading = product.locator("h1, h2, h3, h4, h5, h6").first();

    if (await heading.count()) {
      const name = (await heading.innerText()).trim();

      if (name.length > 0) {
        return name.replace(/\s+/g, " ");
      }
    }

    // Buscar nombre accesible.
    const ariaLabel = await product.getAttribute("aria-label");

    if (ariaLabel?.trim()) {
      return ariaLabel.trim();
    }

    // Buscar texto alternativo de la imagen.
    const image = product.locator("img[alt]").first();

    if (await image.count()) {
      const alt = await image.getAttribute("alt");

      if (alt?.trim()) {
        return alt.trim();
      }
    }

    // Si no se encuentra un nombre fiable,
    // la identidad se validará por URL.
    return "";
  }

  // ==========================================
  // NORMALIZAR NOMBRE DEL PRODUCTO
  // ==========================================

  normalizeProductName(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  // ==========================================
  // ESPERAR LISTADO DE PRODUCTOS
  // ==========================================

  async waitForProductList(): Promise<void> {
    const products = this.getProductLinks();

    // Esperar a que aparezcan productos.
    await expect
      .poll(async () => products.count(), {
        timeout: 30000,
        message: "Esperando listado de productos",
      })
      .toBeGreaterThan(0);

    // Esperar imágenes visibles del contenido.
    await this.waitForVisibleImages("main img");
  }

  // ==========================================
  // ESPERAR CARGA DE IMÁGENES
  // ==========================================

  async waitForVisibleImages(selector: string): Promise<void> {
    await expect
      .poll(
        async () => {
          return this.page.evaluate((imageSelector) => {
            const images = Array.from(
              document.querySelectorAll<HTMLImageElement>(imageSelector),
            ).filter((img) => {
              const rect = img.getBoundingClientRect();

              return (
                rect.width > 0 &&
                rect.height > 0 &&
                rect.top < window.innerHeight &&
                rect.bottom > 0
              );
            });

            // Esperar hasta encontrar imágenes.
            if (images.length === 0) {
              return false;
            }

            // Contar imágenes cargadas correctamente.
            const loadedImages = images.filter(
              (img) => img.complete && img.naturalWidth > 0,
            );

            // Comprobar que todas terminaron
            // su intento de carga.
            const allFinished = images.every((img) => img.complete);

            // Al menos una imagen debe cargar.
            // Las demás pueden haber fallado,
            // pero deben haber terminado.
            return loadedImages.length > 0 && allFinished;
          }, selector);
        },
        {
          timeout: 45000,
          message: "Esperando imágenes visibles",
        },
      )
      .toBe(true);
  }

  // ==========================================
  // VALIDAR FICHA DEL PRODUCTO
  // ==========================================

  async validateProductDetail(expectedHref: string): Promise<void> {
    const expectedUrl = new URL(expectedHref, "https://www.solotodo.cl");

    // Validar URL exacta.
    await expect(this.page).toHaveURL(expectedUrl.href, {
      timeout: 30000,
    });

    // Validar contenido visible.
    await expect(this.page.locator("body")).toBeVisible();

    // Validar título principal.
    await expect(this.page.locator("h1").first()).toBeVisible({
      timeout: 30000,
    });

    const title = await this.getDetailTitle();

    expect(title.length, "La ficha debe mostrar un título").toBeGreaterThan(0);
  }

  // Obtener título de la ficha.
  async getDetailTitle(): Promise<string> {
    return (await this.page.locator("h1").first().innerText()).trim();
  }

  // ==========================================
  // VALIDAR IDENTIDAD DEL PRODUCTO
  // ==========================================

  async validateProductIdentity(
    expectedHref: string,
    expectedName: string,
  ): Promise<{
    detailTitle: string;
    nameCompared: boolean;
  }> {
    // Validar navegación y título.
    await this.validateProductDetail(expectedHref);

    const detailTitle = await this.getDetailTitle();

    const normalizedExpected = this.normalizeProductName(expectedName);

    const normalizedActual = this.normalizeProductName(detailTitle);

    // Comparar nombres cuando el listado
    // proporciona uno identificable.
    if (normalizedExpected) {
      const namesMatch =
        normalizedActual === normalizedExpected ||
        normalizedActual.includes(normalizedExpected) ||
        normalizedExpected.includes(normalizedActual);

      expect(
        namesMatch,
        `El producto seleccionado "${expectedName}" ` +
          `no coincide con la ficha "${detailTitle}"`,
      ).toBe(true);

      return {
        detailTitle,
        nameCompared: true,
      };
    }

    // Si no existe nombre identificable,
    // mantener validación por URL.
    return {
      detailTitle,
      nameCompared: false,
    };
  }
}
