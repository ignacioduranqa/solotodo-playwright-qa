
import {
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

export class FilterPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==========================================
  // SELECTORES DE FILTROS
  // ==========================================

  getFilterButtons(): Locator {
    return this.page
      .locator(".MuiAutocomplete-root")
      .filter({
        hasNot: this.page.getByText("Ordenar por", {
          exact: true,
        }),
      })
      .getByRole("button", {
        name: "Open",
        exact: true,
      });
  }

  async getAvailableFilterButtons(): Promise<Locator[]> {
    const buttons = this.getFilterButtons();

    await expect
      .poll(
        async () => buttons.filter({ visible: true }).count(),
        {
          timeout: 15000,
          message: "Esperando controles de filtros",
        }
      )
      .toBeGreaterThan(0);

    const available: Locator[] = [];
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      if (
        (await button.isVisible()) &&
        (await button.isEnabled())
      ) {
        available.push(button);
      }
    }

    return available;
  }

  getFilterContainer(button: Locator): Locator {
    return button.locator(
      "xpath=ancestor::*[contains(@class,'MuiAutocomplete-root')][1]"
    );
  }

  // ==========================================
  // OPCIONES DE FILTROS
  // ==========================================

  getVisibleOptions(): Locator {
    return this.page.getByRole("option").filter({
      visible: true,
    });
  }

  async getAvailableOptions(): Promise<Locator[]> {
    const options = this.getVisibleOptions();

    await expect
      .poll(
        async () => options.count(),
        {
          timeout: 10000,
          message: "Esperando opciones del filtro",
        }
      )
      .toBeGreaterThan(0);

    const available: Locator[] = [];
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      const option = options.nth(i);

      if (!(await option.isEnabled())) {
        continue;
      }

      const name = (await option.innerText()).trim();

      if (name.length > 0) {
        available.push(option);
      }
    }

    return available;
  }

  // ==========================================
  // PRODUCTOS
  // ==========================================

  getProductLinks(): Locator {
    return this.page.locator(
      'a[href^="/products/"]:visible'
    );
  }

  async getVisibleProductLinks(): Promise<string[]> {
    const hrefs = await this.getProductLinks().evaluateAll(
      (elements) =>
        elements
          .map((element) => element.getAttribute("href"))
          .filter(
            (href): href is string => Boolean(href)
          )
    );

    return [...new Set(hrefs)];
  }

  // ==========================================
  // VALIDAR FILTRO SELECCIONADO
  // ==========================================

  async validateFilterApplied(
    filterButton: Locator,
    selectedOption: string
  ): Promise<void> {
    const container = this.getFilterContainer(filterButton);

    await expect(container).toBeVisible();

    const selectedName = selectedOption
      .replace(/\s*\(\d+\)\s*$/, "")
      .trim();

    expect(selectedName.length).toBeGreaterThan(0);

    await expect
      .poll(
        async () => {
          const text = (
            await container.innerText()
          ).toLowerCase();

          const inputs = await container
            .locator("input")
            .evaluateAll((elements) =>
              elements.map((element) =>
                (
                  element as HTMLInputElement
                ).value.toLowerCase()
              )
            );

          const expected = selectedName.toLowerCase();

          return (
            text.includes(expected) ||
            inputs.some((value) =>
              value.includes(expected)
            )
          );
        },
        {
          timeout: 15000,
          message:
            `Esperando que el filtro muestre: ${selectedName}`,
        }
      )
      .toBe(true);
  }

  // ==========================================
  // ESPERAR PRODUCTOS E IMÁGENES
  // ==========================================

  async waitForFilteredProducts(): Promise<void> {
    const products = this.getProductLinks();

    // PASO 1: Esperar productos disponibles.
    await expect
      .poll(
        async () => products.count(),
        {
          timeout: 30000,
          message: "Esperando productos disponibles",
        }
      )
      .toBeGreaterThan(0);

    // PASO 2: Volver al inicio para que las
    // imágenes del listado entren en pantalla.
    await this.page.evaluate(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    });

    // PASO 3: Esperar al menos una imagen
    // real de producto cargada correctamente.
    await expect
      .poll(
        async () => {
          return this.page.evaluate(() => {
            const images = Array.from(
              document.querySelectorAll<HTMLImageElement>(
                'a[href^="/products/"] img'
              )
            ).filter((img) => {
              const rect = img.getBoundingClientRect();

              return (
                rect.width > 0 &&
                rect.height > 0 &&
                rect.top < window.innerHeight &&
                rect.bottom > 0
              );
            });

            if (images.length === 0) {
              return false;
            }

            return images.some(
              (img) =>
                img.complete &&
                img.naturalWidth > 0
            );
          });
        },
        {
          timeout: 30000,
          message:
            "Esperando imágenes visibles de productos",
        }
      )
      .toBe(true);

    // PASO 4: Comprobar que el listado
    // continúa mostrando productos.
    await expect(products.first()).toBeVisible();
  }
}
