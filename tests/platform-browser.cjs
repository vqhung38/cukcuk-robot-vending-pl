const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click();
  const role = (id) =>
    page.getByLabel("Vai trò demo", { exact: true }).selectOption(id);
  const state = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("cukcuk-v2")));
  let passed = 0;
  try {
    await page.goto("http://127.0.0.1:5173");
    // Real UI only: buy -> brew failure -> operations ticket -> resume selling.
    await click("Khách mua cà phê");
    await page.getByLabel("Đồ uống", { exact: true }).selectOption("milk");
    await click("Tạo đơn hàng");
    await click("Thanh toán chưa xác định");
    assert.equal(
      await page
        .getByRole("button", { name: "Bắt đầu pha chế", exact: true })
        .count(),
      0,
    );
    await click("Thanh toán thành công");
    await click("Bắt đầu pha chế");
    await click("Ly 1 pha thất bại");
    const orderId = (await state()).sales[0].id;
    await role("provider");
    await click("Mở phiếu xử lý");
    await click("Gán người phụ trách");
    await page.getByLabel("Tiến độ (%)", { exact: true }).fill("75");
    await page
      .getByLabel("Ghi chú tiến độ", { exact: true })
      .fill("Đã thay cụm pha");
    await click("Cập nhật tiến độ");
    await page
      .getByLabel("Kết quả khắc phục", { exact: true })
      .fill("Pha thử và kết nối đạt");
    await page
      .getByLabel("Đã kiểm tra kết nối và pha thử đạt (giả lập)", {
        exact: true,
      })
      .check();
    await click("Ghi kết quả và khôi phục");
    assert.equal((await state()).robots[0].status, "online");
    assert.equal((await state()).platform.tickets[0].status, "resolved");
    assert.equal((await state()).sales[0].refundAmount, 35000);
    await page.reload();
    await click("Vận hành robot");
    await page
      .getByText("Kết quả: Pha thử và kết nối đạt", { exact: true })
      .waitFor();
    await page.screenshot({
      path: "/tmp/cukcuk-operations-slice.png",
      fullPage: true,
    });
    console.log(
      "PASS: operations ticket, safe recovery, history persistence; refund obligation preserved",
    );
    passed++;
    await role("owner");
    await click("Đối soát");
    const summary = page.getByRole("region", { name: "Tổng hợp tài chính" });
    assert.match(
      await summary.innerText(),
      /Tiền đã đối soát qua sao kê mẫu\s*0 ₫/,
    );
    await click("Tạo yêu cầu hoàn tiền");
    await click("Bắt đầu hoàn tiền");
    await click("Hoàn tiền thất bại");
    await click("Bắt đầu hoàn tiền");
    await click("Hoàn tiền thành công");
    await click("Tạo kỳ đối soát mẫu");
    await page.getByText("Thiếu sao kê", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Chốt kỳ đối soát", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByLabel("Giao dịch sửa sao kê", { exact: true })
      .selectOption(`PAY-${orderId}`);
    await page.getByLabel("Số tiền sao kê", { exact: true }).fill("35000");
    await page
      .getByLabel("Lý do sửa sao kê", { exact: true })
      .fill("Xác minh chứng từ mẫu");
    await page
      .getByLabel("Xác nhận tiền trên sao kê mẫu", { exact: true })
      .check();
    await click("Lưu sao kê mẫu");
    await click("Chốt kỳ đối soát");
    assert.equal((await state()).platform.batches[0].status, "closed");
    assert.equal((await state()).sales[0].refund, "refunded");
    assert.match(await summary.innerText(), /Tiền thu ròng\s*0 ₫/);
    assert.match(
      await summary.innerText(),
      /Tiền đã đối soát qua sao kê mẫu\s*0 ₫/,
    );
    await page.reload();
    await role("owner");
    await click("Đối soát");
    await page.getByText(/Đã chốt/).waitFor();
    await page.screenshot({
      path: "/tmp/cukcuk-finance-slice.png",
      fullPage: true,
    });
    for (const width of [1024, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `finance overflow ${width}`,
      );
    }
    console.log(
      "PASS: refund failure/retry, discrepancies, explicit reconciliation and reload",
    );
    passed++;
    await page.setViewportSize({ width: 1440, height: 1100 });
    await role("manager-south");
    await click("Quản lý robot");
    assert.equal(
      await page.getByText("Lotte Center", { exact: true }).count(),
      0,
    );
    assert.equal(
      await page.getByText("FPT Complex", { exact: true }).count(),
      0,
    );
    const downloadPromise = page.waitForEvent("download");
    await click("Xuất báo cáo");
    const download = await downloadPromise;
    const csv = await fs.readFile(await download.path(), "utf8");
    assert(csv.includes("RB-001"));
    assert(!csv.includes("RB-005"));
    assert(!csv.includes("RB-008"));
    await role("provider");
    assert.equal(
      await page.getByRole("button", { name: "Đối soát", exact: true }).count(),
      0,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Xuất báo cáo", exact: true })
        .count(),
      0,
    );
    await click("Quản lý robot");
    assert.equal(
      await page
        .getByRole("columnheader", { name: "DOANH THU", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: "Chi tiết Landmark 81", exact: true })
      .click();
    assert.equal(
      await page.getByText("Doanh thu robot", { exact: true }).count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: role/scoped views, hidden finance, scoped CSV, no page errors",
    );
    passed++;
    console.log(`Platform browser: ${passed} passed, 0 failed.`);
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
