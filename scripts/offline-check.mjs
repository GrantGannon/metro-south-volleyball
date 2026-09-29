// Checks the service worker keeps the bracket readable offline: node scripts/offline-check.mjs http://localhost:3200
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3200";
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const page = await context.newPage();

await page.goto(base);
await page.waitForFunction(() => navigator.serviceWorker?.controller != null || navigator.serviceWorker.ready.then(() => true), null, { timeout: 15000 });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.goto(`${base}/bracket`);
await page.waitForSelector('[role="tablist"]');
console.log("- service worker ready, pages visited online");

await context.setOffline(true);
await page.goto(`${base}/bracket`);
await page.waitForSelector('[role="tablist"]', { timeout: 8000 });
await page.waitForSelector("text=Offline", { timeout: 8000 });
console.log("- /bracket loads offline and shows the offline notice");
await page.screenshot({ path: "scripts/screens/offline.png" });

await browser.close();
console.log("Offline check passed.");
