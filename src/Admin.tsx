import { useEffect, useState } from "react";
import { api, account, logout, setAccount } from "./lib/api";
import { appUrl } from "./lib/product";

type Card = {
  id: string;
  disabled: number;
  owner: string | null;
  created: number;
};
type Overview = {
  stats: {
    users: number;
    activeUsers: number;
    activeCards: number;
    activeLinks: number;
    totalCards: number;
    publishedProfiles: number;
  };
  cards: Card[];
};
export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(account?.role === "admin");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState("");
  const [issued, setIssued] = useState<{ id: string; code: string } | null>(
    null,
  );
  const [filter, setFilter] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const refresh = async () => setData(await api<Overview>("/admin/overview"));
  useEffect(() => {
    if (loggedIn) refresh().catch((e) => setError(e.message));
  }, [loggedIn]);
  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!loggedIn)
    return (
      <main className="admin-login">
        <a className="brand" href="/">
          VCard <small>MD</small>
        </a>
        <span className="form-kicker">ADMIN / SECURE ACCESS</span>
        <h1>Панель администратора</h1>
        <p>Вход для управления картами и пользователями.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const form = new FormData(e.currentTarget);
            try {
              const result = await api<{ user: NonNullable<typeof account> }>(
                "/login",
                { email: form.get("login"), password: form.get("password") },
              );
              setAccount(result.user);
              if (result.user.role !== "admin")
                throw Error("У аккаунта нет прав администратора");
              setLoggedIn(true);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Логин
            <input name="login" autoComplete="username" required />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-dark full-width" disabled={busy}>
            Войти в админ-панель
          </button>
        </form>
      </main>
    );
  const stats = data?.stats;
  return (
    <div className="admin-page">
      <header className="admin-header">
        <a href="/" className="brand">
          VCard <small>MD</small>
        </a>
        <span>Панель администратора</span>
        <button
          className="button button-soft"
          onClick={() => logout().catch((e) => setError(e.message))}
        >
          Выйти
        </button>
      </header>
      <main className="admin-main">
        <div className="page-heading-row">
          <div>
            <span className="form-kicker">CONTROL CENTER</span>
            <h1>Обзор проекта</h1>
            <p>Карты, ссылки и активность пользователей в одном месте.</p>
          </div>
          <button
            className="button button-soft"
            disabled={busy}
            onClick={() => action(refresh)}
          >
            Обновить
          </button>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <section className="admin-stats" aria-label="Статистика">
          {[
            [
              "Активные пользователи",
              stats?.activeUsers,
              "Входили за последние 30 дней",
            ],
            [
              "Активные ссылки",
              stats?.activeLinks,
              "Карты с опубликованным профилем",
            ],
            [
              "Активные карты",
              stats?.activeCards,
              "Привязаны к владельцу и включены",
            ],
            ["Всего карт", stats?.totalCards, "Включая неактивированные"],
            ["Пользователи", stats?.users, "Зарегистрированные аккаунты"],
            [
              "Публичные профили",
              stats?.publishedProfiles,
              "Опубликованные пользователями",
            ],
          ].map(([label, value, hint]) => (
            <article key={label} className="admin-stat">
              <span>{label}</span>
              <strong>{value ?? "—"}</strong>
              <small>{hint}</small>
            </article>
          ))}
        </section>
        <section className="admin-create">
          <div>
            <h2>Добавить карту</h2>
            <p>
              Введите номер или ссылку на этом домене. Пустое поле — следующий
              свободный номер.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                let value = id.trim();
                if (value.startsWith("http")) {
                  const url = new URL(value);
                  if (
                    ![
                      new URL(appUrl()).origin,
                      window.location.origin,
                    ].includes(url.origin)
                  )
                    throw Error("Используйте домен этого сайта");
                  value = url.pathname.replace(/^\//, "");
                }
                value = value.replace(/^\//, "");
                const result = await api<{ id: string; code: string }>(
                  "/admin/cards",
                  { id: value },
                );
                setIssued(result);
                setId("");
              });
            }}
          >
            <label>
              Номер или ссылка
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={`${appUrl()}/24`}
              />
            </label>
            <button className="button button-dark" disabled={busy}>
              {" "}
              {id.trim() ? "Добавить карту" : "Сгенерировать карту"}
            </button>
          </form>
        </section>
        {issued && (
          <section className="admin-secret" role="status">
            <h3>Карта /{issued.id} готова</h3>
            <p>
              Сохраните код сейчас: он показывается только при создании или
              перевыпуске.
            </p>
            <a href={`/${issued.id}`}>
              {appUrl()}/{issued.id}
            </a>
            <code>{issued.code}</code>
            <button
              className="button button-soft"
              onClick={() =>
                navigator.clipboard
                  .writeText(`${appUrl()}/${issued.id}\n${issued.code}`)
                  .catch(() => setError("Не удалось скопировать код"))
              }
            >
              Копировать ссылку и код
            </button>
            <button className="text-button" onClick={() => setIssued(null)}>
              Скрыть код
            </button>
          </section>
        )}
        <section className="admin-inventory">
          <div className="page-heading-row">
            <h2>Карты</h2>
            <label>
              Поиск
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Номер или email"
              />
            </label>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ссылка</th>
                  <th>Статус</th>
                  <th>Владелец</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data?.cards
                  .filter((c) => `${c.id} ${c.owner || ""}`.includes(filter))
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <a href={`/${c.id}`}>/{c.id}</a>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${c.disabled ? "off" : c.owner ? "on" : ""}`}
                        >
                          {c.disabled
                            ? "Отключена"
                            : c.owner
                              ? "Активна"
                              : "Ожидает активации"}
                        </span>
                      </td>
                      <td>{c.owner || "Не назначен"}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            disabled={busy}
                            onClick={() =>
                              action(() =>
                                api(
                                  `/admin/cards/${c.id}`,
                                  { disabled: !c.disabled },
                                  "PATCH",
                                ),
                              )
                            }
                          >
                            {c.disabled ? "Включить" : "Отключить"}
                          </button>
                          {!c.owner && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                action(async () =>
                                  setIssued(
                                    await api(`/admin/cards/${c.id}/code`, {}),
                                  ),
                                )
                              }
                            >
                              Новый код
                            </button>
                          )}
                          <button
                            className="danger-text"
                            disabled={busy}
                            onClick={() => setDeleting(c.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {data && !data.cards.length && (
            <p>Карт пока нет. Создайте первую выше.</p>
          )}
        </section>
      </main>
      {deleting && (
        <div className="admin-modal-backdrop">
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Удалить карту /{deleting}?</h2>
            <p>Ссылка перестанет работать, а код активации будет удалён.</p>
            <button
              className="button button-soft"
              onClick={() => setDeleting(null)}
            >
              Отмена
            </button>
            <button
              className="button button-dark"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  await api(`/admin/cards/${deleting}`, {}, "DELETE");
                  setDeleting(null);
                  setIssued(null);
                })
              }
            >
              Удалить навсегда
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
