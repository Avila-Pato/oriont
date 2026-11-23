import { expect, test, type Page } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

// Seguro: ningún test de este archivo debe mandar un correo de verdad. Si el formulario
// llegara a llamar al endpoint (Azure Function), la petición se corta y el test falla.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/form-email**", (route) => {
    route.abort();
    throw new Error("El formulario intentó enviar un correo real durante el test");
  });
});

async function abrirFormulario(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Contáctanos" }).click();
  const drawer = page.getByRole("dialog", { name: "Contacto" });
  await expect(drawer).toBeVisible();
  return drawer;
}

test("enviar vacío muestra los errores de los campos obligatorios", async ({ page }) => {
  const drawer = await abrirFormulario(page);

  await drawer.getByRole("button", { name: "Enviar mensaje" }).click();

  await expect(drawer.getByText("Escribe tu nombre.")).toBeVisible();
  await expect(drawer.getByText("Escribe tu correo.")).toBeVisible();
  await expect(drawer.getByText("Cuéntanos en qué te podemos ayudar.")).toBeVisible();

  // el primer campo con error recibe el foco y queda marcado como inválido
  const nombre = drawer.getByRole("textbox", { name: "Nombre" });
  await expect(nombre).toBeFocused();
  await expect(nombre).toHaveAttribute("aria-invalid", "true");
});

test("valida el formato del correo, del teléfono y el largo del mensaje", async ({ page }) => {
  const drawer = await abrirFormulario(page);

  await drawer.getByRole("textbox", { name: "Nombre" }).fill("Ana");
  await drawer.getByRole("textbox", { name: "Correo" }).fill("ana@");
  await drawer.getByRole("textbox", { name: "Teléfono" }).fill("123");
  await drawer.getByRole("textbox", { name: "Mensaje" }).fill("Hola");
  await drawer.getByRole("button", { name: "Enviar mensaje" }).click();

  await expect(drawer.getByText("Revisa el correo, por ejemplo: nombre@empresa.cl")).toBeVisible();
  await expect(drawer.getByText("Revisa el número, por ejemplo: +56 9 1234 5678")).toBeVisible();
  await expect(drawer.getByText("Escribe un poco más (mínimo 10 caracteres).")).toBeVisible();
  await expect(drawer.getByText("Escribe tu nombre.")).toBeHidden();
});

test("el error desaparece al corregir el campo", async ({ page }) => {
  const drawer = await abrirFormulario(page);

  await drawer.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(drawer.getByText("Escribe tu correo.")).toBeVisible();

  await drawer.getByRole("textbox", { name: "Correo" }).fill("ana@empresa.cl");
  await expect(drawer.getByText("Escribe tu correo.")).toBeHidden();
  await expect(drawer.getByRole("textbox", { name: "Correo" })).not.toHaveAttribute("aria-invalid", "true");
});
