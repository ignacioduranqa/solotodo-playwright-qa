
import { expect, type Locator, type Page } from "@playwright/test";

export class PriceHistoryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getHistorySection(): Locator {
    return this.page
      .getByText("Precio histórico", { exact: true })
      .locator("..");
  }

  getProductTab(): Locator {
    return this.page.getByRole("tab", {
      name: "Producto",
      exact: true,
    });
  }

  getStoreTab(): Locator {
    return this.page.getByRole("tab", {
      name: "Ver detalle",
      exact: true,
    });
  }

  async waitForProductImages(): Promise<void> {
    const images = this.page.locator("main img");

    await expect
      .poll(async () => images.count(), {
        timeout: 30000,
        message: "Esperando imágenes del producto",
      })
      .toBeGreaterThan(0);

    await expect
      .poll(
        async () => {
          return images.evaluateAll((elements) => {
            const visible = elements.filter((element) => {
              const image = element as HTMLImageElement;
              const rect = image.getBoundingClientRect();

              return (
                rect.width > 0 &&
                rect.height > 0 &&
                rect.top < window.innerHeight &&
                rect.bottom > 0
              );
            }) as HTMLImageElement[];

            return (
              visible.length > 0 &&
              visible.every(
                (image) =>
                  image.complete &&
                  image.naturalWidth > 0,
              )
            );
          });
        },
        {
          timeout: 45000,
          message:
            "Esperando que las fotografías visibles estén completamente cargadas",
        },
      )
      .toBe(true);
  }

  async openProductHistory(): Promise<void> {
    await this.getProductTab().click();

    await expect(
      this.page.getByText("Precio histórico", {
        exact: true,
      }),
    ).toBeVisible();
  }

  async openStoreHistory(): Promise<void> {
    await this.getStoreTab().click();

    await expect(
      this.page.getByText("Precio histórico por tienda", {
        exact: true,
      }),
    ).toBeVisible();
  }

  async getVisibleDateButtons(): Promise<Locator[]> {
    const buttons = this.page.getByRole("button", {
      name: /Choose date, selected date is/i,
    });

    const count = await buttons.count();
    const visible: Locator[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      if (await button.isVisible()) {
        visible.push(button);
      }
    }

    return visible;
  }

  async changeDate(index: number): Promise<void> {
    const buttons = await this.getVisibleDateButtons();

    expect(
      buttons.length,
      "Deben existir los calendarios Desde y Hasta",
    ).toBeGreaterThanOrEqual(2);

    const dateButton = buttons[index];

    await expect(dateButton).toBeVisible();
    await dateButton.click();

    const previousMonth = this.page.getByRole("button", {
      name: "Previous month",
    });

    await expect(previousMonth).toBeVisible();

    // Cambiamos al mes anterior.
    await previousMonth.click();

    // Seleccionamos un día habilitado del mes mostrado.
    const calendar = this.page.getByRole("dialog");

    const availableDays = calendar
      .getByRole("gridcell")
      .filter({ has: this.page.locator("button:not([disabled])") });

    const count = await availableDays.count();

    expect(
      count,
      "El calendario debe tener días disponibles",
    ).toBeGreaterThan(0);

    await availableDays.nth(
      Math.floor(Math.random() * count),
    ).click();
  }

  async validateHistoryVisible(): Promise<void> {
    const historyTitle = this.page.getByText(
      /Precio histórico/i,
    );

    await expect(historyTitle.first()).toBeVisible();
  }
}
