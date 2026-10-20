import express from "express";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const app = express();
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const db = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const hash = (value) => createHash("sha256").update(value).digest("hex");
const secret = () => "VCARD-" + randomBytes(12).toString("hex").toUpperCase();
const production = process.env.NODE_ENV === "production";
const checked = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
const tokenFrom = (req) =>
  req.headers.cookie
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("vcard_session="))
    ?.slice(14);
const profileFor = async (id) =>
  checked(db.from("profiles").select("*").eq("owner_id", id).maybeSingle());
const safeUser = (user, profile) => ({
  id: user.id,
  email: user.email,
  role: user.app_metadata?.role === "admin" ? "admin" : "user",
  profile: profile
    ? { ...profile.data, type: profile.type, slug: profile.slug }
    : null,
  published: !!profile?.published,
});
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
app.use("/api", (req, res, next) => {
  res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin;
    const forwardedHost = process.env.VERCEL
      ? req.headers["x-forwarded-host"]
      : null;
    const expected =
      process.env.APP_ORIGIN ||
      `${process.env.VERCEL ? "https" : req.protocol}://${forwardedHost || req.get("host")}`;
    if (origin && origin !== expected)
      return res.status(403).json({ error: "Недопустимый источник запроса" });
    if (req.headers["content-type"]?.split(";")[0] !== "application/json")
      return res.status(415).json({ error: "Ожидается JSON" });
  }
  next();
});
app.use("/api", async (req, res, next) => {
  const token = tokenFrom(req);
  if (token) {
    const row = await checked(
      db
        .from("vcard_sessions")
        .select("user_id")
        .eq("token", hash(token))
        .gt("expires", new Date().toISOString())
        .maybeSingle(),
    );
    if (row) {
      const { data, error } = await db.auth.admin.getUserById(row.user_id);
      if (!error) req.user = data.user;
    }
  }
  next();
});
const requireUser = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: "Войдите в аккаунт" });
const requireAdmin = (req, res, next) =>
  req.user?.app_metadata?.role === "admin"
    ? next()
    : res.status(403).json({ error: "Доступ только администратору" });
