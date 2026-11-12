
import {
  test,
  expect,
  type Locator,
} from "@playwright/test";

import { HomePage } from "../pages/HomePage";

import {
  FavoritesPage,
  type FavoriteProduct,
} from "../pages/FavoritesPage";

import {
  captureEvidence,
  captureClickEvidence,
} from "../utils/evidence";

test.describe(
  "SoloTodo - Gestión de favoritos",
  () => {
    test(
      "CP-007 - Agregar, validar y eliminar favoritos",
      async ({ page }, testInfo) => {
        test.setTimeout(180000);

        const homePage = new HomePage(page);

        const favoritesPage =
          new FavoritesPage(page);

        // ==========================================
        // FUNCIONES DE EVIDENCIA
        // ==========================================

        const captureBeforeClick = async (
          product: FavoriteProduct,
          name: string,
        ) => {
          await favoritesPage.centerProductCard(
            product.card,
          );

          await favoritesPage.waitForProductImage(
            product.card,
          );

          await captureClickEvidence(
            page,
            testInfo,
            product.button,
            name,
          );
        };

        const captureAfterClick = async (
          product: FavoriteProduct,
          name: string,
        ) => {
          await favoritesPage.centerProductCard(
            product.card,
          );

          await favoritesPage.waitForProductImage(
            product.card,
          );

          await captureEvidence(
            page,
            testInfo,
            name,
          );
        };

        // ==========================================
        // PARTE 1: FAVORITO DESDE INICIO
        // ==========================================

        await homePage.navigate();

        const firstProduct =
          await favoritesPage.getRandomProduct(
            [],
            false,
          );

        await favoritesPage.expectFavoriteState(
          firstProduct.button,
          false,
        );

        await captureBeforeClick(
          firstProduct,
          "CP-007 - 01 Antes de agregar favorito desde inicio",
        );

        await firstProduct.button.click();

        await favoritesPage.expectFavoriteState(
          firstProduct.button,
          true,
        );

        await captureAfterClick(
          firstProduct,
          "CP-007 - 02 Favorito agregado desde inicio",
        );

        // ==========================================
        // PARTE 2: CATEGORÍA ALEATORIA
        // ==========================================

        const categories =
          await homePage.getAvailableCategoryButtons();

        expect(
          categories.length,
        ).toBeGreaterThan(0);

        const category =
          categories[
            Math.floor(
              Math.random() * categories.length,
            )
          ];

        const categoryName = (
          await category.innerText()
        ).trim();

        await captureClickEvidence(
          page,
          testInfo,
          category,
          "CP-007 - 03 Seleccionar categoría",
        );

        await category.click();

        // ==========================================
        // PARTE 3: SUBCATEGORÍA ALEATORIA
        // ==========================================

        const subcategories =
          await homePage.getAvailableSubcategoryLinks();

        expect(
          subcategories.length,
        ).toBeGreaterThan(0);

        const subcategory =
          subcategories[
            Math.floor(
              Math.random() *
                subcategories.length,
            )
          ];

        const subcategoryName = (
          await subcategory.innerText()
        ).trim();

        const subcategoryHref =
          await subcategory.getAttribute("href");

        expect(subcategoryHref).toBeTruthy();

        await captureClickEvidence(
          page,
          testInfo,
          subcategory,
          "CP-007 - 04 Seleccionar subcategoría",
        );

        await subcategory.click();

        await expect(page).toHaveURL(
          new URL(
            subcategoryHref!,
            "https://www.solotodo.cl",
          ).href,
        );

        // ==========================================
        // PARTE 4: SEGUNDO FAVORITO
        // ==========================================

        const secondProduct =
          await favoritesPage.getRandomProduct(
            [firstProduct.identifier],
            false,
          );

        expect(
          secondProduct.identifier,
        ).not.toBe(firstProduct.identifier);

        await favoritesPage.expectFavoriteState(
          secondProduct.button,
          false,
        );

        await captureBeforeClick(
          secondProduct,
          "CP-007 - 05 Antes de agregar favorito desde categoría",
        );

        await secondProduct.button.click();

        await favoritesPage.expectFavoriteState(
          secondProduct.button,
          true,
        );

        await captureAfterClick(
          secondProduct,
          "CP-007 - 06 Favorito agregado desde categoría",
        );

        // ==========================================
        // PARTE 5: ELIMINAR DESDE TARJETA
        // ==========================================

        await captureBeforeClick(
          secondProduct,
          "CP-007 - 07 Eliminar favorito desde tarjeta",
        );

        await secondProduct.button.click();

        await favoritesPage.expectFavoriteState(
          secondProduct.button,
          false,
        );

        await captureAfterClick(
          secondProduct,
          "CP-007 - 08 Favorito eliminado desde tarjeta",
        );

        // ==========================================
        // PARTE 6: VOLVER A AGREGAR
        // ==========================================

        await captureBeforeClick(
          secondProduct,
          "CP-007 - 09 Volver a agregar favorito",
        );

        await secondProduct.button.click();

        await favoritesPage.expectFavoriteState(
          secondProduct.button,
          true,
        );

        await captureAfterClick(
          secondProduct,
          "CP-007 - 10 Favorito agregado nuevamente",
        );

        // ==========================================
        // PARTE 7: ABRIR FAVORITOS
        // ==========================================

        await favoritesPage.openFavorites();

        const firstFavorite =
          favoritesPage.getCardByIdentifier(
            firstProduct.identifier,
          );

        const secondFavorite =
          favoritesPage.getCardByIdentifier(
            secondProduct.identifier,
          );

        await expect(
          firstFavorite,
          "El primer producto debe aparecer en favoritos",
        ).toBeVisible({
          timeout: 30000,
        });

        await expect(
          secondFavorite,
          "El segundo producto debe aparecer en favoritos",
        ).toBeVisible({
          timeout: 30000,
        });

        await captureEvidence(
          page,
          testInfo,
          "CP-007 - 11 Ambos productos en favoritos",
        );

        // ==========================================
        // PARTE 8: ELIMINAR PRIMER FAVORITO
        // ==========================================

        const firstRemoveButton =
          favoritesPage.getFavoriteButton(
            firstFavorite,
          );

        await favoritesPage.expectFavoriteState(
          firstRemoveButton,
          true,
        );

        await favoritesPage.centerProductCard(
          firstFavorite,
        );

        await captureClickEvidence(
          page,
          testInfo,
          firstRemoveButton,
          "CP-007 - 12 Eliminar primer favorito",
        );

        await firstRemoveButton.click();

        await expect(
          firstFavorite,
          "El primer producto debe desaparecer de favoritos",
        ).toHaveCount(0, {
          timeout: 10000,
        });

        // ==========================================
        // PARTE 9: ELIMINAR SEGUNDO FAVORITO
        // ==========================================

        const secondRemoveButton =
          favoritesPage.getFavoriteButton(
            secondFavorite,
          );

        await favoritesPage.expectFavoriteState(
          secondRemoveButton,
          true,
        );

        await favoritesPage.centerProductCard(
          secondFavorite,
        );

        await captureClickEvidence(
          page,
          testInfo,
          secondRemoveButton,
          "CP-007 - 13 Eliminar segundo favorito",
        );

        await secondRemoveButton.click();

        await expect(
          secondFavorite,
          "El segundo producto debe desaparecer de favoritos",
        ).toHaveCount(0, {
          timeout: 10000,
        });

        // ==========================================
        // PARTE 10: VALIDACIÓN FINAL
        // ==========================================

        await expect(
          firstFavorite,
        ).toHaveCount(0);

        await expect(
          secondFavorite,
        ).toHaveCount(0);

        await captureEvidence(
          page,
          testInfo,
          "CP-007 - 14 Favoritos eliminados correctamente",
        );

        // ==========================================
        // DATOS DE LA EJECUCIÓN
        // ==========================================

        await testInfo.attach(
          "Datos CP-007",
          {
            body: Buffer.from(
              JSON.stringify(
                {
                  casoPrueba: "CP-007",

                  categoria: categoryName,

                  subcategoria:
                    subcategoryName,

                  productoInicio: {
                    nombre: firstProduct.name,
                    identificador:
                      firstProduct.identifier,
                  },

                  productoCategoria: {
                    nombre: secondProduct.name,
                    identificador:
                      secondProduct.identifier,
                  },

                  validaciones: {
                    agregadoDesdeInicio: true,
                    agregadoDesdeCategoria: true,
                    eliminadoDesdeTarjeta: true,
                    agregadoNuevamente: true,
                    ambosEnFavoritos: true,
                    eliminadosDesdeFavoritos: true,
                  },

                  urlFinal: page.url(),
                },
                null,
                2,
              ),
            ),

            contentType:
              "application/json",
          },
        );
      },
    );
  },
);
