export interface AuthUser {
  username: string;
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
