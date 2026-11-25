import { chromium } from "playwright";
const rate = +process.argv[2] || 1;
const browser = await chromium.launch({ headless: false, args: ["--enable-gpu-rasterization", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate });
const events = []; cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
await cdp.send("Tracing.start", { traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.stack"] } });
await page.goto("http://127.0.0.1:3000/#servicios", { waitUntil: "load" }); await page.waitForTimeout(4000);
await cdp.send("Tracing.end"); await done;
const nav = events.find((e) => e.name === "navigationStart")?.ts ?? events[0].ts;
const mainPid = events.find((e) => e.name === "UpdateLayoutTree")?.pid;
const main = events.filter((e) => e.pid === mainPid);
const tasks = main.filter((e) => e.name === "RunTask" && e.dur > 40000);
for (const t of tasks) {
  const inside = main.filter((e) => e.tid === t.tid && e.ts >= t.ts && e.ts < t.ts + t.dur && e.dur);
  const top = {}; inside.filter((e) => ["FunctionCall", "UpdateLayoutTree", "Layout", "EvaluateScript", "ParseHTML", "v8.compile", "TimerFire", "FireAnimationFrame", "Paint", "Layerize", "HitTest", "EventDispatch", "MajorGC", "MinorGC", "v8.run"].includes(e.name)).forEach((e) => { const k = e.name + (e.args?.data?.functionName ? ":" + e.args.data.functionName : "") + (e.args?.data?.url ? "@" + e.args.data.url.split("/").pop() : ""); top[k] = (top[k] ?? 0) + e.dur / 1000; });
  console.log(`t=${((t.ts - nav) / 1000) | 0}ms tarea ${(t.dur / 1000) | 0}ms:`, Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(" | "));
}
const forced = main.filter((e) => (e.name === "UpdateLayoutTree" || e.name === "Layout") && e.dur > 3000 && e.args?.beginData?.stackTrace);
forced.forEach((e) => { const s = e.args.beginData.stackTrace; console.log(`  forzado ${(e.dur / 1000).toFixed(1)}ms t=${((e.ts - nav) / 1000) | 0}`, s.filter((f, i) => i < 2 || !/1mb9|41c3/.test(f.url)).slice(0, 5).map((f) => `${f.functionName || "anon"}@${f.url.split("/").pop()}:${f.columnNumber}`).join(" < ")); });
await browser.close();
