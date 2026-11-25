import { chromium } from "playwright";
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:3000/"); await page.waitForTimeout(4500);
const c = page.locator("canvas").first(); const b = await c.boundingBox();
const clip = { x: b.x + 300, y: b.y + 300, width: 260, height: 320 };
await page.mouse.move(b.x + 250, b.y + 600, { steps: 3 }); await page.waitForTimeout(600);
await c.screenshot({ path: "C:/Users/User/AppData/Local/Temp/claude/0d46e152d014b4f4/bdcdfe50-fe95-462d-a48e-e6f52ebfa8e5/scratchpad/h-0.png" });
for (const [n, x, y] of [["peru", 412, 425], ["chile", 425, 600], ["colombia", 420, 365]]) {
  await page.mouse.move(b.x + x, b.y + y, { steps: 3 }); await page.waitForTimeout(200);
  await c.screenshot({ path: "C:/Users/User/AppData/Local/Temp/claude/0d46e152d014b4f4/bdcdfe50-fe95-462d-a48e-e6f52ebfa8e5/scratchpad/h-" + n + "-200ms.png" });
}
await browser.close();
