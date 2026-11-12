
import { test, expect } from "@playwright/test";

import { HomePage } from "../pages/HomePage";
import { ProductPage } from "../pages/ProductPage";

import {
  captureEvidence,
  captureClickEvidence,
} from "../utils/evidence";

test.describe("SoloTodo - Detalle de productos", () => {
  test("CP-006 - Validar navegación al detalle de un producto", async (
    { page },
    testInfo,
  ) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);

    // PASO 1: Abrir SoloTodo.
    await homePage.navigate();

    // PASO 2: Seleccionar categoría aleatoria.
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
      "CP-006 - 01 Seleccionar categoría",
    );

    await category.click();

    // PASO 3: Seleccionar subcategoría aleatoria.
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
      "CP-006 - 02 Seleccionar subcategoría",
    );

    await subcategory.click();

    // Validar URL de subcategoría.
    const expectedCategoryUrl = new URL(
      subcategoryHref!,
      "https://www.solotodo.cl",
    );

    await expect(page).toHaveURL(
      expectedCategoryUrl.href,
    );

    // PASO 4: Esperar productos e imágenes.
    await productPage.waitForProductList();

    await captureEvidence(
      page,
      testInfo,
      "CP-006 - 03 Listado de productos cargado",
    );

    // PASO 5: Obtener productos disponibles.
    const products =
      await productPage.getAvailableProducts();

    expect(
      products.length,
      "Debe existir al menos un producto disponible",
    ).toBeGreaterThan(0);

    // Seleccionar producto aleatorio.
    const product =
      products[
        Math.floor(Math.random() * products.length)
      ];

    const productName =
      await productPage.getProductName(product);

    const productHref =
      await product.getAttribute("href");

    expect(productHref).toBeTruthy();

    console.log(
      "Nombre obtenido del listado:",
      productName || "No disponible",
    );

    console.log("URL seleccionada:", productHref);

    // Evidencia antes de seleccionar producto.
    await captureClickEvidence(
      page,
      testInfo,
      product,
      "CP-006 - 04 Seleccionar producto",
    );

    await product.click();

    // PASO 6: Validar identidad del producto.
    const identity =
      await productPage.validateProductIdentity(
        productHref!,
        productName,
      );

    console.log(
      "Título de la ficha:",
      identity.detailTitle,
    );

    console.log(
      "¿Se compararon los nombres?",
      identity.nameCompared ? "Sí" : "No",
    );

    // PASO 7: Esperar imagen de la ficha.
    await productPage.waitForVisibleImages(
      "main img",
    );

    await captureEvidence(
      page,
      testInfo,
      "CP-006 - 05 Detalle del producto cargado",
    );

    // PASO 8: Registrar resultados.
    console.log("Categoría:", categoryName);
    console.log("Subcategoría:", subcategoryName);
    console.log("Producto:", productName);
    console.log("Ficha:", identity.detailTitle);
    console.log("URL final:", page.url());

    await testInfo.attach("Datos del producto", {
      body: Buffer.from(
        JSON.stringify(
          {
            casoPrueba: "CP-006",
            categoria: categoryName,
            subcategoria: subcategoryName,
            productoSeleccionado: productName,
            tituloFicha: identity.detailTitle,
            urlProducto: productHref,
            urlFinal: page.url(),
            urlValidada: true,
            nombreComparado: identity.nameCompared,
          },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
  });
});
