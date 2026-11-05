import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { sampleMotion } from "../src/lab/rig";
import type { ScenarioId } from "../src/lab/rig";

test("D02 scenarios, guides, shared SVG coordinates and static comparison", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/lab");
  await expect(page.locator("canvas")).toBeVisible();
  const scenario = page.getByRole("combobox", {
    name: "Выбрать технический сценарий",
  });
  for (const id of ["balance", "edge", "steering", "trust"] as ScenarioId[]) {
    await scenario.selectOption(id);
    await page
      .getByRole("button", { name: "Перейти к кадру 60", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Рекомендуемый ракурс", exact: true })
      .click();
    await page
      .getByRole("checkbox", { name: "Суставы и сегменты", exact: true })
      .check();
    await page
      .getByRole("checkbox", { name: "Оси корпуса", exact: true })
      .check();
    await page.getByRole("checkbox", { name: "Оси лыж", exact: true }).check();
    await page
      .getByRole("combobox", { name: "Отслеживаемая точка" })
      .selectOption("rightWrist");
    await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", "60");
    await expect(page.getByTestId("scene")).toHaveAttribute(
      "data-scenario",
      id,
    );
    await page.waitForTimeout(350);
    await mkdir("docs/d02/media", { recursive: true });
    await page
      .getByTestId("scene")
      .screenshot({ path: `docs/d02/media/${id}-${info.project.name}.png` });
    await page.getByRole("button", { name: "SVG", exact: true }).click();
    const expected = sampleMotion(60, id).joints.leftKnee;
    const joint = page.locator('[data-joint="leftKnee"]').first();
    for (const [axis, i] of [
      ["x", 0],
      ["y", 1],
      ["z", 2],
    ] as const) {
      expect(Number(await joint.getAttribute(`data-${axis}`))).toBeCloseTo(
        expected[i],
        5,
      );
    }
    await page.getByRole("button", { name: "3D", exact: true }).click();
  }
  await page.getByRole("button", { name: /Сохранить B/ }).click();
  await page.getByRole("switch", { name: "Сравнить A и B" }).click();
  await expect(page.getByTestId("comparison-summary")).toContainText(
    "не оценка правильности",
  );
  await expect(
    page.getByRole("button", { name: "Воспроизвести", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Камера сбоку", exact: true }).click();
  await page
    .getByTestId("scene")
    .screenshot({ path: `docs/d02/media/ab-side-${info.project.name}.png` });
  await scenario.selectOption("balance");
  await expect(
    page.getByRole("switch", { name: "Сравнить A и B" }),
  ).not.toBeChecked();
  await expect(page.getByTestId("scene")).toHaveAttribute("data-frame", "0");
  expect(errors).toEqual([]);
});

test("D02 four scenario demonstration recording", async ({ browser }, info) => {
  test.skip(
    info.project.name.startsWith("mobile"),
    "One desktop recording; mobile interactions tested separately.",
  );
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: {
      dir: "docs/d02/media/recordings",
      size: { width: 1280, height: 900 },
    },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/lab");
  await expect(page.locator("canvas")).toBeVisible();
  for (const id of ["balance", "edge", "steering", "trust"]) {
    await page
      .getByRole("combobox", { name: "Выбрать технический сценарий" })
      .selectOption(id);
    await page
      .getByRole("button", { name: "Рекомендуемый ракурс", exact: true })
      .click();
    await page.getByTestId("scene").scrollIntoViewIfNeeded();
    await page
      .getByRole("button", { name: "Воспроизвести", exact: true })
      .click();
    await page.waitForTimeout(2400);
    await page.getByRole("button", { name: "Пауза", exact: true }).click();
  }
  const video = page.video();
  await context.close();
  await video!.saveAs("docs/d02/media/D02-scenarios.webm");
});
