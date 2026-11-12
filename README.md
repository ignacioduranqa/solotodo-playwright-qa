
# SoloTodo QA Automation

Proyecto de automatización de pruebas funcionales sobre
[SoloTodo](https://www.solotodo.cl/), desarrollado con
**Playwright y TypeScript**, utilizando el patrón de diseño
**Page Object Model (POM)**.

El objetivo es validar funcionalidades principales de una
plataforma de comparación de precios, automatizando escenarios
de navegación, búsqueda, filtros, ordenamiento, productos,
favoritos, apariencia y autenticación.

## Tecnologías utilizadas

- Playwright
- TypeScript
- Node.js
- Page Object Model (POM)
- Git y GitHub
- GitHub Actions
- HTML Reporter de Playwright

## Casos de prueba automatizados

| ID | Funcionalidad | Escenario |
|---|---|---|
| CP-001 | Página principal | Validar carga de la página principal |
| CP-002 | Navegación | Validar navegación dinámica por categorías y subcategorías |
| CP-003 | Búsqueda | Validar búsqueda dinámica de productos |
| CP-004 | Filtros | Validar aplicación dinámica de filtros |
| CP-005 | Ordenamiento | Validar selección de criterios de ordenamiento |
| CP-006 | Productos | Validar navegación al detalle de un producto |
| CP-007 | Favoritos | Agregar, validar y eliminar productos favoritos |
| CP-008 | Apariencia | Validar cambio entre tema claro y oscuro |
| CP-009 | Autenticación | Validar inicio de sesión exitoso |
| CP-010 | Autenticación | Validar rechazo de credenciales incorrectas |

**Versión 1.0:** 10 casos de prueba implementados.

## Características del proyecto

- Selección dinámica de categorías y subcategorías.
- Interacción con productos y filtros disponibles.
- Validaciones mediante assertions de Playwright.
- Organización del código mediante Page Object Model.
- Capturas de evidencia durante la ejecución.
- Reportes HTML de resultados.
- Configuraciones independientes para pruebas funcionales
  y pruebas de autenticación.
- Protección de credenciales mediante variables de entorno.
- Integración con GitHub Actions para pruebas funcionales.

## Estructura del proyecto

```text
solotodo-playwright-qa/
|
|-- .github/
|   |-- workflows/
|       |-- playwright.yml
|
|-- pages/
|   |-- FavoritesPage.ts
|   |-- FilterPage.ts
|   |-- HomePage.ts
|   |-- LoginPage.ts
|   |-- ProductPage.ts
|   |-- SearchPage.ts
|   |-- SortPage.ts
|   |-- ThemePage.ts
|
|-- tests/
|   |-- favorites.spec.ts
|   |-- filter.spec.ts
|   |-- home.spec.ts
|   |-- login.spec.ts
|   |-- product.spec.ts
|   |-- search.spec.ts
|   |-- sort.spec.ts
|   |-- theme.spec.ts
|
|-- utils/
|   |-- evidence.ts
|
|-- .env.example
|-- .gitignore
|-- package.json
|-- playwright.config.ts
|-- playwright.auth.config.ts
|-- tsconfig.json
|-- README.md
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/USUARIO/solotodo-playwright-qa.git
cd solotodo-playwright-qa
```

Reemplazar `USUARIO` por el nombre del propietario del repositorio.

### 2. Instalar dependencias

```bash
npm ci
```

### 3. Instalar navegadores

```bash
npx playwright install
```

## Ejecución de pruebas

### Pruebas funcionales (CP-001 al CP-008)

```bash
npx playwright test --config=playwright.config.ts --project=chromium
```

### Pruebas de autenticación (CP-009 y CP-010)

Crear un archivo `.env` en la raíz del proyecto:

```env
SOLOTODO_EMAIL=correo_de_prueba
SOLOTODO_PASSWORD=contrasena_de_prueba
```

Luego ejecutar:

```bash
npx playwright test --config=playwright.auth.config.ts
```

La ejecución del CP-009 requiere credenciales válidas
de una cuenta autorizada.

### Consultar los reportes

Pruebas funcionales:

```bash
npx playwright show-report playwright-report
```

Pruebas de autenticación:

```bash
npx playwright show-report playwright-report-auth
```

## Seguridad

Las credenciales utilizadas para las pruebas de autenticación
se almacenan localmente en un archivo `.env`, excluido del
control de versiones mediante `.gitignore`.

Las pruebas de autenticación utilizan una configuración
independiente que desactiva las capturas automáticas,
los videos y las trazas de Playwright.

Los reportes de autenticación y las evidencias privadas
no se publican en el repositorio.

## Integración continua

GitHub Actions ejecuta automáticamente las pruebas
funcionales públicas en Chromium cuando se realizan
cambios en las ramas configuradas.

Las pruebas que requieren credenciales personales
no forman parte de este proceso.

## Próximas mejoras

- Incorporar nuevos casos de prueba funcionales.
- Ampliar las validaciones de ordenamiento.
- Mejorar la estabilidad de las evidencias visuales.
- Extender la cobertura a otros navegadores.
- Incorporar nuevas validaciones de historial de precios.

## Aviso

Este es un proyecto personal de práctica y portafolio
QA. No está afiliado oficialmente a SoloTodo.
```
