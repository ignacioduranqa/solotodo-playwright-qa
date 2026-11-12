
import { test, expect } from "@playwright/test";

import { HomePage } from "../pages/HomePage";
import { FilterPage } from "../pages/FilterPage";

import {
  captureEvidence,
  captureClickEvidence,
} from "../utils/evidence";

test.describe("SoloTodo - Filtros de productos", () => {
  test(
    "CP-004 - Validar aplicación dinámica de filtros",
    async ({ page }, testInfo) => {
      test.setTimeout(120000);

      const homePage = new HomePage(page);
      const filterPage = new FilterPage(page);

      // ======================================
      // PASO 1: ABRIR SOLOTODO
      // ======================================

      await homePage.navigate();

      // ======================================
      // PASO 2: SELECCIONAR CATEGORÍA
      // ======================================

      const categories =
        await homePage.getAvailableCategoryButtons();

      expect(categories.length).toBeGreaterThan(0);

      const category =
        categories[
          Math.floor(Math.random() * categories.length)
        ];

      const categoryName =
        (await category.innerText()).trim();

      console.log("Categoría:", categoryName);

      await captureClickEvidence(
        page,
        testInfo,
        category,
        "CP-004 - 01 Seleccionar categoría"
      );

      await category.click();

      // ======================================
      // PASO 3: SELECCIONAR SUBCATEGORÍA
      // ======================================

      const subcategories =
        await homePage.getAvailableSubcategoryLinks();

      expect(subcategories.length).toBeGreaterThan(0);

      const subcategory =
        subcategories[
          Math.floor(Math.random() * subcategories.length)
        ];

      const subcategoryName =
        (await subcategory.innerText()).trim();

      const subcategoryHref =
        await subcategory.getAttribute("href");

      expect(subcategoryHref).toBeTruthy();

      console.log("Subcategoría:", subcategoryName);

      await captureClickEvidence(
        page,
        testInfo,
        subcategory,
        "CP-004 - 02 Seleccionar subcategoría"
      );

      await subcategory.click();

      // ======================================
      // PASO 4: VALIDAR LISTADO INICIAL
      // ======================================

      const expectedUrl = new URL(
        subcategoryHref!,
        "https://www.solotodo.cl"
      );

      await expect(page).toHaveURL(expectedUrl.href);

      await filterPage.waitForFilteredProducts();

      const initialProducts =
        await filterPage.getVisibleProductLinks();

      expect(initialProducts.length).toBeGreaterThan(0);

      console.log(
        "Productos iniciales:",
        initialProducts.length
      );

      await captureEvidence(
        page,
        testInfo,
        "CP-004 - 03 Listado inicial cargado"
      );

      // ======================================
      // PASO 5: SELECCIONAR FILTRO
      // ======================================

      const filterButtons =
        await filterPage.getAvailableFilterButtons();

      expect(filterButtons.length).toBeGreaterThan(0);

      const filterButton =
        filterButtons[
          Math.floor(Math.random() * filterButtons.length)
        ];

      await captureClickEvidence(
        page,
        testInfo,
        filterButton,
        "CP-004 - 04 Abrir filtro"
      );

      await filterButton.click();

      // ======================================
      // PASO 6: SELECCIONAR OPCIÓN
      // ======================================

      const options =
        await filterPage.getAvailableOptions();

      expect(options.length).toBeGreaterThan(0);

      const option =
        options[
          Math.floor(Math.random() * options.length)
        ];

      const optionName =
        (await option.innerText()).trim();

      console.log("Opción:", optionName);

      await captureClickEvidence(
        page,
        testInfo,
        option,
        "CP-004 - 05 Seleccionar opción"
      );

      await option.click();

      // Validar que el filtro refleje
      // la opción seleccionada.
      await filterPage.validateFilterApplied(
        filterButton,
        optionName
      );

      // ======================================
      // PASO 7: VALIDAR PRODUCTOS FILTRADOS
      // ======================================

      await filterPage.waitForFilteredProducts();

      const filteredProducts =
        await filterPage.getVisibleProductLinks();

      expect(
        filteredProducts.length,
        "Deben existir productos después del filtro"
      ).toBeGreaterThan(0);

      console.log(
        "Productos filtrados:",
        filteredProducts.length
      );

      // Registrar diferencias del listado.
      const initialSet = new Set(initialProducts);

      const newProducts = filteredProducts.filter(
        (href) => !initialSet.has(href)
      );

      console.log(
        "Productos nuevos:",
        newProducts.length
      );

      // Evidencia final.
      await captureEvidence(
        page,
        testInfo,
        "CP-004 - 06 Productos filtrados cargados"
      );

      // ======================================
      // PASO 8: REGISTRAR RESULTADOS
      // ======================================

      await testInfo.attach("Datos del filtro", {
        body: Buffer.from(
          JSON.stringify(
            {
              casoPrueba: "CP-004",
              categoria: categoryName,
              subcategoria: subcategoryName,
              filtroSeleccionado: optionName,
              productosIniciales: initialProducts,
              productosFiltrados: filteredProducts,
              productosNuevos: newProducts,
              urlFinal: page.url(),
            },
            null,
            2
          )
        ),
        contentType: "application/json",
      });

      console.log(
        "CP-004: Filtro aplicado correctamente"
      );
    }
  );
});
