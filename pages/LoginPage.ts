
import {
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==========================================
  // SELECTORES
  // ==========================================

  getUserMenuButton(): Locator {
    return this.page.locator("header button").nth(2);
  }

  getEmailInput(): Locator {
    return this.page.getByRole("textbox", {
      name: "correo@electronico.cl",
    });
  }

  getPasswordInput(): Locator {
    return this.page.getByRole("textbox", {
      name: "Contraseña",
    });
  }

  getLoginButton(): Locator {
    return this.page.getByRole("button", {
      name: "INICIAR SESIÓN",
      exact: true,
    });
  }

  getLoginError(): Locator {
    return this.page.getByText(
      "No puede iniciar sesión con las credenciales proporcionadas.",
      { exact: true }
    );
  }

  getLoginOption(): Locator {
    return this.page.getByRole("menuitem", {
      name: "Iniciar sesión",
      exact: true,
    });
  }

  getLogoutOption(): Locator {
    return this.page.getByRole("menuitem", {
      name: /cerrar sesión|salir/i,
    });
  }

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  async navigate(): Promise<void> {
    await this.page.goto("https://www.solotodo.cl/", {
      waitUntil: "domcontentloaded",
    });

    await expect(this.page.locator("body")).toBeVisible();
    await expect(this.getUserMenuButton()).toBeVisible();
  }

  // ==========================================
  // APERTURA DEL FORMULARIO
  // ==========================================

  async openLoginForm(): Promise<void> {
    // Si el formulario ya está abierto,
    // no es necesario volver a navegar.
    if (await this.getEmailInput().isVisible()) {
      return;
    }

    const userMenu = this.getUserMenuButton();

    await expect(userMenu).toBeVisible();
    await expect(userMenu).toBeEnabled();

    await userMenu.click();

    // Mostrar las opciones reales del menú
    // para facilitar la depuración.
    const menuItems = await this.page
      .getByRole("menuitem")
      .allTextContents();

    console.log("Opciones del menú:", menuItems);

    const loginOption = this.getLoginOption();

    // Si existe una sesión iniciada,
    // no continuamos con una prueba de login.
    if (await this.getLogoutOption().isVisible()) {
      throw new Error(
        "Se detectó una sesión activa. " +
        "La prueba debe comenzar sin autenticación."
      );
    }

    await expect(loginOption).toBeVisible({
      timeout: 15000,
    });

    await loginOption.click();

    await expect(this.getEmailInput()).toBeVisible({
      timeout: 15000,
    });

    await expect(this.getPasswordInput()).toBeVisible();
  }

  // ==========================================
  // COMPLETAR CREDENCIALES
  // ==========================================

  async fillCredentials(
    email: string,
    password: string
  ): Promise<void> {
    await this.getEmailInput().fill(email);
    await this.getPasswordInput().fill(password);

    await expect(this.getEmailInput()).toHaveValue(email);

    await expect(this.getPasswordInput()).toHaveValue(
      password
    );
  }

  // ==========================================
  // ENVIAR FORMULARIO
  // ==========================================

  async submitLogin(): Promise<void> {
    const loginButton = this.getLoginButton();

    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();

    await loginButton.click();
  }

  // ==========================================
  // CP-009: LOGIN EXITOSO
  // ==========================================

  async validateSuccessfulLogin(): Promise<void> {
    // Esperar que desaparezca el formulario.
    await expect(this.getLoginButton()).toBeHidden({
      timeout: 20000,
    });

    const userMenu = this.getUserMenuButton();

    await expect(userMenu).toBeVisible();
    await userMenu.click();

    // Comprobar que aparece Cerrar sesión.
    await expect(this.getLogoutOption()).toBeVisible({
      timeout: 15000,
    });
  }

  async closeUserMenu(): Promise<void> {
    await this.page.keyboard.press("Escape");

    await expect(this.getLogoutOption()).toBeHidden({
      timeout: 10000,
    });
  }

  async waitForLoginCompletion(): Promise<void> {
    await expect(this.getEmailInput()).toBeHidden({
      timeout: 20000,
    });

    await expect(this.getPasswordInput()).toBeHidden({
      timeout: 20000,
    });

    await expect(this.page.locator("body")).toBeVisible();

    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }

  // ==========================================
  // CP-010: LOGIN INCORRECTO
  // ==========================================

  async validateLoginRejected(): Promise<void> {
    // Esperar el mensaje rojo real.
    await expect(this.getLoginError()).toBeVisible({
      timeout: 15000,
    });

    // El formulario debe seguir disponible.
    await expect(this.getEmailInput()).toBeVisible();

    await expect(this.getPasswordInput()).toBeVisible();

    await expect(this.getLoginButton()).toBeVisible();
  }

  async validateCredentialsCanBeCorrected(): Promise<void> {
    const correctedEmail = "corregido@example.com";
    const correctedPassword = "NuevaClaveDePrueba123!";

    await this.getEmailInput().fill(correctedEmail);
    await this.getPasswordInput().fill(correctedPassword);

    await expect(this.getEmailInput()).toHaveValue(
      correctedEmail
    );

    await expect(this.getPasswordInput()).toHaveValue(
      correctedPassword
    );
  }
}
