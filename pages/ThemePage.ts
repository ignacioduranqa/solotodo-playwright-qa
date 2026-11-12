import { expect, type Locator, type Page } from "@playwright/test";

export type ThemeMode = "light" | "dark";

export class ThemePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

// ==========================================
// LOCALIZAR EL BOTÓN DEL TEMA
// ==========================================

getThemeButton(): Locator {
  return this.page.locator("header button").nth(1);
}

  // ==========================================
  // IDENTIFICAR EL TEMA ACTUAL
  // ==========================================

  async getCurrentTheme(): Promise<ThemeMode> {
    await expect(this.page.locator("html")).toBeVisible();

    await expect
      .poll(
        async () => {
          return this.page.evaluate(() => {
            const html = document.documentElement;

            if (html.hasAttribute("data-light")) {
              return "light";
            }

            if (html.hasAttribute("data-dark")) {
              return "dark";
            }

            return "unknown";
          });
        },
        {
          timeout: 15000,
          message: "Esperando que SoloTodo establezca el tema",
        },
      )
      .not.toBe("unknown");

    const isLight = await this.page
      .locator("html")
      .evaluate((element) => element.hasAttribute("data-light"));

    return isLight ? "light" : "dark";
  }

  // ==========================================
  // VALIDAR EL TEMA
  // ==========================================

  async expectTheme(expectedTheme: ThemeMode): Promise<void> {
    const expectedAttribute =
      expectedTheme === "light" ? "data-light" : "data-dark";

    const oppositeAttribute =
      expectedTheme === "light" ? "data-dark" : "data-light";

    await expect
      .poll(
        async () => {
          return this.page.evaluate(
            ({ expected, opposite }) => {
              const html = document.documentElement;

              return (
                html.hasAttribute(expected) && !html.hasAttribute(opposite)
              );
            },
            {
              expected: expectedAttribute,
              opposite: oppositeAttribute,
            },
          );
        },
        {
          timeout: 15000,
          message: `Esperando tema ${expectedTheme}`,
        },
      )
      .toBe(true);
  }

  // ==========================================
  // CAMBIAR EL TEMA
  // ==========================================

  async toggleTheme(): Promise<ThemeMode> {
    const currentTheme = await this.getCurrentTheme();

    const nextTheme: ThemeMode = currentTheme === "light" ? "dark" : "light";

    const button = this.getThemeButton();

    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    await button.click();

    await this.expectTheme(nextTheme);

    return nextTheme;
  }

  // ==========================================
  // VALIDAR PERSISTENCIA AL RECARGAR
  // ==========================================

  async reloadAndValidateTheme(expectedTheme: ThemeMode): Promise<void> {
    await this.page.reload({
      waitUntil: "domcontentloaded",
    });

    await this.expectTheme(expectedTheme);
  }

  // ==========================================
  // RESTAURAR EL TEMA ORIGINAL
  // ==========================================

  async restoreTheme(originalTheme: ThemeMode): Promise<void> {
    const currentTheme = await this.getCurrentTheme();

    if (currentTheme !== originalTheme) {
      await this.toggleTheme();
    }

    await this.expectTheme(originalTheme);
  }

  // ==========================================
  // VALIDAR QUE LA PÁGINA SIGA FUNCIONANDO
  // ==========================================

  async validatePageContent(): Promise<void> {
    await expect(this.page.locator("body")).toBeVisible();

    await expect(this.getThemeButton()).toBeVisible();
  }
}
