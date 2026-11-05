import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
const artifacts = "docs/d02/media";
async function scrub(page: Page, frame: number) {
  const slider = page.getByRole("slider", { name: "Кадр на временной шкале" });
  await slider.fill(String(frame));
  await slider.dispatchEvent("input");
  await expect(page.getByTestId("scene")).toHaveAttribute(
    "data-frame",
    String(frame),
  );
}
async function lab(page: Page) {
  await page.goto("/lab");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Новая перспектива",
  );
  await expect(page.locator("canvas")).toBeVisible();
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((c) => (c as HTMLCanvasElement).width),
    )
    .toBeGreaterThan(100);
  await page.waitForTimeout(600);
  await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "3d");
}
async function imageHash(page: Page) {
  return createHash("sha256")
    .update(await page.locator("canvas").screenshot())
    .digest("hex");
}

test("three real spaces render without script errors or horizontal overflow", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mkdir(artifacts, { recursive: true });
  for (const route of ["kids", "ski", "pro"]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Пример данных · D0.2")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifacts}/${route}-${info.project.name.startsWith("mobile") ? "mobile" : "desktop"}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test("navigation works across spaces and Motion Lab, including direct URLs", async ({
  page,
}, info) => {
  await page.goto("/ski");
  const navigation = page.getByRole("navigation", {
    name: info.project.name.startsWith("mobile")
      ? "Мобильная навигация"
      : "Пространства академии",
  });
  await navigation.getByRole("link", { name: /Kids/ }).click();
  await expect(page).toHaveURL(/\/kids$/);
  await navigation.getByRole("link", { name: /Pro/ }).click();
  await expect(page).toHaveURL(/\/pro$/);
  await navigation.getByRole("link", { name: /Ski/ }).click();
  await expect(page).toHaveURL(/\/ski$/);
  await page.getByRole("link", { name: "Исследовать движение" }).last().click();
  await expect(page).toHaveURL(/\/lab$/);
  await page.getByRole("link", { name: "В академию" }).click();
  await expect(page).toHaveURL(/\/ski$/);
});

