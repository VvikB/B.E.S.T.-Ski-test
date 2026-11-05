import { test, expect } from "@playwright/test";
import { sampleMotion } from "../src/lab/rig";

test("D03 shared mini-scheme, keyboard, labels, focus and Lab handoff retain state", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/ski");
  const preview = page.locator(".continue-card .balance-preview");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator(".continue-card")).toHaveAttribute(
    "data-publication",
    "draft",
  );
  await expect(page.locator(".continue-card")).toHaveAttribute(
    "data-progress",
    "demo",
  );
  await preview.getByRole("button", { name: "Спереди", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(preview.getByTestId("balance-preview")).toHaveAttribute(
    "data-view",
    "front",
  );
  for (const [i, f] of [0, 60, 120].entries()) {
    const stateButton = preview.getByRole("button", {
      name: `Состояние ${i + 1}, кадр ${f}`,
    });
    if (await page.evaluate(() => navigator.maxTouchPoints > 0))
      await stateButton.tap();
    else await stateButton.click();
    await expect(preview.getByTestId("balance-preview")).toHaveAttribute(
      "data-frame",
      String(f),
    );
    const joint = preview.locator('[data-joint="leftKnee"]');
    const p = sampleMotion(f, "balance").joints.leftKnee;
    for (const [axis, k] of [
      ["x", 0],
      ["y", 1],
      ["z", 2],
    ] as const)
      expect(Number(await joint.getAttribute("data-" + axis))).toBeCloseTo(
        p[k],
        6,
      );
  }
  await preview.getByLabel("Подписи", { exact: true }).uncheck();
  await expect(
    preview.getByText("Две лыжи · одна модель D0.2"),
  ).not.toBeVisible();
  await preview
    .getByRole("combobox", { name: "Наблюдать" })
    .selectOption("boots");
  await expect(preview.locator(".preview-description")).toContainText(
    "Выделено: ботинки",
  );
  await page.getByRole("link", { name: "Открыть 3D Lab", exact: true }).click();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", "120");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-view", "front");
  await expect(page.locator("canvas")).toBeVisible();
  await page.goBack();
  await expect(preview.getByTestId("balance-preview")).toHaveAttribute(
    "data-frame",
    "120",
  );
  await expect(preview.getByTestId("balance-preview")).toHaveAttribute(
    "data-view",
    "front",
  );
  await expect(
    preview.getByLabel("Подписи", { exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await expect(preview.getByTestId("balance-preview")).toHaveAttribute(
    "data-frame",
    "0",
  );
  expect(errors).toEqual([]);
});

test("D03 demo lesson, progress and profile explain status without WebGL", async ({
  page,
}) => {
  await page.route("**/*three-engine*", (route) => route.abort());
  await page.goto("/ski");
  await page
    .getByRole("button", { name: "Открыть демонстрацию", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "полный урок B-01 ожидает методической приёмки",
  );
  await expect(
    page.getByRole("dialog").getByTestId("balance-preview"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Мой прогресс", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Прогресс ученика: не подтверждён",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Демо-профиль", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Backend и постоянное хранение пока не подключены",
  );
  await page.keyboard.press("Escape");
  for (const name of ["Balance", "Edge Control", "Steering", "Trust"]) {
    await page
      .getByRole("button", { name: new RegExp(name + " ") })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toContainText("проектную программу");
    await page.keyboard.press("Escape");
  }
});

test("D03 320/390 portrait, 844 landscape and 200% text reflow on all spaces", async ({
  page,
}, info) => {
  test.skip(
    info.project.name.startsWith("mobile"),
    "Matrix runs once with explicit viewport sizes. Touch regression runs in mobile project.",
  );
  for (const [width, height] of [
    [320, 740],
    [390, 844],
    [390, 664],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of ["ski", "kids", "pro", "lab"]) {
      await page.goto("/" + route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} ${width}`,
      ).toBe(true);
      const nav = page.getByRole("navigation", {
        name: width <= 760 ? "Мобильная навигация" : "Пространства академии",
      });
      await expect(nav).toBeVisible();
      if (route === "ski" && width === 390 && height === 664) {
        const action = await page
          .getByRole("button", { name: "Открыть демонстрацию", exact: true })
          .boundingBox();
        const bottom = await page.locator(".mobile-nav").boundingBox();
        expect(action!.y + action!.height).toBeLessThan(bottom!.y);
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["ski", "kids", "pro", "lab"]) {
    await page.goto("/" + route);
    await page.evaluate(() => {
      const sizes = Array.from(
        document.querySelectorAll<HTMLElement>(
          "body,p,button,a,select,label,span,small,h1,h2,h3",
        ),
      ).map((el) => [el, parseFloat(getComputedStyle(el).fontSize)] as const);
      sizes.forEach(([el, size]) =>
        el.style.setProperty("font-size", `${size * 2}px`, "important"),
      );
    });
    // Browser zoom/reflow equivalent is checked separately at 320; text enlargement probes wrapping.
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      route + " enlarged text",
    ).toBe(true);
  }
});

test("D03 reduced motion and large primary controls; original Bestik has two poses", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ski");
  const primary = page.getByRole("button", {
    name: "Открыть демонстрацию",
    exact: true,
  });
  const box = await primary.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await page.goto("/kids");
  await expect(
    page.getByRole("img", { name: /Бестик приветствует/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Бестик объясняет/ }),
  ).toBeVisible();
  await page.goto("/lab");
  await expect(
    page.getByRole("button", { name: "Воспроизвести", exact: true }),
  ).toBeVisible();
  const f = await page.getByTestId("scene").getAttribute("data-frame");
  await page.waitForTimeout(250);
  await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", f!);
});
