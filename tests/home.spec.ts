import { expect, test } from "@playwright/test";

// Probamos el comportamiento, no la animación: con "reduced motion" el panel abre y cierra
// sin animar, así el test no depende de la velocidad del navegador (WebKit headless en
// Windows anima a ~5 fps y la salida no alcanzaba a terminar en 5 s).
test.use({ reducedMotion: "reduce" });

test("la home carga con título y encabezado principal", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Oriont/i);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("el menú lleva a cada sección", async ({ page, isMobile }) => {
  test.skip(isMobile, "en móvil los enlaces están dentro del menú hamburguesa");
  await page.goto("/");

  const nav = page.getByRole("navigation").first();
  for (const [label, id] of [
    ["Soluciones", "soluciones"],
    ["Servicios", "servicios"],
    ["Industrias", "industrias"],
    ["Nosotros", "nosotros"],
  ]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("el drawer de contacto abre y cierra", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Contáctanos" }).click();
  const drawer = page.getByRole("dialog", { name: "Contacto" });
  await expect(drawer).toBeVisible();

  // Escape cierra
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  // el botón "Cerrar" también
  await page.getByRole("link", { name: "Contáctanos" }).click();
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Cerrar" }).click();
  await expect(drawer).toBeHidden();
});

test.describe("en celular", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("el menú hamburguesa abre, lleva a la sección y se cierra", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Abrir menú" }).click();
    const cerrar = page.getByRole("button", { name: "Cerrar menú" });
    await expect(cerrar).toBeVisible();

    // en móvil los enlaces llevan número delante: "02 Servicios"
    await page.getByRole("link", { name: /Servicios$/ }).click();
    await expect(page.locator("#servicios")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
  });
});
