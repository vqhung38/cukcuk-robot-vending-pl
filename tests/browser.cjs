const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173");
  await page.getByRole("heading", { name: "Tổng quan vận hành" }).waitFor();
  await page.screenshot({ path: "/tmp/cukcuk-dashboard.png", fullPage: true });
  await page
    .getByRole("button", { name: "Quản lý robot", exact: true })
    .click();
  await page.getByLabel("Tìm robot").fill("RB-001");
  assert.equal(await page.locator("tbody tr").count(), 1);
  await page.getByRole("button", { name: "Chi tiết Landmark 81" }).click();
  await page.getByText("Doanh thu robot", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Tồn kho nguyên liệu", exact: true })
    .click();
  await page
    .locator(".stock-card")
    .filter({ hasText: "Bitexco Financial Tower" })
    .getByRole("button", { name: "Bổ sung Sữa tươi", exact: true })
    .click();
  await page.getByRole("spinbutton").fill("50");
  await page.getByRole("button", { name: "Xác nhận bổ sung" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Tồn kho nguyên liệu", exact: true })
    .click();
  assert.equal(
    await page
      .locator(".stock-card")
      .filter({ hasText: "Bitexco Financial Tower" })
      .getByText("68%", { exact: true })
      .count(),
    1,
  );
  await page.getByRole("button", { name: /^Cảnh báo/ }).click();
  assert.equal(await page.getByText("Sữa tươi sắp hết").count(), 0);
  await page
    .locator(".alert-row")
    .filter({ hasText: "Lỗi bộ phận pha chế" })
    .getByRole("button", { name: "Tiếp nhận xử lý", exact: true })
    .click();
  assert.equal(
    await page.getByRole("button", { name: "Đã tiếp nhận" }).isDisabled(),
    true,
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất báo cáo" }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "cukcuk-bao-cao.csv");
  await page.getByRole("button", { name: "Tổng quan", exact: true }).click();
  await page.getByLabel("Khu vực").selectOption("Đà Nẵng");
  assert.equal(await page.locator("tbody tr").count(), 1);
  await page.setViewportSize({ width: 1024, height: 900 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: browser navigation, search, detail, refill, reload persistence, alerts, CSV, region filter, 1024px layout; no page errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