test("Kids has a working reversible observation task and safe local help", async ({
  page,
}) => {
  await page.goto("/kids");
  await page.getByRole("button", { name: /Сбоку/ }).click();
  await page.getByRole("button", { name: "Посмотреть ответ" }).click();
  await expect(page.getByRole("status")).toContainText("перекрываются");
  await page.getByRole("button", { name: /Сверху/ }).click();
  await page.getByRole("button", { name: "Посмотреть ответ" }).click();
  await expect(page.getByRole("status")).toContainText("Да!");
  await page.getByRole("button", { name: "Сбросить выбор" }).click();
  await expect(
    page.getByRole("button", { name: "Посмотреть ответ" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Попросить объяснить" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Сообщение никому не отправляется",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("Ski route checklist works and makes no claim of real saved progress", async ({
  page,
}) => {
  await page.goto("/ski");
  await page.getByRole("button", { name: "Открыть маршрут" }).click();
  await page.getByRole("checkbox").first().check();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await expect(page.getByRole("dialog")).toContainText(
    "не подтверждают освоение навыка",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Как это устроено" }).click();
  await expect(page.getByRole("dialog")).toContainText("P0.1");
});

test("Pro group selection, per-profile notes, plan and method card work", async ({
  page,
}) => {
  await page.goto("/pro");
  await page
    .getByLabel("Заметка для демонстрационного профиля")
    .fill("Синтетическая заметка A");
  await page.getByRole("button", { name: "Запомнить в демо" }).click();
  await expect(page.getByRole("status")).toHaveText("В памяти страницы");
  await page.getByRole("button", { name: /Демо-ученик B/ }).click();
  await expect(
    page.getByLabel("Заметка для демонстрационного профиля"),
  ).toHaveValue("");
  await page.getByRole("button", { name: /Демо-ученик A/ }).click();
  await expect(
    page.getByLabel("Заметка для демонстрационного профиля"),
  ).toHaveValue("Синтетическая заметка A");
  await page.getByLabel("Выбрать демо-группу").selectOption("views");
  await expect(page.getByRole("button", { name: /Демо-ученик A/ })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Открыть план" }).click();
  await page.getByRole("checkbox").first().check();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Посмотреть структуру" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Сертификаты не выдаются",
  );
  await page.reload();
  await expect(
    page.getByLabel("Заметка для демонстрационного профиля"),
  ).toHaveValue("");
});

test("Lab timeline, frame steps, boundaries and playback speeds work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await lab(page);
  await expect(
    page.getByRole("button", { name: "Предыдущий кадр" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Следующий кадр" }).click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", "1");
  await page.getByRole("button", { name: "Предыдущий кадр" }).click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", "0");
  await scrub(page, 240);
  await expect(
    page.getByRole("button", { name: "Следующий кадр" }),
  ).toBeDisabled();
  for (const speed of ["0.25", "0.5", "1", "2"]) {
    await scrub(page, 0);
    await page.getByLabel("Скорость", { exact: true }).selectOption(speed);
    await page
      .getByRole("button", { name: "Воспроизвести", exact: true })
      .click();
    await expect
      .poll(() => page.getByTestId("scene").getAttribute("data-frame"))
      .not.toBe("0");
    await page.getByRole("button", { name: "Пауза", exact: true }).click();
    const frame = await page.getByTestId("scene").getAttribute("data-frame");
    await page.waitForTimeout(150);
    await expect(page.getByTestId("scene")).toHaveAttribute(
      "data-frame",
      frame!,
    );
  }
  expect(errors).toEqual([]);
});

test("3D visibly changes with camera presets, orbit, frame and reset", async ({
  page,
}, info) => {
  await lab(page);
  const initial = await imageHash(page);
  const images = new Set([initial]);
  for (const name of ["Камера сверху", "Камера сбоку", "Камера спереди"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(150);
    images.add(await imageHash(page));
  }
  expect(images.size).toBe(4);
  await page
    .getByRole("button", { name: "Вернуть камеру", exact: true })
    .click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-view", "orbit");
  const beforeOrbit = await imageHash(page);
  const box = await page.locator("canvas").boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 80,
    box!.y + box!.height / 2 + 20,
    { steps: 8 },
  );
  await page.mouse.up();
  expect(await imageHash(page)).not.toBe(beforeOrbit);
  await page
    .getByRole("button", { name: "Вернуть камеру", exact: true })
    .click();
  await scrub(page, 110);
  expect(await imageHash(page)).not.toBe(initial);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${artifacts}/lab-${info.project.name.startsWith("mobile") ? "mobile" : "desktop"}.png`,
    fullPage: true,
  });
});

test("trajectory, A/B capture and clear control actual comparison mode", async ({
  page,
}, info) => {
  await lab(page);
  const pathToggle = page.getByRole("switch", { name: "Показать траекторию" });
  const withPath = await imageHash(page);
  await pathToggle.click();
  await expect(pathToggle).not.toBeChecked();
  expect(await imageHash(page)).not.toBe(withPath);
  await scrub(page, 30);
  await page.getByRole("button", { name: /Сохранить A/ }).click();
  await scrub(page, 120);
  await page.getByRole("button", { name: /Сохранить B/ }).click();
  await page.getByRole("switch", { name: "Сравнить A и B" }).click();
  await expect(page.locator(".compare-labels")).toContainText("кадр 30");
  await expect(page.locator(".compare-labels")).toContainText("кадр 120");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "3d");
  await expect(pathToggle).toBeDisabled();
  await expect(page.getByTestId("scene")).toHaveClass(/comparing/);
  await page
    .getByRole("button", { name: "Камера спереди", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${artifacts}/lab-ab-${info.project.name.startsWith("mobile") ? "mobile" : "desktop"}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Очистить сравнение" }).click();
  await expect(
    page.getByRole("switch", { name: "Сравнить A и B" }),
  ).not.toBeChecked();
  await expect(pathToggle).toBeEnabled();
});

test("quality options and SVG retain the selected frame, camera controls and A/B", async ({
  page,
}, info) => {
  await lab(page);
  await expect(page.getByTestId("scene")).toHaveAttribute(
    "data-quality",
    info.project.name.startsWith("mobile") ? "low" : "high",
  );
  await scrub(page, 95);
  await page.getByLabel("Графика", { exact: true }).selectOption("low");
  await expect(page.getByTestId("scene")).toHaveAttribute(
    "data-quality",
    "low",
  );
  await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", "95");
  await page.getByRole("button", { name: "SVG", exact: true }).click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "svg");
  await expect(page.locator(".svg-scene")).toBeVisible();
  await page
    .getByRole("button", { name: "Камера сверху", exact: true })
    .click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-view", "top");
  await page.getByRole("button", { name: "Следующий кадр" }).click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", "96");
  await page.getByRole("switch", { name: "Сравнить A и B" }).click();
  await expect(page.locator(".compare-labels")).toBeVisible();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator("canvas")).toBeVisible();
});

test("WebGL context loss falls back honestly and can retry", async ({
  page,
}) => {
  await lab(page);
  await page
    .locator("canvas")
    .evaluate((c) =>
      c.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "svg");
  await expect(page.getByRole("status")).toContainText("контекст недоступен");
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.locator("canvas")).toBeVisible();
});

test("keyboard timeline, reduced motion, dialog focus and narrow layout", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await lab(page);
  await expect(
    page.getByRole("button", { name: "Воспроизвести", exact: true }),
  ).toBeVisible();
  const timeline = page.getByRole("slider", {
    name: "Кадр на временной шкале",
  });
  await timeline.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", "1");
  await page.getByRole("button", { name: "О модели", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= 321),
  ).toBe(true);
});

test("record reproducible Motion Lab demonstration", async ({
  browser,
}, info) => {
  test.skip(
    info.project.name.startsWith("mobile"),
    "One desktop recording; mobile is covered by the functional cases, not real-device proof.",
  );
  await mkdir(artifacts, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: {
      dir: "test-results/video",
      size: { width: 1280, height: 900 },
    },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/lab");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(800);
  await page
    .getByRole("button", { name: "Воспроизвести", exact: true })
    .click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  for (const name of ["Камера сверху", "Камера сбоку", "Камера спереди"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(500);
  }
  await scrub(page, 20);
  await page.getByRole("button", { name: /Сохранить A/ }).click();
  await scrub(page, 120);
  await page.getByRole("button", { name: /Сохранить B/ }).click();
  await page.getByRole("switch", { name: "Сравнить A и B" }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "SVG", exact: true }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.waitForTimeout(600);
  const video = page.video()!;
  await context.close();
  await rename(await video.path(), `${artifacts}/motion-lab-demo.webm`);
  await writeFile(
    `${artifacts}/recording-notes.txt`,
    "Recorded automatically in desktop Chromium with software WebGL. Not a physical iPhone recording. Neutral technical clip, no methodological approval.\n",
  );
});

test("touch orbit and keyboard rotation change the rendered 3D scene", async ({
  page,
}) => {
  await lab(page);
  await page.locator("canvas").scrollIntoViewIfNeeded();
  const before = await imageHash(page);
  const box = (await page.locator("canvas").boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 8; step++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + step * 8, y: y + step * 2 }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await imageHash(page)).not.toBe(before);
  const afterTouch = await imageHash(page);
  await page.getByRole("button", { name: "Повернуть камеру вправо" }).focus();
  await page.keyboard.press("Enter");
  expect(await imageHash(page)).not.toBe(afterTouch);
  await page
    .getByRole("button", { name: "Вернуть камеру", exact: true })
    .click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "3d");
});

test("paused 3D drawing survives scrolling and still contains the skier", async ({
  page,
}) => {
  const { PNG } = await import("pngjs");
  await lab(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  const png = PNG.sync.read(await page.locator("canvas").screenshot());
  let warmPixels = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b] = [png.data[i], png.data[i + 1], png.data[i + 2]];
    if (r > g * 1.08 && g > b * 1.15 && r > 120) warmPixels++;
  }
  expect(warmPixels).toBeGreaterThan(500);
});

test("automated WCAG checks on all four routes", async ({ page }, info) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const results: unknown[] = [];
  for (const route of ["ski", "kids", "pro", "lab"]) {
    await page.goto(`/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    results.push({
      route,
      violations: report.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
  }
  await writeFile(
    `docs/d02/accessibility-${info.project.name}.json`,
    JSON.stringify(results, null, 2),
  );
  expect(
    results.flatMap((r) => (r as { violations: unknown[] }).violations),
  ).toEqual([]);
});

test("production keeps the 3D engine lazy until Motion Lab opens", async ({
  page,
}) => {
  const engineRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/three-engine-"))
      engineRequests.push(request.url());
  });
  await page.goto("/ski");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(engineRequests).toEqual([]);
  await page.goto("/lab");
  await expect(page.locator("canvas")).toBeVisible();
  expect(engineRequests.length).toBeGreaterThan(0);
});
