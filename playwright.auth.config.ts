
import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

/**
 * Proyecto: SoloTodo QA Automation
 * Tecnologías: Playwright + TypeScript
 *
 * Configuración exclusiva para pruebas de autenticación.
 *
 * CP-009: Inicio de sesión exitoso.
 * CP-010: Inicio de sesión con credenciales incorrectas.
 *
 * Seguridad:
 * - Las credenciales se obtienen desde .env.
 * - No se generan capturas automáticas.
 * - No se graban videos.
 * - No se guardan trazas.
 * - Los resultados se almacenan por separado.
 */

export default defineConfig({

  // ==========================================
  // CARPETA DE CASOS DE PRUEBA
  // ==========================================

  testDir: "./tests",

  // Ejecutar únicamente las pruebas de login.
  testMatch: ["login.spec.ts"],

  // ==========================================
  // RESULTADOS Y REPORTES
  // ==========================================

  // Carpeta separada para autenticación.
  outputDir: "./test-results/auth",

  // Evitar ejecuciones paralelas.
  fullyParallel: false,

  // Evitar test.only en GitHub Actions.
  forbidOnly: !!process.env.CI,

  // No reintentar automáticamente.
  retries: 0,

  // Ejecutar una prueba a la vez.
  workers: 1,

  // Reportes de ejecución.
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "playwright-report-auth",
        open: "never",
      },
    ],
  ],

  // ==========================================
  // CONFIGURACIÓN DEL NAVEGADOR
  // ==========================================

  use: {

    // Página principal de SoloTodo.
    baseURL: "https://www.solotodo.cl",

    // Ejecutar sin mostrar el navegador.
    headless: true,

    // ========================================
    // PROTECCIÓN DE DATOS PERSONALES
    // ========================================

    // Desactivar capturas automáticas.
    screenshot: "off",

    // Desactivar grabación de videos.
    video: "off",

    // Desactivar trazas de Playwright.
    trace: "off",

    // Tiempo máximo por acción.
    actionTimeout: 15000,

    // Tiempo máximo de navegación.
    navigationTimeout: 30000,
  },

  // ==========================================
  // TIEMPOS DE EJECUCIÓN
  // ==========================================

  // Tiempo máximo por caso de prueba.
  timeout: 60000,

  // Tiempo máximo para validaciones.
  expect: {
    timeout: 10000,
  },

  // ==========================================
  // NAVEGADORES
  // ==========================================

  // Ejecutar autenticación solo en Chromium.
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
