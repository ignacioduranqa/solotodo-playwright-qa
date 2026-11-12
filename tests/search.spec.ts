import { test, expect } from "@playwright/test";

import { HomePage } from "../pages/HomePage";
import { SearchPage } from "../pages/SearchPage";

import { captureEvidence, captureClickEvidence } from "../utils/evidence";

test.describe("SoloTodo - Búsqueda de productos", () => {
  test("CP-003 - Validar búsqueda dinámica de productos", async ({
    page,
  }, testInfo) => {
    // Inicializar Page Objects.
    const homePage = new HomePage(page);
    const searchPage = new SearchPage(page);

    // PASO 1: Abrir la página principal.
    await homePage.navigate();

    // PASO 2: Obtener un producto aleatorio
    // directamente desde SoloTodo.
    const searchTerm = await searchPage.getRandomProductTerm();

    console.log("Término seleccionado:", searchTerm);

    // PASO 3: Validar que el buscador esté disponible.
    await searchPage.validateSearchInput();

    // Evidencia antes de seleccionar el buscador.
    await captureClickEvidence(
      page,
      testInfo,
      searchPage.searchInput,
      "CP-003 - 01 Buscador identificado",
    );

    // PASO 4: Escribir el término dinámico.
    await searchPage.enterSearchTerm(searchTerm);

    // Comprobar que el término se ingresó.
    await expect(searchPage.searchInput).toHaveValue(searchTerm);

    // Evidencia del término ingresado.
    await captureEvidence(page, testInfo, "CP-003 - 02 Producto ingresado");

    // PASO 5: Ejecutar la búsqueda.
    await searchPage.submitSearch();

    // PASO 6: Esperar a que carguen los productos
    // y sus imágenes antes de tomar la evidencia.
    await searchPage.waitForSearchResults();

    // PASO 7: Capturar los resultados cargados.
    await captureEvidence(
      page,
      testInfo,
      "CP-003 - 03 Resultados de búsqueda cargados",
    );

    // PASO 8: Registrar el resultado.
    const finalUrl = page.url();

    console.log("URL final:", finalUrl);

    // Adjuntar los datos al reporte de Playwright.
    await testInfo.attach("Datos de búsqueda dinámica", {
      body: Buffer.from(
        JSON.stringify(
          {
            casoPrueba: "CP-003",
            terminoSeleccionado: searchTerm,
            urlFinal: finalUrl,
          },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });

    // Verificar que la página continúe disponible.
    await expect(page.locator("body")).toBeVisible();
  });
});
