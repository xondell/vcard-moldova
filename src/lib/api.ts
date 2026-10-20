import type { Profile } from "./product";
export type Account = {
  id: string;
  email: string;
  role: "admin" | "user";
  profile: Profile | null;
  published: boolean;
};
export let account: Account | null = null;
export const setAccount = (value: Account | null) => {
  account = value;
};
export async function api<T = Record<string, never>>(
  path: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(
    `/api${path}`,
    body === undefined
      ? {}
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}
export async function logout() {
  await api("/logout", {});
  account = null;
  window.location.assign("/");
}
