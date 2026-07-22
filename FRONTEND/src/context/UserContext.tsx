"use client";

/**
 * context/UserContext.tsx
 * =======================
 * Thin compatibility shim.
 *
 * The original codebase referenced `useUser()` / `UserProvider` from this path.
 * All real auth state now lives in `@/store/SessionContext` (Supabase Auth listener).
 *
 * This shim re-exports from SessionContext so any component that still does
 * `import { useUser } from "@/context/UserContext"` keeps compiling without
 * a code change on that component's side.
 */

import React, { createContext, useContext } from "react";
import { useSession } from "@/store/SessionContext";

// ─── Compatibility shape expected by legacy components ────────────────────────
interface UserContextType {
  user: { id: string; email: string } | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, isLoading: false });

/**
 * Drop-in replacement provider.
 * Reads from SessionContext so there is a single source of truth for auth.
 */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId, profile, isAuthenticated } = useSession();

  const user = isAuthenticated && userId
    ? { id: userId, email: profile.email }
    : null;

  return (
    <UserContext.Provider value={{ user, isLoading: false }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook for legacy components (`ResumeUploader` was using this).
 * Prefer `useSession()` in new code.
 */
export const useUser = (): UserContextType => useContext(UserContext);
