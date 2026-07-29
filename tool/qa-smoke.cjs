const { chromium } = require("C:/Users/32889/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  });
  const results = [];
  for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "narrow", width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      let data = {};
      if (url.includes("businessData")) data = { turnover: 12680.5, validOrderCount: 86, orderCompletionRate: .92, unitPrice: 47.3, newUsers: 24 };
      else if (url.includes("overviewDishes")) data = { sold: 58, discontinued: 10 };
      else if (url.includes("overviewSetmeals")) data = { sold: 12, discontinued: 2 };
      else if (url.includes("overviewOrders")) data = { waitingOrders: 3, deliveredOrders: 1, completedOrders: 79, cancelledOrders: 4, allOrders: 87 };
      else if (url.includes("/shop/status")) data = 1;
      else if (url.includes("conditionSearch")) data = { total: 3, records: [
        { id: 82, number: "082", status: 2, userName: "美团外卖", orderTime: "2026-07-26 11:44:00", estimatedDeliveryTime: "2026-07-26 12:10:00", orderDishes: "毛血旺（大份）,酸菜鱼（大份）,米饭", remark: "不要香菜，多辣" },
        { id: 83, number: "083", status: 3, userName: "堂食 · A-08", orderTime: "2026-07-26 11:43:00", orderDishes: "宫保鸡丁,干煸四季豆,番茄炒蛋,米饭" },
        { id: 79, number: "079", status: 4, userName: "饿了么", orderTime: "2026-07-26 11:35:00", estimatedDeliveryTime: "2026-07-26 11:55:00", orderDishes: "红烧狮子头,清炒时蔬", remark: "少油少盐" }
      ] };
      else if (url.includes("/dish/page")) data = { total: 3, records: [{ id:1,name:"毛血旺（大份）",updateTime:"2026-07-26 11:20:00"},{id:2,name:"小炒黄牛肉",updateTime:"2026-07-26 11:18:00"}] };
      else if (url.includes("/report/top10")) data = { nameList:"毛血旺（大份）,酸菜鱼（大份）,宫保鸡丁,红烧狮子头", numberList:"36,31,28,26" };
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ code: 1, data }) });
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
    await page.goto("http://localhost:4180/login");
    await page.evaluate(() => {
      sessionStorage.setItem("ray-admin-token", "qa-only");
      sessionStorage.setItem("ray-admin-user", JSON.stringify({ name: "验收员" }));
    });
    await page.goto("http://localhost:4180/");
    await page.waitForSelector("h1");
    if (viewport.name === "desktop") {
      await page.screenshot({ path: "D:/JavaPro/ctjava/ray-java-pro-front-tg/toor/production-dashboard.png", fullPage: true });
    }
    const layout = await page.evaluate(() => ({
      title: document.title,
      heading: document.querySelector("h1")?.textContent?.trim(),
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      mainVisible: Boolean(document.querySelector("main")?.getBoundingClientRect().height)
    }));
    await page.goto("http://localhost:4180/orders");
    await page.waitForSelector("h1");
    results.push({ viewport: viewport.name, layout, routeHeading: await page.locator("h1").innerText(), errors });
    await page.close();
  }
  process.stdout.write(JSON.stringify(results, null, 2));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
