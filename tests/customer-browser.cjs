const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  let passed = 0;
  try {
    for (const scenario of [
      "success",
      "payment-failure",
      "brew-failure",
      "partial",
    ]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1100 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const click = (name) =>
        page.getByRole("button", { name, exact: true }).click();
      await page.goto("http://127.0.0.1:5173");
      await click("Khách mua cà phê");
      assert.equal(
        await page.getByRole("option", { name: /RB-006/ }).evaluate(option => option.disabled),
        true,
      );
      await page.getByLabel("Đồ uống", { exact: true }).selectOption("milk");
      await page
        .getByLabel("Số lượng", { exact: true })
        .fill(scenario === "partial" ? "3" : "1");
      await click("Tạo đơn hàng");
      assert.equal(
        await page
          .getByRole("button", { name: "Bắt đầu pha chế", exact: true })
          .count(),
        0,
      );
      if (scenario === "payment-failure") await click("Thanh toán thất bại");
      else {
        await click("Thanh toán thành công");
        await page.reload();
        await click("Đơn hàng"); // resume from persisted state
        await click("Bắt đầu pha chế");
        await click(
          scenario === "brew-failure"
            ? "Ly 1 pha thất bại"
            : "Ly 1 pha thành công",
        );
        if (scenario === "partial") {
          await click("Ly 2 pha thất bại");
          await click("Ly 3 pha thành công");
        }
      }
      let state = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("cukcuk-v2")),
      );
      const order = state.sales[0];
      const revenue =
        scenario === "success" ? 35000 : scenario === "partial" ? 70000 : 0;
      assert.equal(
        order.status,
        {
          success: "completed",
          "payment-failure": "payment_failed",
          "brew-failure": "failed",
          partial: "partially_fulfilled",
        }[scenario],
      );
      assert.equal(state.robots[0].stock[1], 65 - (revenue / 35000) * 3);
      assert.equal(
        order.refundAmount,
        ["brew-failure", "partial"].includes(scenario) ? 35000 : 0,
      );
      if (order.refundAmount) assert.equal(state.incidents.length, 1);
      await click("Báo cáo");
      const summary = page.getByRole("region", {
        name: "Báo cáo đơn mô phỏng",
      });
      assert.match(
        await summary.innerText(),
        new RegExp(revenue.toLocaleString("vi-VN").replaceAll(".", "\\.")),
      );
      const downloadPromise = page.waitForEvent("download");
      await click("Xuất báo cáo");
      const download = await downloadPromise;
      const csv = await fs.readFile(await download.path(), "utf8");
      assert(csv.includes('"' + (6510000 + revenue) + '"'));
      assert(csv.includes("Cần hoàn đơn mới"));
      await page.reload();
      await click("Đơn hàng");
      assert.equal(
        await page.getByRole("button", { name: /Ly 1 pha thành/ }).count(),
        0,
      );
      const reloaded = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("cukcuk-v2")),
      );
      assert.deepEqual(reloaded, state);
      await click("Khách mua cà phê");
      await page.screenshot({
        path: `/tmp/cukcuk-customer-${scenario}.png`,
        fullPage: true,
      });
      for (const width of [1024, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
          `overflow ${width}`,
        );
      }
      assert.deepEqual(errors, []);
      passed++;
      console.log(`PASS customer browser: ${scenario}`);
      await context.close();
    }
    console.log(`Customer browser: ${passed} passed, 0 failed.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
