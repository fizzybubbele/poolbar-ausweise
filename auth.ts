import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isAuthConfigured, verifyUser } from "@/lib/auth/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
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
