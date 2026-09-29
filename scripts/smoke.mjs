// End-to-end check against a running server: node scripts/smoke.mjs http://localhost:3100 <admin-password>
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3100";
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "local-admin";
const out = "scripts/screens";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const fan = await (await browser.newContext(phone)).newPage();
const admin = await (await browser.newContext(phone)).newPage();
admin.on("dialog", (d) => d.accept());

const step = (msg) => console.log(`- ${msg}`);
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png`, fullPage: true });

await fan.goto(base);
await fan.waitForSelector("text=Metro-South");
step("public Now page loads");

await admin.goto(`${base}/admin`);
await admin.waitForURL(/\/admin\/login/);
await admin.fill("#password", "wrong");
await admin.getByRole("button", { name: "Log in", exact: true }).click();
await admin.waitForSelector("text=doesn't match");
step("wrong password is rejected");
await admin.fill("#password", password);
await admin.getByRole("button", { name: "Log in", exact: true }).click();
await admin.waitForSelector("text=Ready to start");
step("admin login works");

await admin.goto(`${base}/admin/match/W1`);
await admin.getByRole("button", { name: "Start game", exact: true }).click();
await admin.waitForSelector("text=Set 1 to 25");
await admin.getByRole("button", { name: "Correct the score", exact: true }).click();
await admin.fill('[aria-label="Set 1 top team"]', "25");
await admin.fill('[aria-label="Set 1 bottom team"]', "20");
await admin.fill('[aria-label="Current points top team"]', "12");
await admin.fill('[aria-label="Current points bottom team"]', "10");
await admin.getByRole("button", { name: "Save score", exact: true }).click();
await admin.waitForSelector("text=Set 2 to 25");
await admin.click('[aria-label="Point to top team"]');
step("scored W1 to set 2, 13-10");

await fan.waitForFunction(() => document.body.innerText.includes("13"), null, { timeout: 8000 });
step("public page updated without refresh");
await shot(fan, "now-live");
await shot(admin, "admin-scorer");

await admin.getByRole("button", { name: "Correct the score", exact: true }).click();
await admin.fill('[aria-label="Set 2 top team"]', "25");
await admin.fill('[aria-label="Set 2 bottom team"]', "18");
await admin.fill('[aria-label="Current points top team"]', "0");
await admin.fill('[aria-label="Current points bottom team"]', "0");
await admin.getByRole("button", { name: "Save score", exact: true }).click();
await admin.waitForSelector("text=Advance winner");
await admin.getByRole("button", { name: "Advance winner", exact: true }).click();
await admin.waitForSelector("text=Undo advance");
const snap = await (await fetch(`${base}/api/snapshot`)).json();
const w4 = snap.matches.find((m) => m.id === "W4");
const l1 = snap.matches.find((m) => m.id === "L1");
const w1 = snap.matches.find((m) => m.id === "W1");
if (w4.teamBId !== w1.winnerId || !l1.teamAId) throw new Error("advance did not place teams");
step("W1 winner advanced to W4, loser to L1");

await admin.goto(`${base}/admin/announcements`);
await admin.fill("#announcement", "W5 moved to Court 2 at 7:15p");
await admin.getByRole("button", { name: "Post announcement", exact: true }).click();
await fan.waitForSelector("text=W5 moved to Court 2", { timeout: 8000 });
step("announcement reached the public page live");
await shot(fan, "now-announcement");

await fan.click("nav >> text=Bracket");
await fan.waitForURL(/\/bracket$/);
await fan.waitForSelector('[role="tablist"]');
await shot(fan, "bracket");
await fan.getByRole("tab", { name: "Losers" }).click();
await shot(fan, "bracket-losers");
await fan.click("nav >> text=Results");
await fan.waitForURL(/\/results$/);
await fan.waitForSelector("article");
await shot(fan, "results");
await fan.click("nav >> text=My team");
await fan.getByRole("button", { name: /Team 5$/ }).click();
await fan.waitForSelector("text=Change team");
await shot(fan, "my-team");
step("bracket, results, my team render");

await admin.goto(`${base}/admin/match/W1`);
await admin.getByRole("button", { name: "Undo advance", exact: true }).click();
await admin.waitForSelector("text=Advance winner");
await admin.getByRole("button", { name: "Clear score", exact: true }).click();
await admin.waitForSelector("text=Start game");
step("undo advance and clear score reset W1");

await browser.close();
console.log("Smoke test passed.");
