import { chromium } from "playwright";
const [rate = "1", runs = "5", url = "http://127.0.0.1:3000/", inject = "", strip = ""] = process.argv.slice(2);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const res = { style: [], layout: [], styleTotal: [], layoutTotal: [], firstTask: [], fcp: [] };
const browser = await chromium.launch({ args: ["--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
for (let r = 0; r < +runs; r++) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  if (inject || strip) await page.route(url, async (route) => { const r = await route.fetch(); let html = (await r.text()).replace("</head>", `<style>${inject}</style></head>`); for (const ch of strip) html = html.split(ch).join("x"); await route.fulfill({ response: r, body: html }); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: +rate });
  const ev = []; cdp.on("Tracing.dataCollected", (e) => ev.push(...e.value));
  const done = new Promise((res) => cdp.once("Tracing.tracingComplete", res));
  await cdp.send("Tracing.start", { traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline"] } });
  await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(1500);
  const fcp = await page.evaluate(() => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0);
  await cdp.send("Tracing.end"); await done;
  const pid = ev.find((e) => e.name === "UpdateLayoutTree")?.pid;
  const main = ev.filter((e) => e.pid === pid && e.dur);
  const sty = main.filter((e) => e.name === "UpdateLayoutTree"); const lay = main.filter((e) => e.name === "Layout");
  res.style.push(Math.max(...sty.map((e) => e.dur)) / 1000); res.layout.push(Math.max(...lay.map((e) => e.dur)) / 1000);
  res.styleTotal.push(sty.reduce((a, e) => a + e.dur, 0) / 1000); res.layoutTotal.push(lay.reduce((a, e) => a + e.dur, 0) / 1000);
  res.fcp.push(fcp);
  await ctx.close();
}
await browser.close();
console.log(`CPU ${rate}x (${runs} cargas, mediana): estilo mayor=${med(res.style).toFixed(1)}ms total=${med(res.styleTotal).toFixed(0)}ms · diseño mayor=${med(res.layout).toFixed(1)}ms total=${med(res.layoutTotal).toFixed(0)}ms · FCP=${med(res.fcp).toFixed(0)}ms`);
