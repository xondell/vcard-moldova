import { test, expect } from "@playwright/test";
const password = process.env.TEST_ADMIN_PASSWORD;
const userPassword = "Vcard-Test-Password-72!";

test("Public site: RU/RO, examples, QR, vCard and unknown links", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Твоя визитка",
  );
  await page.getByRole("button", { name: "RO", exact: true }).first().click();
  await expect(page).toHaveURL(/\/ro$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Cartea ta",
  );
  await page.goto("/p/boris-colesov");
  await expect(
    page.getByRole("heading", { name: "Борис Колесов", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".qr-panel img")).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Сохранить контакт", exact: true })
    .click();
  expect((await download).suggestedFilename()).toMatch(/\.vcf$/);
  await page.goto("/p/arina-studio");
  await expect(
    page.getByRole("heading", { name: "Arina Studio", exact: true }),
  ).toBeVisible();
  for (const id of ["1", "2", "23"]) {
    await page.goto("/" + id);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "ещё не активирована",
    );
  }
  await page.goto("/999999998");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Карта не найдена",
  );
  await page.goto("/p/no-such-person");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "не найден",
  );
  await page.goto("/ru/dashboard");
  await expect(page.locator("input[type=email]")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Admin and user: inventory → secret → activation → published card → disable/delete", async ({
  browser,
}) => {
  test.skip(!password, "Set TEST_ADMIN_PASSWORD to run authenticated tests");
  const admin = await browser.newContext();
  const a = await admin.newPage();
  const errors: string[] = [];
  a.on("pageerror", (e) => errors.push(e.message));
  await a.goto("/admin");
  await a.getByLabel("Логин", { exact: true }).fill("admin");
  await a.getByLabel("Пароль", { exact: true }).fill("wrong-password");
  await a.getByRole("button", { name: "Войти в админ-панель" }).click();
  await expect(a.getByRole("alert")).toContainText("Неверный");
  await a.getByLabel("Пароль", { exact: true }).fill(password!);
  await a.getByRole("button", { name: "Войти в админ-панель" }).click();
  await expect(a.getByRole("heading", { name: "Обзор проекта" })).toBeVisible();
  const before = (await (await admin.request.get("/api/admin/overview")).json())
    .stats;
  await a.getByLabel("Номер или ссылка").fill("23");
  await a.getByRole("button", { name: "Добавить карту", exact: true }).click();
  await expect(a.getByRole("alert")).toContainText("уже занят");
  const id = String(100000 + Math.floor(Math.random() * 800000));
  await a.getByLabel("Номер или ссылка").fill(new URL("/" + id, a.url()).href);
  await a.getByRole("button", { name: "Добавить карту", exact: true }).click();
  await expect(a.locator(".admin-secret")).toBeVisible();
  const code = await a.locator(".admin-secret code").innerText();
  expect(code).toMatch(/^VCARD-[A-F0-9]{24}$/);
  await a.getByRole("button", { name: "Скрыть код" }).click();
  const user = await browser.newContext();
  const u = await user.newPage();
  u.on("pageerror", (e) => errors.push(e.message));
  const email = `vcard-e2e-${Date.now()}@example.com`;
  await u.goto("/ru/register");
  await u.getByLabel("Email", { exact: true }).fill(email);
  await u.locator("input[name=password]").fill(userPassword);
  await u.locator("input[name=confirm]").fill(userPassword);
  await u.getByRole("button", { name: "Продолжить", exact: true }).click();
  await expect(u).toHaveURL(/\/ru\/dashboard$/);
  expect((await user.request.get("/api/admin/overview")).status()).toBe(403);
  await u
    .getByRole("button", { name: "Редактировать профиль", exact: true })
    .first()
    .click();
  await u
    .getByLabel("Имя и фамилия", { exact: true })
    .fill("Тестовый владелец");
  await u
    .getByRole("button", { name: "Сохранить изменения", exact: false })
    .click();
  await expect(u.locator(".toast")).toContainText("Сохранено");
  await u.getByRole("button", { name: "Опубликовать", exact: true }).click();
  await expect(
    u.getByRole("button", { name: "Снять с публикации", exact: true }),
  ).toBeVisible();
  await u
    .getByRole("button", { name: "Мои карты", exact: true })
    .first()
    .click();
  await u.getByLabel("Код активации NFC-карты").fill("VCARD-invalid");
  await u
    .getByRole("button", { name: "Активировать карту", exact: true })
    .click();
  await expect(u.locator(".toast")).toContainText("Код неверен");
  await u.getByLabel("Код активации NFC-карты").fill(code);
  await u
    .getByRole("button", { name: "Активировать карту", exact: true })
    .click();
  await expect(u.getByRole("heading", { name: `VCard /${id}` })).toBeVisible();
  const guest = await browser.newContext();
  const g = await guest.newPage();
  await g.goto("/" + id);
  await expect(
    g.getByRole("heading", { name: "Тестовый владелец", exact: true }),
  ).toBeVisible();
  expect(
    (await user.request.post("/api/activate", { data: { code } })).status(),
  ).toBe(409);
  const sessionData = (await (await user.request.get("/api/session")).json())
    .user;
  expect(
    (
      await user.request.put("/api/profile", {
        data: { profile: sessionData.profile, published: false },
      })
    ).status(),
  ).toBe(200);
  await g.reload();
  await expect(g.getByRole("heading", { level: 1 })).toContainText(
    "ещё не активирована",
  );
  expect(
    (
      await user.request.put("/api/profile", {
        data: { profile: sessionData.profile, published: true },
      })
    ).status(),
  ).toBe(200);
  await g.reload();
  await expect(
    g.getByRole("heading", { name: "Тестовый владелец", exact: true }),
  ).toBeVisible();
  const publicCard = await (await guest.request.get("/api/cards/" + id)).json();
  expect(JSON.stringify(publicCard)).not.toMatch(
    /code_hash|password|owner_id|service_role/,
  );

  const after = (await (await admin.request.get("/api/admin/overview")).json())
    .stats;
  expect(after.activeCards).toBe(before.activeCards + 1);
  expect(after.activeLinks).toBe(before.activeLinks + 1);
  await a.reload();
  await a.getByLabel("Поиск", { exact: true }).fill(id);
  const row = a
    .getByRole("row")
    .filter({ has: a.getByRole("link", { name: "/" + id, exact: true }) });
  await row.getByRole("button", { name: "Отключить", exact: true }).click();
  await expect(row).toContainText("Отключена");
  await g.reload();
  await expect(g.getByRole("heading", { level: 1 })).toContainText(
    "Карта отключена",
  );
  await row.getByRole("button", { name: "Включить", exact: true }).click();
  await expect(row).toContainText("Активна");
  await row.getByRole("button", { name: "Удалить", exact: true }).click();
  await a.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Удалить", exact: true }).click();
  await a
    .getByRole("button", { name: "Удалить навсегда", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  await g.reload();
  await expect(g.getByRole("heading", { level: 1 })).toContainText(
    "Карта не найдена",
  );
  // Automatic numbering and one-time reissue invalidate the old secret.
  await a.getByLabel("Поиск", { exact: true }).fill("");
  await a
    .getByRole("button", { name: "Сгенерировать карту", exact: true })
    .click();
  await expect(a.locator(".admin-secret")).toBeVisible();
  const autoId = (await a.locator(".admin-secret h3").innerText()).match(
    /\/(\d+)/,
  )![1];
  const oldCode = await a.locator(".admin-secret code").innerText();
  const autoRow = a
    .getByRole("row")
    .filter({ has: a.getByRole("link", { name: "/" + autoId, exact: true }) });
  await autoRow.getByRole("button", { name: "Новый код", exact: true }).click();
  await expect(a.locator(".admin-secret code")).not.toHaveText(oldCode);
  expect(
    (
      await user.request.post("/api/activate", { data: { code: oldCode } })
    ).status(),
  ).toBe(409);

  const newCode = await a.locator(".admin-secret code").innerText();
  const concurrent = await Promise.all([
    user.request.post("/api/activate", { data: { code: newCode } }),
    user.request.post("/api/activate", { data: { code: newCode } }),
  ]);
  expect(concurrent.map((r) => r.status()).sort()).toEqual([200, 409]);
  await autoRow.getByRole("button", { name: "Удалить", exact: true }).click();
  await a
    .getByRole("button", { name: "Удалить навсегда", exact: true })
    .click();
  await expect(autoRow).toHaveCount(0);
  await u.getByRole("button", { name: "Выйти", exact: true }).first().click();
  await expect(u).toHaveURL(/\/$/);
  expect((await user.request.get("/api/my/cards")).status()).toBe(401);
  await u.goto("/ru/login");
  await u.getByLabel("Email", { exact: true }).fill(email);
  await u.locator("input[name=password]").fill(userPassword);
  await u.getByRole("button", { name: "Войти", exact: true }).last().click();
  await expect(u).toHaveURL(/\/ru\/dashboard$/);
  await expect(u.locator(".sidebar-profile")).toContainText(
    "Тестовый владелец",
  );
  await a.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(a).toHaveURL(/\/$/);
  expect((await admin.request.get("/api/admin/overview")).status()).toBe(403);
  expect(errors).toEqual([]);
  await guest.close();
  await user.close();
  await admin.close();
});

test("Access controls and mobile layout", async ({ page, request }) => {
  expect((await request.get("/api/admin/overview")).status()).toBe(403);
  expect(
    (await request.post("/api/admin/cards", { data: { id: "555" } })).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/activate", { data: { code: "guess" } })).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/login", {
        headers: { Origin: "https://evil.example" },
        data: { email: "admin", password: "guess" },
      })
    ).status(),
  ).toBe(403);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Панель администратора" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
