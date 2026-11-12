
import {
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

export class SortPage {
  readonly page: Page;
  readonly sortInput: Locator;
  readonly sortOptions: Locator;
  readonly sortContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // ======================================
    // SELECTORES DE ORDENAMIENTO
    // ======================================

    this.sortContainer = page
      .locator(".MuiAutocomplete-root")
      .filter({
        has: page.locator("label.MuiInputLabel-root", {
          hasText: "Ordenar por",
        }),
      });

    this.sortInput = this.sortContainer.getByRole(
      "button",
      {
        name: "Open",
        exact: true,
      },
    );

    this.sortOptions = page.getByRole("option");
  }

  // ======================================
  // VALIDAR CONTROL DE ORDENAMIENTO
  // ======================================

  async validateSortControl(): Promise<void> {
    await expect(this.sortInput).toBeVisible({
      timeout: 15000,
    });

    await expect(this.sortInput).toBeEnabled();
  }

  // ======================================
  // ABRIR ORDENAMIENTO
  // ======================================

  async openSort(): Promise<void> {
    await this.validateSortControl();

    await this.sortInput.click();

    await expect
      .poll(
        async () =>
          this.sortOptions
            .filter({ visible: true })
            .count(),
        {
          timeout: 10000,
          message: "Esperando opciones de ordenamiento",
        }
      )
      .toBeGreaterThan(0);
  }

  // ======================================
  // OBTENER CRITERIOS DISPONIBLES
  // ======================================

  async getAvailableSortOptions(): Promise<Locator[]> {
    const options = this.sortOptions.filter({
      visible: true,
    });

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

  // ======================================
  // OBTENER PRODUCTOS DEL LISTADO
  // ======================================

  async getVisibleProductLinks(): Promise<string[]> {
    const products = this.page.locator(
      'a[href^="/products/"]:visible'
    );

    const hrefs = await products.evaluateAll(
      (elements) =>
        elements
          .map((element) =>
            element.getAttribute("href")
          )
          .filter(
            (href): href is string =>
              href !== null && href.length > 0
          )
    );

    // Eliminar duplicados sin cambiar
    // el orden original del listado.
    return [...new Set(hrefs)];
  }

  // ======================================
  // VALIDAR CRITERIO SELECCIONADO
  // ======================================

  async validateSortApplied(
    selectedOption: string
  ): Promise<void> {
    const expected = selectedOption
      .trim()
      .toLowerCase();

    expect(expected.length).toBeGreaterThan(0);

    await expect
      .poll(
        async () => {
          const text = (
            await this.sortContainer.innerText()
          ).toLowerCase();

          const inputValues = await this.sortContainer
            .locator("input")
            .evaluateAll((elements) =>
              elements.map((element) =>
                (
                  element as HTMLInputElement
                ).value.trim().toLowerCase()
              )
            );

          return (
            text.includes(expected) ||
            inputValues.some(
              (value) => value === expected
            )
          );
        },
        {
          timeout: 15000,
          message:
            `Esperando criterio aplicado: ${selectedOption}`,
        }
      )
      .toBe(true);
  }

  // ======================================
  // ESPERAR PRODUCTOS E IMÁGENES
  // ======================================

  async waitForProducts(): Promise<void> {
    const products = this.page.locator(
      'a[href^="/products/"]:visible'
    );

    // PASO 1: Esperar a que existan
    // productos en el listado.
    await expect
      .poll(
        async () => products.count(),
        {
          timeout: 30000,
          message: "Esperando productos del listado",
        }
      )
      .toBeGreaterThan(0);

    // PASO 2: Regresar al inicio de la
    // página para visualizar el listado.
    await this.page.evaluate(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    });

    // PASO 3: Esperar una imagen real
    // de producto cargada correctamente.
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

    // PASO 4: Confirmar que el listado
    // sigue mostrando productos.
    await expect(products.first()).toBeVisible();
  }
}
