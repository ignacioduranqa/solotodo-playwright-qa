
import {
  test,
  expect,
  type Page,
  type TestInfo,
  type Locator,
} from "@playwright/test";

import { LoginPage } from "../pages/LoginPage";

// ==========================================
// FUNCIÓN PARA GUARDAR EVIDENCIAS
// ==========================================

async function captureLoginEvidence(
  page: Page,
  testInfo: TestInfo,
  name: string,
  masks: Locator[] = []
): Promise<void> {
  const screenshot = await page.screenshot({
    fullPage: false,
    animations: "disabled",
    mask: masks,
    maskColor: "#808080",
  });

  await testInfo.attach(name, {
    body: screenshot,
    contentType: "image/png",
  });
}

// ==========================================
// PREPARAR SESIÓN LIMPIA
// ==========================================

async function prepareCleanSession(
  page: Page
): Promise<void> {
  // Eliminar cookies del contexto actual.
  await page.context().clearCookies();

  // Limpiar almacenamiento del navegador
  // antes de cargar SoloTodo.
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

// ==========================================
// CASOS DE PRUEBA
// ==========================================

test.describe("SoloTodo - Autenticación", () => {

  // ========================================
  // CP-009: INICIO DE SESIÓN EXITOSO
  // ========================================

  test(
    "CP-009 - Inicio de sesión exitoso",
    async ({ page }, testInfo) => {
      const loginPage = new LoginPage(page);

      const email = process.env.SOLOTODO_EMAIL;
      const password = process.env.SOLOTODO_PASSWORD;

      test.skip(
        !email || !password,
        "No se configuraron las credenciales en .env"
      );

      // PASO 1: Preparar sesión limpia.
      await prepareCleanSession(page);

      // PASO 2: Abrir SoloTodo.
      await loginPage.navigate();

      // PASO 3: Abrir formulario.
      await loginPage.openLoginForm();

      // PASO 4: Ingresar credenciales.
      await loginPage.fillCredentials(
        email!,
        password!
      );

      // PASO 5: Primera evidencia.
      await captureLoginEvidence(
        page,
        testInfo,
        "CP-009 - 01 Formulario con credenciales protegidas",
        [
          loginPage.getEmailInput(),
          loginPage.getPasswordInput(),
        ]
      );

      // PASO 6: Iniciar sesión.
      await loginPage.submitLogin();

      // PASO 7: Validar autenticación.
      await loginPage.validateSuccessfulLogin();

      await expect(page).toHaveURL(/solotodo\.cl/);

      // PASO 8: Cerrar menú.
      await loginPage.closeUserMenu();

      // PASO 9: Esperar fin de navegación.
      await loginPage.waitForLoginCompletion();

      // PASO 10: Segunda evidencia.
      await captureLoginEvidence(
        page,
        testInfo,
        "CP-009 - 02 Sesión iniciada correctamente",
        [
          loginPage.getUserMenuButton(),
          loginPage.getEmailInput(),
          loginPage.getPasswordInput(),
        ]
      );

      console.log(
        "CP-009: Inicio de sesión exitoso"
      );
    }
  );

  // ========================================
  // CP-010: CREDENCIALES INCORRECTAS
  // ========================================

  test(
    "CP-010 - Inicio de sesión con credenciales incorrectas",
    async ({ page }, testInfo) => {
      const loginPage = new LoginPage(page);

      // Datos ficticios.
      const invalidEmail =
        "usuario-inexistente@example.com";

      const invalidPassword =
        "ClaveIncorrecta123!";

      // PASO 1: Preparar sesión limpia.
      await prepareCleanSession(page);

      // PASO 2: Abrir SoloTodo.
      await loginPage.navigate();

      // PASO 3: Abrir formulario.
      await loginPage.openLoginForm();

      // PASO 4: Ingresar datos incorrectos.
      await loginPage.fillCredentials(
        invalidEmail,
        invalidPassword
      );

      // PASO 5: Primera evidencia.
      await captureLoginEvidence(
        page,
        testInfo,
        "CP-010 - 01 Formulario con datos incorrectos",
        [
          loginPage.getEmailInput(),
          loginPage.getPasswordInput(),
        ]
      );

      // PASO 6: Intentar iniciar sesión.
      await loginPage.submitLogin();

      // PASO 7: Validar mensaje rojo.
      await loginPage.validateLoginRejected();

      // PASO 8: Segunda evidencia.
      await captureLoginEvidence(
        page,
        testInfo,
        "CP-010 - 02 Mensaje de credenciales incorrectas",
        [
          loginPage.getEmailInput(),
          loginPage.getPasswordInput(),
        ]
      );

      // PASO 9: Validar corrección de datos.
      await loginPage.validateCredentialsCanBeCorrected();

      console.log(
        "CP-010: Credenciales incorrectas rechazadas"
      );
    }
  );

});