const limit = async (req, res, next) => {
  const ip = process.env.VERCEL
    ? req.headers["x-vercel-forwarded-for"] || req.ip
    : req.ip;
  const allowed = await checked(
    db.rpc("vcard_rate_limit", {
      p_key: hash(`${req.path}:${req.user?.id || ip}`),
    }),
  );
  allowed
    ? next()
    : res
        .status(429)
        .json({ error: "Слишком много попыток. Повторите через 15 минут." });
};
async function session(res, user) {
  const token = randomBytes(32).toString("hex");
  await checked(
    db.from("vcard_sessions").delete().lt("expires", new Date().toISOString()),
  );
  await checked(
    db.from("vcard_sessions").insert({
      token: hash(token),
      user_id: user.id,
      expires: new Date(Date.now() + 86400000).toISOString(),
    }),
  );
  await checked(
    db
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("owner_id", user.id),
  );
  res.cookie("vcard_session", token, {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    maxAge: 86400000,
    path: "/",
  });
  res.json({ user: safeUser(user, await profileFor(user.id)) });
}
app.get("/api/session", async (req, res) => {
  if (!req.user) return res.json({ user: null });
  await checked(
    db
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("owner_id", req.user.id),
  );
  res.json({ user: safeUser(req.user, await profileFor(req.user.id)) });
});
app.post("/api/login", limit, async (req, res) => {
  let { email, password } = req.body;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    password.length > 256
  )
    return res.status(400).json({ error: "Проверьте данные" });
  if (email.trim().toLowerCase() === "admin")
    email = process.env.ADMIN_EMAIL || "admin@vcard.local";
  const client = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error)
    return res.status(401).json({ error: "Неверный логин или пароль" });
  // Supabase token stays server-side; the browser receives a revocable opaque session.
  await client.auth.signOut();
  await session(res, data.user);
});
const validProfile = (p) => {
  if (!p || !["personal", "business"].includes(p.type)) return false;
  const fields =
    p.type === "personal"
      ? [
          "fullName",
          "title",
          "company",
          "bio",
          "phone",
          "email",
          "website",
          "location",
        ]
      : [
          "name",
          "category",
          "description",
          "phone",
          "email",
          "website",
          "address",
          "mapsUrl",
        ];
  if (fields.some((k) => typeof p[k] !== "string" || p[k].length > 4000))
    return false;
  if (
    !p.socials ||
    typeof p.socials !== "object" ||
    Array.isArray(p.socials) ||
    Object.values(p.socials).some(
      (v) => typeof v !== "string" || v.length > 2000,
    )
  )
    return false;
  return (
    p.type === "personal" ||
    (Array.isArray(p.hours) &&
      p.hours.every((v) => typeof v === "string") &&
      Array.isArray(p.actions) &&
      p.actions.every(
        (a) =>
          a &&
          typeof a.label === "string" &&
          typeof a.url === "string" &&
          typeof a.icon === "string",
      ))
  );
};
app.post("/api/register", limit, async (req, res) => {
  const { email, password, profile } = req.body;
  if (
    typeof email !== "string" ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 256 ||
    !validProfile(profile)
  )
    return res
      .status(400)
      .json({ error: "Укажите email, профиль и пароль от 12 символов" });
  const { data, error } = await db.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  });
  if (error)
    return res.status(409).json({
      error: "Не удалось создать аккаунт. Возможно, email уже используется.",
    });
  const user = data.user;
  try {
    // Account ownership is assigned on the server; user-supplied slugs and roles are ignored.
    await checked(
      db.from("profiles").upsert(
        {
          owner_id: user.id,
          type: profile.type,
          slug: "user-" + randomBytes(8).toString("hex"),
          data: profile,
          published: false,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "owner_id" },
      ),
    );
    await session(res, user);
  } catch (e) {
    await db.auth.admin.deleteUser(user.id);
    throw e;
  }
});
app.post("/api/logout", async (req, res) => {
  const token = tokenFrom(req);
  if (token)
    await checked(db.from("vcard_sessions").delete().eq("token", hash(token)));
  res
    .clearCookie("vcard_session", {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: production,
    })
    .json({ ok: true });
});
app.put("/api/profile", requireUser, async (req, res) => {
  const { profile, published } = req.body;
  if (!validProfile(profile) || typeof published !== "boolean")
    return res.status(400).json({ error: "Некорректный профиль" });
  const previous = await profileFor(req.user.id);
  if (!previous) return res.status(404).json({ error: "Профиль не найден" });
  await checked(
    db
      .from("profiles")
      .update({ data: { ...profile, slug: previous.slug }, published })
      .eq("id", previous.id),
  );
  res.json({ ok: true });
});
app.get("/api/profiles/:slug", async (req, res) => {
  const p = await checked(
    db
      .from("profiles")
      .select("data,type,slug")
      .eq("slug", req.params.slug)
      .eq("published", true)
      .maybeSingle(),
  );
  p
    ? res.json({ profile: { ...p.data, type: p.type, slug: p.slug } })
    : res.status(404).json({ error: "Профиль не опубликован или не найден" });
});
app.get("/api/cards/:id", async (req, res) => {
  const c = await checked(
    db
      .from("physical_cards")
      .select("public_id,status,profile_id")
      .eq("public_id", req.params.id)
      .maybeSingle(),
  );
  if (!c) return res.status(404).json({ error: "Карта не найдена" });
  const p =
    c.status === "active" && c.profile_id
      ? await checked(
          db
            .from("profiles")
            .select("data,type,slug")
            .eq("id", c.profile_id)
            .eq("published", true)
            .maybeSingle(),
        )
      : null;
  res.json({
    id: c.public_id,
    status: c.status === "disabled" ? "DISABLED" : p ? "ACTIVE" : "UNASSIGNED",
    profile: p ? { ...p.data, type: p.type, slug: p.slug } : null,
  });
});
app.get("/api/my/cards", requireUser, async (req, res) => {
  const cards = await checked(
    db
      .from("physical_cards")
      .select("public_id,status")
      .eq("owner_id", req.user.id),
  );
  res.json({
    cards: cards.map((c) => ({
      id: c.public_id,
      disabled: c.status === "disabled" ? 1 : 0,
    })),
  });
});
app.post("/api/activate", requireUser, limit, async (req, res) => {
  if (typeof req.body.code !== "string")
    return res.status(400).json({ error: "Введите код" });
  const id = await checked(
    db.rpc("vcard_activate", {
      p_hash: hash(req.body.code.trim().toUpperCase()),
      p_user: req.user.id,
    }),
  );
  id
    ? res.json({ id })
    : res
        .status(409)
        .json({ error: "Код неверен, уже использован или карта отключена" });
});
app.use("/api/admin", requireAdmin);
app.get("/api/admin/overview", async (req, res) => {
  const overview = await checked(db.rpc("vcard_overview"));
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const byId = new Map(users.map((u) => [u.id, u.email]));
  overview.stats.users = users.filter(
    (u) => u.app_metadata?.role !== "admin",
  ).length;
  overview.cards = overview.cards.map((c) => ({
    ...c,
    owner: c.owner ? byId.get(c.owner) || "Пользователь" : null,
  }));
  res.json(overview);
});
app.post("/api/admin/cards", async (req, res) => {
  const id = req.body.id || "";
  if (typeof id !== "string" || (id && !/^[1-9][0-9]{0,8}$/.test(id)))
    return res
      .status(400)
      .json({ error: "Номер карты: от 1 до 999999999, без ведущих нулей" });
  const code = secret();
  try {
    const result = await checked(
      db.rpc("vcard_create_card", { p_id: id, p_hash: hash(code) }),
    );
    res.status(201).json({ id: result, code });
  } catch (e) {
    if (e.code === "23505")
      return res.status(409).json({ error: "Этот номер уже занят" });
    throw e;
  }
});
app.patch("/api/admin/cards/:id", async (req, res) => {
  if (typeof req.body.disabled !== "boolean")
    return res.status(400).json({ error: "Некорректный статус" });
  const card = await checked(
    db
      .from("physical_cards")
      .select("owner_id")
      .eq("public_id", req.params.id)
      .maybeSingle(),
  );
  if (!card) return res.status(404).json({ error: "Карта не найдена" });
  await checked(
    db
      .from("physical_cards")
      .update({
        status: req.body.disabled
          ? "disabled"
          : card.owner_id
            ? "active"
            : "unassigned",
      })
      .eq("public_id", req.params.id),
  );
  res.json({ ok: true });
});
app.post("/api/admin/cards/:id/code", async (req, res) => {
  const code = secret();
  const id = await checked(
    db.rpc("vcard_reissue", { p_id: req.params.id, p_hash: hash(code) }),
  );
  id
    ? res.json({ id, code })
    : res.status(409).json({ error: "Карта уже активирована или не найдена" });
});
app.delete("/api/admin/cards/:id", async (req, res) => {
  const rows = await checked(
    db
      .from("physical_cards")
      .delete()
      .eq("public_id", req.params.id)
      .select("id"),
  );
  rows.length
    ? res.json({ ok: true })
    : res.status(404).json({ error: "Карта не найдена" });
});
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Адрес API не найден" }),
);
app.use(express.static(resolve("dist")));
app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
app.use((error, req, res, next) => {
  console.error("API failure", error.code || error.name);
  res
    .status(error.type === "entity.too.large" ? 413 : 500)
    .json({ error: "Не удалось обработать запрос. Повторите позже." });
});
export default app;
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
    console.log("VCard server ready"),
  );
