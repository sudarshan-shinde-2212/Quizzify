import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  apiAdminLogin,
  apiGetProfile,
  saveSession,
  clearSession,
  getToken,
  getStoredRole,
  getStoredUser,
  parseOAuthCallback,
  StoredUser,
} from "./api";

// ── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  /** Authenticated user (null = not logged in) */
  user: StoredUser | null;
  /** True when the logged-in user is an admin */
  isAdmin: boolean;
  /** Loading state – true while restoring session or making auth requests */
  loading: boolean;
  /** Refresh user details from backend */
  refreshProfile: () => Promise<void>;
  /**
   * Admin credential login.
   * Throws on failure so the caller can show an error message.
   */
  adminLogin: (email: string, password: string) => Promise<void>;
  /**
   * Student Google OAuth – redirects the browser.
   * Import startGoogleOAuth from api.ts and call it directly from the
   * login-page; we expose it here for convenience.
   */
  loginWithGoogle: () => void;
  /** Clear session and return to unauthenticated state */
  logout: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // start true – hydrate session

  // ── On mount: restore session from localStorage OR parse OAuth callback ──
  useEffect(() => {
    async function initSession() {
      // 1. Check if we're returning from a Google OAuth redirect
      const oauthResult = parseOAuthCallback();
      if (oauthResult) {
        const { token, role, profileCompleted } = oauthResult;
        const userRole: StoredUser["role"] = role === "admin" ? "admin" : "student";
        const syntheticUser: StoredUser = {
          id: "",
          email: "",
          fullName: "Student",
          role: userRole,
          profileCompleted,
        };
        saveSession(token, userRole, syntheticUser);
        setUser(syntheticUser);
        setIsAdmin(userRole === "admin");

        try {
          const profile = await apiGetProfile();
          saveSession(token, userRole, profile);
          setUser(profile);
        } catch (err) {
          console.error("Failed to load profile details after OAuth redirect", err);
        }
        setLoading(false);
        return;
      }

      // 2. Restore an existing session (page refresh)
      const token = getToken();
      const role  = getStoredRole();
      const stored = getStoredUser();
      if (token && stored) {
        setUser(stored);
        setIsAdmin(role === "admin");
        try {
          const profile = await apiGetProfile();
          saveSession(token, role || "", profile);
          setUser(profile);
        } catch (err) {
          console.error("Failed to refresh profile details", err);
        }
      }
      setLoading(false);
    }

    initSession();
  }, []);

  // ── Refresh profile method ─────────────────────────────────────────────────
  const refreshProfile = async () => {
    const token = getToken();
    const role = getStoredRole();
    if (token && role) {
      const profile = await apiGetProfile();
      saveSession(token, role, profile);
      setUser(profile);
    }
  };

  // ── Admin login ──────────────────────────────────────────────────────────
  const adminLogin = async (email: string, password: string) => {
    const data = await apiAdminLogin(email, password);
    const adminUser: StoredUser = {
      id: "admin",
      email,
      fullName: "Administrator",
      role: "admin",
    };
    saveSession(data.accessToken, data.role, adminUser);
    setUser(adminUser);
    setIsAdmin(true);
  };

  // ── Google OAuth (student) ────────────────────────────────────────────────
  const loginWithGoogle = () => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
    window.location.href = `${BASE_URL}/auth/google`;
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = () => {
    clearSession();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, refreshProfile, adminLogin, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
