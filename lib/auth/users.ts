export interface AuthUser {
  username: string;
}

const RENDER_DEFAULT_USERNAME = "pb#26-admin";
const RENDER_DEFAULT_PASSWORD = "pb-p3rs0n4l-2026!#k3y";

function applyRenderDefaults(users: Map<string, string>) {
  if (users.size > 0) return;
  if (process.env.RENDER !== "true") return;
  if (process.env.AUTH_DISABLED === "true") return;

  const username = process.env.AUTH_USERNAME?.trim() || RENDER_DEFAULT_USERNAME;
  const password = process.env.AUTH_PASSWORD?.trim() || RENDER_DEFAULT_PASSWORD;
  users.set(username, password);
}

export function parseUsers(): Map<string, string> {
  const users = new Map<string, string>();

  const multi = process.env.AUTH_USERS?.trim();
  if (multi) {
    for (const pair of multi.split(",")) {
      const colon = pair.indexOf(":");
      if (colon === -1) continue;
      const username = pair.slice(0, colon).trim();
      const password = pair.slice(colon + 1).trim();
      if (username && password) users.set(username, password);
    }
  }

  const singleUser = process.env.AUTH_USERNAME?.trim();
  const singlePass = process.env.AUTH_PASSWORD?.trim();
  if (singleUser && singlePass) {
    users.set(singleUser, singlePass);
  }

  applyRenderDefaults(users);
  return users;
}

export function verifyUser(
  username: string,
  password: string
): AuthUser | null {
  const users = parseUsers();
  const expected = users.get(username.trim());
  if (!expected || expected !== password) return null;
  return { username: username.trim() };
}

export function isAuthConfigured(): boolean {
  return parseUsers().size > 0;
}

export function isAuthEnabled(): boolean {
  if (process.env.AUTH_DISABLED === "true") return false;
  return isAuthConfigured();
}
