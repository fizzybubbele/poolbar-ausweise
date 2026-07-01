"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useContext } from "react";

const AuthEnabledContext = createContext(true);

export function AuthProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <AuthEnabledContext.Provider value={false}>
        {children}
      </AuthEnabledContext.Provider>
    );
  }

  return (
    <AuthEnabledContext.Provider value={true}>
      <SessionProvider>{children}</SessionProvider>
    </AuthEnabledContext.Provider>
  );
}

export function useAuthEnabled() {
  return useContext(AuthEnabledContext);
}
