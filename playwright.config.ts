import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

/**
 * Configuración general de automatización QA.
 *
 * Proyecto: SoloTodo QA Automation
 * Tecnologías: Playwright + TypeScript
 *
 * Objetivo:
 * Ejecutar pruebas funcionales y E2E,
 * generando evidencias de cada ejecución.
 */

export default defineConfig({
  // Carpeta donde se encuentran los casos de prueba.
  testDir: "./tests",

  // Pruebas reservadas para otra configuración o versión.
  testIgnore: ["login.spec.ts", "price-history.spec.ts"],
  // Carpeta donde se guardan capturas, videos y trazas.
  outputDir: "./test-results",

  // Permitir ejecución paralela de pruebas.
  fullyParallel: true,

  // Evitar test.only en GitHub Actions.
  forbidOnly: !!process.env.CI,

  // Reintentar pruebas fallidas en CI.
  retries: process.env.CI ? 2 : 0,

  // Utilizar un worker en GitHub Actions.
  workers: process.env.CI ? 1 : undefined,

  // Reportes de resultados.
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never",
      },
    ],
  ],

  // Configuración compartida entre navegadores.
  use: {
    // URL principal del sitio que automatizaremos.
    baseURL: "https://www.solotodo.cl",

    // Guardar capturas incluso en pruebas exitosas.
    screenshot: "on",

    // Grabar videos de todas las pruebas.
    video: "on",

    // Guardar trazas completas de todas las pruebas.
    trace: "on",

    // Tiempo máximo para cada acción.
    actionTimeout: 15000,

    // Tiempo máximo para navegación.
    navigationTimeout: 30000,
  },

  // Tiempo máximo por caso de prueba.
  timeout: 60000,

  // Tiempo máximo para las validaciones expect.
  expect: {
    timeout: 10000,
  },

  // Navegadores disponibles.
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },

    // Futuramente podremos agregar pruebas móviles.
    /*
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
    */
  ],
});
