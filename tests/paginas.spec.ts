import { expect, test } from "@playwright/test";

test("la política de privacidad carga", async ({ page }) => {
  const res = await page.goto("/privacidad");

  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Política de privacidad/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("una URL que no existe muestra el 404 con enlace al inicio", async ({ page }) => {
  const res = await page.goto("/esta-pagina-no-existe");

  expect(res?.status()).toBe(404);
  await expect(page).toHaveTitle(/Página no encontrada/);

  await page.getByRole("link", { name: "Oriont, ir al inicio" }).click();
  await expect(page).toHaveURL("/");
});
