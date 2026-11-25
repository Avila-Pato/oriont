import { chromium } from "playwright";
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/", { waitUntil: "load" }); await page.waitForTimeout(1500); await page.mouse.move(5, 890);
const Y = () => page.evaluate(() => scrollY);
const go = async (y) => { for (let n = 0; n < 80 && Math.abs((await Y()) - y) > 60; n++) { const d = y - (await Y()); await page.mouse.wheel(0, Math.sign(d) * Math.min(100, Math.abs(d))); await page.waitForTimeout(130); } };
const art = await page.evaluate(() => document.querySelector("[data-art]").getBoundingClientRect().top + scrollY);
const state = () => page.evaluate(() => { const g = [...document.querySelectorAll("[data-sponsor-grid]")].find(x => !x.className.includes("lg:hidden")); const r = g.getBoundingClientRect();
  const vis = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)); return { pct: Math.round(100 * vis / r.height), on: [...document.querySelectorAll("[data-logo-cell][data-on]")].map(c => c.dataset.sponsor).join(",") }; });
for (const [label, dir] of [["abajo", 1], ["arriba", -1]]) {
  await go(art - 120); await page.waitForTimeout(800);
  await page.waitForFunction(() => document.querySelector("[data-logo-cell][data-on]"), null, { timeout: 15000, polling: 50 });
  const t0 = Date.now(); const log = [];
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, dir * 250); await page.waitForTimeout(60); }
  for (let i = 0; i < 30; i++) { const s = await state(); log.push(`${Date.now() - t0}ms ${s.pct}%vis on=[${s.on}]`); await page.waitForTimeout(100); }
  console.log(`Salida rápida hacia ${label}:`); console.log("  " + log.filter((_, i) => i % 2 === 0).join("\n  "));
  const before = await page.evaluate(() => document.querySelectorAll("[data-on]").length); await page.waitForTimeout(6000);
  console.log(`  6 s después fuera: logos encendidos=${await page.evaluate(() => document.querySelectorAll("[data-logo-cell][data-on]").length)} (pct ${(await state()).pct}%)`);
}
await browser.close();
