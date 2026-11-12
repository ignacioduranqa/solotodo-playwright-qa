import { expect, type Locator, type Page } from "@playwright/test";

export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly productLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    // Buscador real identificado con Playwright Codegen.
    this.searchInput = page.getByRole("textbox", {
      name: "¿Qué estás buscando?",
    });

    // Enlaces de productos disponibles en SoloTodo.
    // No utiliza nombres ni marcas fijas.
    this.productLinks = page.locator('a[href^="/products/"]');
  }

  // Validar que el buscador esté disponible.
  async validateSearchInput(): Promise<void> {
    await expect(this.searchInput).toBeVisible();
    await expect(this.searchInput).toBeEnabled();
  }

  // Obtener aleatoriamente un término de búsqueda
  // desde los productos reales de la página principal.
  async getRandomProductTerm(): Promise<string> {
    await expect
      .poll(async () => this.productLinks.count(), {
        timeout: 10000,
        message: "Esperando productos disponibles",
      })
      .toBeGreaterThan(0);

    const products: string[] = [];
    const count = await this.productLinks.count();

    for (let i = 0; i < count; i++) {
      const product = this.productLinks.nth(i);

      if (!(await product.isVisible())) {
        continue;
      }

      const href = await product.getAttribute("href");

      if (!href) {
        continue;
      }

      // Ejemplo:
      // /products/253373-kingston-nv3-1-tb
      // Recuperar palabras desde el enlace.
      const slug = href.replace(/^\/products\/\d+-/, "").split("?")[0];

      const words = slug.split("-").filter((word) => word.length > 1);

      if (words.length === 0) {
        continue;
      }

      // Obtener un término corto para buscar.
      const term = words.slice(0, 2).join(" ");

      if (term.length >= 3) {
        products.push(term);
      }
    }

    expect(
      products.length,
      "Debe existir al menos un producto válido",
    ).toBeGreaterThan(0);

    // Seleccionar un término aleatorio.
    const randomIndex = Math.floor(Math.random() * products.length);

    const selectedTerm = products[randomIndex];

    console.log("Producto seleccionado aleatoriamente:", selectedTerm);

    return selectedTerm;
  }

  // Escribir el término en el buscador.
  async enterSearchTerm(term: string): Promise<void> {
    await this.validateSearchInput();

    await this.searchInput.fill(term);

    // Comprobar que se ingresó correctamente.
    await expect(this.searchInput).toHaveValue(term);
  }

  // Ejecutar la búsqueda presionando Enter.
  async submitSearch(): Promise<void> {
    // Asegurar que el buscador tenga el foco.
    await this.searchInput.click();

    // Simular Enter desde el teclado.
    await this.page.keyboard.press("Enter");

    // Espera temporal para observar la respuesta.
    // Después la reemplazaremos por una validación real.
    await this.page.waitForTimeout(1500);

    console.log("URL después de Enter:", this.page.url());

    console.log("Buscador visible:", await this.searchInput.isVisible());

    console.log(
      "Cantidad de enlaces visibles:",
      await this.page.locator("a[href]:visible").count(),
    );
  }

  async waitForSearchResults(): Promise<void> {
    // Esperar a que aparezca el título de resultados.
    await expect(
      this.page.getByText("Resultados de la búsqueda", {
        exact: true,
      }),
    ).toBeVisible({ timeout: 15000 });

    // Esperar a que aparezca al menos un producto.
    const results = this.page.locator('a[href^="/products/"]:visible');

    await expect
      .poll(async () => results.count(), {
        timeout: 20000,
        message: "Esperando productos de la búsqueda",
      })
      .toBeGreaterThan(0);

    // Esperar a que las imágenes visibles terminen
    // de cargar, sin depender de un tiempo fijo.
    await expect
      .poll(
        async () => {
          return this.page.evaluate(() => {
            const images = Array.from(
              document.querySelectorAll<HTMLImageElement>("img"),
            ).filter((img) => {
              const rect = img.getBoundingClientRect();

              return (
                rect.width > 0 &&
                rect.height > 0 &&
                rect.top < window.innerHeight &&
                rect.bottom > 0
              );
            });

            return images.every((img) => img.complete && img.naturalWidth > 0);
          });
        },
        {
          timeout: 20000,
          message: "Esperando imágenes visibles",
        },
      )
      .toBe(true);
  }
}
