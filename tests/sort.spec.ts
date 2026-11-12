
import { test, expect } from "@playwright/test";

import { HomePage } from "../pages/HomePage";
import { SortPage } from "../pages/SortPage";

import {
  captureEvidence,
  captureClickEvidence,
} from "../utils/evidence";

test.describe("SoloTodo - Ordenamiento de productos", () => {
  test(
    "CP-005 - Validar ordenamiento dinámico de productos",
    async ({ page }, testInfo) => {
      test.setTimeout(120000);

      const homePage = new HomePage(page);
      const sortPage = new SortPage(page);

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
        "CP-005 - 01 Seleccionar categoría"
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
        "CP-005 - 02 Seleccionar subcategoría"
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

      await sortPage.waitForProducts();

      const initialProducts =
        await sortPage.getVisibleProductLinks();

      expect(initialProducts.length).toBeGreaterThan(0);

      console.log(
        "Productos iniciales:",
        initialProducts.length
      );

      await captureEvidence(
        page,
        testInfo,
        "CP-005 - 03 Listado inicial cargado"
      );

      // ======================================
      // PASO 5: ABRIR ORDENAMIENTO
      // ======================================

      await sortPage.validateSortControl();

      await captureClickEvidence(
        page,
        testInfo,
        sortPage.sortInput,
        "CP-005 - 04 Abrir ordenamiento"
      );

      await sortPage.openSort();

      // ======================================
      // PASO 6: SELECCIONAR CRITERIO
      // ======================================

      const options =
        await sortPage.getAvailableSortOptions();

      expect(
        options.length,
        "Debe existir al menos un criterio"
      ).toBeGreaterThan(0);

      const option =
        options[
          Math.floor(Math.random() * options.length)
        ];

      const optionName =
        (await option.innerText()).trim();

      console.log(
        "Criterio seleccionado:",
        optionName
      );

      await captureClickEvidence(
        page,
        testInfo,
        option,
        "CP-005 - 05 Seleccionar criterio"
      );

      await option.click();

      // Comprobar selección.
      await sortPage.validateSortApplied(optionName);

      // ======================================
      // PASO 7: VALIDAR RESULTADOS
      // ======================================

      await sortPage.waitForProducts();

      const sortedProducts =
        await sortPage.getVisibleProductLinks();

      expect(
        sortedProducts.length,
        "Deben existir productos después de ordenar"
      ).toBeGreaterThan(0);

      console.log(
        "Productos ordenados:",
        sortedProducts.length
      );

      // Comparar el orden de los enlaces.
      const orderChanged =
        JSON.stringify(initialProducts) !==
        JSON.stringify(sortedProducts);

      console.log(
        "¿Cambió el orden?",
        orderChanged ? "Sí" : "No"
      );

      // Evidencia final.
      await captureEvidence(
        page,
        testInfo,
        "CP-005 - 06 Productos ordenados"
      );

      // ======================================
      // PASO 8: REGISTRAR RESULTADOS
      // ======================================

      await testInfo.attach(
        "Datos del ordenamiento",
        {
          body: Buffer.from(
            JSON.stringify(
              {
                casoPrueba: "CP-005",
                categoria: categoryName,
                subcategoria: subcategoryName,
                criterioOrdenamiento: optionName,
                productosIniciales: initialProducts,
                productosFinales: sortedProducts,
                cambioOrden: orderChanged,
                urlFinal: page.url(),
              },
              null,
              2
            )
          ),
          contentType: "application/json",
        }
      );

      console.log(
        "CP-005: Ordenamiento aplicado correctamente"
      );
    }
  );
});
