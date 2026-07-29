const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("C:/Users/32889/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const messages = [];
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));

  await page.goto(pathToFileURL(path.join(__dirname, "index.html")).href);
  await page.screenshot({ path: path.join(__dirname, "wide-success.png"), fullPage: true });
  const wideLayout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    title: document.title,
    activeState: document.querySelector(".state-button.active")?.textContent,
  }));

  await page.getByRole("button", { name: "加载" }).click();
  await page.screenshot({ path: path.join(__dirname, "wide-loading.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "错误" }).click();
  await page.screenshot({ path: path.join(__dirname, "narrow-error.png"), fullPage: true });
  const narrowLayout = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    activeState: document.querySelector(".state-button.active")?.textContent,
    mainVisible: Boolean(document.querySelector("main")?.offsetParent),
  }));

  process.stdout.write(JSON.stringify({ wideLayout, narrowLayout, messages }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
