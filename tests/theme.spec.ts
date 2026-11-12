import { test, expect, type Locator } from "@playwright/test";

import { HomePage } from "../pages/HomePage";
import { ProductPage } from "../pages/ProductPage";

import { ThemePage, type ThemeMode } from "../pages/ThemePage";

import { captureEvidence, captureClickEvidence } from "../utils/evidence";

test.describe("SoloTodo - Cambio de tema", () => {
  test("CP-008 - Validar tema claro y oscuro en diferentes secciones", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000);

    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const themePage = new ThemePage(page);

    const changes: {
      section: string;
      previousTheme: ThemeMode;
      newTheme: ThemeMode;
      url: string;
    }[] = [];

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

    const changeTheme = async (section: string): Promise<ThemeMode> => {
      const previousTheme = await themePage.getCurrentTheme();

      const newTheme = await themePage.toggleTheme();

      expect(newTheme, `El tema debe cambiar en ${section}`).not.toBe(
        previousTheme,
      );

      await themePage.validatePageContent();

      changes.push({
        section,
        previousTheme,
        newTheme,
        url: page.url(),
      });

      return newTheme;
    };

    // Esperar imágenes visibles y correctamente cargadas.
    // No exigimos que TODAS las imágenes de la página
    // estén cargadas porque SoloTodo usa carruseles
    // y algunas imágenes se cargan bajo demanda.

    const waitForVisibleImages = async (container: Locator): Promise<void> => {
      // Primero esperamos a que existan imágenes.
      await expect
        .poll(async () => container.locator("img").count(), {
          timeout: 30000,
          message: "Esperando imágenes de productos",
        })
        .toBeGreaterThan(0);

      // Esperamos a que todas las imágenes visibles
      // dentro del contenedor estén cargadas.
      await expect
        .poll(
          async () => {
            return container.evaluate((element) => {
              const images = Array.from(element.querySelectorAll("img")).filter(
                (image) => {
                  const rect = image.getBoundingClientRect();

                  return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    rect.top < window.innerHeight &&
                    rect.bottom > 0
                  );
                },
              );

              if (images.length === 0) {
                return false;
              }

              return images.every(
                (image) => image.complete && image.naturalWidth > 0,
              );
            });
          },
          {
            timeout: 45000,
            intervals: [250, 500, 1000],
            message:
              "Esperando que todas las imágenes visibles terminen de cargar",
          },
        )
        .toBe(true);
    };

    const waitForHomeContent = async (): Promise<void> => {
      const main = page.locator("main");

      await expect(main).toBeVisible({
        timeout: 30000,
      });

      // Posicionarnos al inicio.
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      // Esperar a que aparezcan imágenes.
      await expect
        .poll(async () => main.locator("img").count(), {
          timeout: 30000,
          message: "Esperando contenido visual de la página principal",
        })
        .toBeGreaterThan(0);

      // Esperar que las imágenes visibles estén listas.
      await waitForVisibleImages(main);
    };

    // Centrar el contenido para evitar que
    // la evidencia muestre solamente el encabezado.
    const centerElement = async (locator: Locator): Promise<void> => {
      await locator.scrollIntoViewIfNeeded();

      await locator.evaluate((element) => {
        element.scrollIntoView({
          behavior: "instant",
          block: "center",
          inline: "nearest",
        });
      });

      await expect(locator).toBeVisible();
    };

    // ==========================================
    // PARTE 1: PÁGINA PRINCIPAL
    // ==========================================

    await homePage.navigate();

    await themePage.validatePageContent();

    await waitForHomeContent();

    const originalTheme = await themePage.getCurrentTheme();

    // EVIDENCIA 01
    await captureEvidence(
      page,
      testInfo,
      "CP-008 - 01 Página principal cargada - Tema inicial",
    );

    const homeTheme = await changeTheme("Página principal");

    await waitForHomeContent();

    // EVIDENCIA 02
    await captureEvidence(
      page,
      testInfo,
      "CP-008 - 02 Página principal - Tema cambiado",
    );

    // ==========================================
    // PARTE 2: CATEGORÍA ALEATORIA
    // ==========================================

    const categories = await homePage.getAvailableCategoryButtons();

    expect(
      categories.length,
      "Deben existir categorías disponibles",
    ).toBeGreaterThan(0);

    const category = categories[Math.floor(Math.random() * categories.length)];

    const categoryName = (await category.innerText()).trim();

    await category.click();

    await themePage.expectTheme(homeTheme);

    const initialSubcategories = await homePage.getAvailableSubcategoryLinks();

    expect(
      initialSubcategories.length,
      "La categoría debe mostrar subcategorías",
    ).toBeGreaterThan(0);

    await changeTheme("Menú de categoría");

    // ==========================================
    // PARTE 3: RECUPERAR MENÚ SI SE CERRÓ
    // ==========================================

    // Identificamos si hay subcategorías visibles.
    // No hacemos clic a ciegas porque eso podría
    // cerrar un menú que ya está abierto.

    const hasVisibleSubcategories = async (): Promise<boolean> => {
      const links = page.locator("header a[href]:visible");

      return (await links.count()) > 2;
    };

    if (!(await hasVisibleSubcategories())) {
      await category.click();
    }

    let subcategories: Locator[] = [];

    try {
      subcategories = await homePage.getAvailableSubcategoryLinks();
    } catch {
      // El menú pudo cerrarse después del cambio.
      await category.click();

      subcategories = await homePage.getAvailableSubcategoryLinks();
    }

    expect(
      subcategories.length,
      "Deben existir subcategorías disponibles",
    ).toBeGreaterThan(0);

    // EVIDENCIA 03
    await captureEvidence(
      page,
      testInfo,
      "CP-008 - 03 Categoría desplegada - Tema cambiado",
    );

    // ==========================================
    // PARTE 4: SUBCATEGORÍA ALEATORIA
    // ==========================================

    const subcategory =
      subcategories[Math.floor(Math.random() * subcategories.length)];

    const subcategoryName = (await subcategory.innerText()).trim();

    const subcategoryHref = await subcategory.getAttribute("href");

    expect(
      subcategoryHref,
      "La subcategoría debe tener un enlace",
    ).toBeTruthy();

    const themeBeforeNavigation = await themePage.getCurrentTheme();

    await subcategory.click();

    await expect(page).toHaveURL(
      new URL(subcategoryHref!, "https://www.solotodo.cl").href,
      {
        timeout: 30000,
      },
    );

    await themePage.expectTheme(themeBeforeNavigation);

    // ==========================================
    // PARTE 5: LISTADO DE PRODUCTOS
    // ==========================================

    await productPage.waitForProductList();

    const listTheme = await changeTheme("Listado de productos");

    await productPage.waitForProductList();

    await themePage.expectTheme(listTheme);

    const products = await productPage.getAvailableProducts();

    expect(
      products.length,
      "Debe existir al menos un producto",
    ).toBeGreaterThan(0);

    const product = products[Math.floor(Math.random() * products.length)];

    const productName = await productPage.getProductName(product);

    const productHref = await product.getAttribute("href");

    expect(productHref, "El producto debe tener un enlace").toBeTruthy();

    await centerElement(product);

    // EVIDENCIA 04
    await captureEvidence(
      page,
      testInfo,
      "CP-008 - 04 Listado de productos - Tema cambiado",
    );

    // ==========================================
    // PARTE 6: FICHA DE PRODUCTO
    // ==========================================

    const themeBeforeProduct = await themePage.getCurrentTheme();

    await product.click();

    await productPage.validateProductIdentity(productHref!, productName);

    await themePage.expectTheme(themeBeforeProduct);

    await expect(page.locator("h1").first()).toBeVisible();

    // EVIDENCIA 05
    await captureEvidence(
      page,
      testInfo,
      "CP-008 - 05 Ficha del producto - Tema actual",
    );

    // ==========================================
    // PARTE 7: CAMBIO DE TEMA EN FICHA
    // ==========================================

    await changeTheme("Ficha de producto");

    await productPage.validateProductDetail(productHref!);

    // EVIDENCIA 06
    await captureEvidence(
      page,
      testInfo,
      "CP-008 - 06 Ficha del producto - Tema cambiado",
    );

    // ==========================================
    // PARTE 8: PERSISTENCIA
    // ==========================================

    const themeBeforeReload = await themePage.getCurrentTheme();

    await themePage.reloadAndValidateTheme(themeBeforeReload);

    await productPage.validateProductDetail(productHref!);

    // EVIDENCIA 07
    await captureEvidence(
      page,
      testInfo,
      "CP-008 - 07 Tema conservado después de recargar",
    );

    // ==========================================
    // PARTE 9: RESTAURAR TEMA ORIGINAL
    // ==========================================

    await themePage.restoreTheme(originalTheme);

    await themePage.expectTheme(originalTheme);

    // EVIDENCIA 08
    await captureEvidence(
      page,
      testInfo,
      "CP-008 - 08 Tema original restaurado",
    );

    // ==========================================
    // PARTE 10: REGISTRO DE EJECUCIÓN
    // ==========================================

    await testInfo.attach("Datos CP-008", {
      body: Buffer.from(
        JSON.stringify(
          {
            casoPrueba: "CP-008",

            funcionalidad: "Cambio de tema claro y oscuro",

            temaInicial: originalTheme,

            categoria: categoryName,

            subcategoria: subcategoryName,

            producto: {
              nombre: productName,
              url: productHref,
            },

            cambiosRealizados: changes,

            persistenciaValidada: true,

            temaRestaurado: originalTheme,

            urlFinal: page.url(),
          },
          null,
          2,
        ),
      ),

      contentType: "application/json",
    });
  });
});
