import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { captureEvidence, captureClickEvidence } from "../utils/evidence";

test.describe("SoloTodo - Página principal", () => {
  test("CP-001 - Validar carga de página principal", async ({
    page,
  }, testInfo) => {
    const homePage = new HomePage(page);

    await homePage.navigate();

    await expect(page).toHaveURL(/^https:\/\/www\.solotodo\.cl\/?$/);

    await expect(homePage.body).toBeVisible();

    const title = await homePage.getTitle();

    expect(title.trim().length).toBeGreaterThan(0);

    await captureEvidence(page, testInfo, "CP-001 - Página principal cargada");
  });

  test("CP-002 - Validar navegación dinámica", async ({ page }, testInfo) => {
    const homePage = new HomePage(page);

    await homePage.navigate();

    // 1. Descubrir categorías disponibles.
    const categories = await homePage.getAvailableCategoryButtons();

    expect(categories.length).toBeGreaterThan(0);

    // 2. Seleccionar una categoría aleatoria.
    const categoryIndex = Math.floor(Math.random() * categories.length);

    const categoryButton = categories[categoryIndex];

    const categoryName = (await categoryButton.innerText()).trim();

    console.log(`Categoría seleccionada: ${categoryName}`);

    // 3. Evidencia antes del clic.
    await captureClickEvidence(
      page,
      testInfo,
      categoryButton,
      `CP-002 - 01 Seleccionar ${categoryName}`,
    );

    // 4. Abrir menú.
    await categoryButton.click();
    
    const menuDebug = await page.locator("a[href]").evaluateAll((links) =>
      links
        .filter((link) => {
          const rect = link.getBoundingClientRect();

          return rect.width > 0 && rect.height > 0;
        })
        .map((link) => ({
          texto: link.textContent?.trim().slice(0, 60),
          href: link.getAttribute("href"),
          contenedor: link.closest(".MuiPaper-root")?.className,
        }))
        .slice(0, 30),
    );

    await page.screenshot({
      path: "menu-debug.png",
      fullPage: false,
    });

    console.log("Categoría:", categoryName);

    console.log(
      "Paneles Material UI:",
      await page.locator(".MuiPaper-root").count(),
    );

    console.log(
      "Enlaces dentro de paneles:",
      await page.locator(".MuiPaper-root a[href]").allTextContents(),
    );

    console.table(menuDebug);

    await testInfo.attach("Diagnóstico de enlaces visibles", {
      body: Buffer.from(JSON.stringify(menuDebug, null, 2)),
      contentType: "application/json",
    });

    // 5. Descubrir subcategorías.
    const subcategories = await homePage.getAvailableSubcategoryLinks();

    expect(subcategories.length).toBeGreaterThan(0);

    await captureEvidence(
      page,
      testInfo,
      `CP-002 - 02 Menú ${categoryName} abierto`,
    );

    // 6. Seleccionar una subcategoría.
    const subcategoryIndex = Math.floor(Math.random() * subcategories.length);

    const subcategoryLink = subcategories[subcategoryIndex];

    const subcategoryName = (await subcategoryLink.innerText()).trim();

    const href = await subcategoryLink.getAttribute("href");

    expect(href).toBeTruthy();

    console.log(`Subcategoría seleccionada: ${subcategoryName}`);

    // 7. Evidencia antes del clic.
    await captureClickEvidence(
      page,
      testInfo,
      subcategoryLink,
      `CP-002 - 03 Seleccionar ${subcategoryName}`,
    );

    // 8. Navegar.
    await subcategoryLink.click();

    // 9. Validar destino.
    const expectedUrl = new URL(href!, "https://www.solotodo.cl");

    await expect(page).toHaveURL(expectedUrl.href);

    await expect(homePage.body).toBeVisible();

    // 10. Evidencia final.
    await captureEvidence(
      page,
      testInfo,
      `CP-002 - 04 Navegación validada - ${subcategoryName}`,
    );

    await testInfo.attach("Recorrido seleccionado", {
      body: Buffer.from(
        JSON.stringify(
          {
            categoria: categoryName,
            subcategoria: subcategoryName,
            destino: expectedUrl.href,
          },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
  });
});
