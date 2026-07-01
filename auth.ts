import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isAuthConfigured, verifyUser } from "@/lib/auth/users";

function resolveAuthSecret(): string | undefined {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.AUTH_DISABLED === "true") return "local-dev-auth-disabled";
  if (process.env.RENDER === "true" && isAuthConfigured()) {
    return "poolbar-ausweise-render-session-secret";
  }
  return undefined;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  providers: [
    Credentials({
      name: "Anmeldung",
      credentials: {
        username: { label: "Benutzername", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!isAuthConfigured()) return null;

        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string") {
          return null;
        }

        const user = verifyUser(username, password);
        if (!user) return null;

        return { id: user.username, name: user.username };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
