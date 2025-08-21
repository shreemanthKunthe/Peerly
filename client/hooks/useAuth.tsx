import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, logout as apiLogout } from "@/lib/api";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type CurrentUser = { uid: string; role: "seeker" | "guider" | null } | null;

interface AuthContextValue {
  user: CurrentUser;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const me = await getMe().catch(() => null);
      setUser(me ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogout = async () => {
    try {
      await apiLogout();
    } finally {
      await signOut(auth).catch(() => {});
      setUser(null);
    }
  };

  const value = useMemo<AuthContextValue>(() => ({ user, loading, refresh: load, logout: doLogout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
