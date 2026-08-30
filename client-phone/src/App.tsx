// src/App.tsx
import { useEffect, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./pages/Dashboard";
import { UserProfilePage } from "./pages/Profile";
import { NotificationsPage } from "./pages/Notifications";
import { SettingsPage } from "./pages/Settings";
import  Analytics from "./pages/Analytics";
import { FindPeoplePage } from "./pages/FindPeople";
import { UserManagementPage } from "./pages/UserManagement";
import type { Page } from "./types";
import LeaderboardPage from "./pages/Leaderboard";
import ReportPage from "./pages/Reports";


type AuthUser = {
  id?: number | string;
  username?: string;
  name?: string;
  email?: string;
  avatar?: string;
  avatar_url?: string;
  role?: string;
  [k: string]: any;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // store selected user so profile page can render the correct person
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // helper checks
  const isAdmin = Boolean(user?.role && user.role.toLowerCase() === "admin");
  const isModerator = Boolean(user?.role && user.role.toLowerCase() === "moderator");

  // Restore auth from storage (run once)
  useEffect(() => {
    // prefer localStorage, fallback to sessionStorage
    const storedToken = localStorage.getItem("bragboard_token") || sessionStorage.getItem("bragboard_token");
    const storedUserJson = localStorage.getItem("bragboard_user") || sessionStorage.getItem("bragboard_user");

    if (storedToken && storedUserJson) {
      try {
        const parsed: AuthUser = JSON.parse(storedUserJson);
        setToken(storedToken);
        setUser(parsed);
        setIsAuthenticated(true);

        // choose default landing for role
        const role = (parsed?.role || "").toLowerCase();
        if (role === "admin") setCurrentPage("Analytics");
        else setCurrentPage("Dashboard");
      } catch (err) {
        // corrupted stored user — clear it
        console.warn("Failed to parse stored user:", err);
        localStorage.removeItem("bragboard_token");
        localStorage.removeItem("bragboard_user");
        sessionStorage.removeItem("bragboard_token");
        sessionStorage.removeItem("bragboard_user");
      }
    }
  }, []);

  const handleLogin = (payload: { access_token?: string; token?: string; user?: AuthUser } | { role?: string }, remember = true) => {
    // flexible parsing for token key names
    const tokenValue = (payload as any).access_token || (payload as any).token || null;
    const userObj = (payload as any).user || null;

    // if LoginPage is calling handleLogin with just role (older pattern), handle that too
    if (!tokenValue && !userObj && (payload as any).role) {
      // fallback — set user based on role only (useful for dev)
      const role = (payload as any).role as string;
      const minimalUser: AuthUser = { role };
      setUser(minimalUser);
      setToken(null);
      setIsAuthenticated(true);
      if (role === "admin") setCurrentPage("Analytics");
      else setCurrentPage("Dashboard");
      return;
    }

    // set state
    if (tokenValue) setToken(tokenValue);
    if (userObj) setUser(userObj);
    setIsAuthenticated(true);

    // persist in storage
    try {
      if (remember) {
        if (tokenValue) localStorage.setItem("bragboard_token", tokenValue);
        if (userObj) localStorage.setItem("bragboard_user", JSON.stringify(userObj));
      } else {
        if (tokenValue) sessionStorage.setItem("bragboard_token", tokenValue);
        if (userObj) sessionStorage.setItem("bragboard_user", JSON.stringify(userObj));
      }
    } catch (err) {
      console.warn("Storage failed:", err);
    }

    // redirect based on role
    const roleFromUser = (userObj?.role || "").toLowerCase();
    if (roleFromUser === "admin") setCurrentPage("Dashboard");
    else setCurrentPage("Dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setCurrentPage("login");
    setSelectedUserId(null);

    // clear both storages
    try {
      localStorage.removeItem("bragboard_token");
      localStorage.removeItem("bragboard_user");
      sessionStorage.removeItem("bragboard_token");
      sessionStorage.removeItem("bragboard_user");
    } catch (err) {
      console.warn("Failed clearing storage:", err);
    }
  };

  // called by FindPeoplePage when user clicks View
  const handleViewProfile = (userId?: number) => {
    if (userId !== undefined) setSelectedUserId(userId);
    setCurrentPage("profile");
  };

  // If not authenticated, show login page.
  // Pass a wrapper to LoginPage so it can call our handleLogin with full payload.
  if (!isAuthenticated && currentPage === "login") {
    return (
      <LoginPage
        onLogin={(payload: any, remember: boolean = true) => {
          if (payload?.access_token || payload?.token) {
            handleLogin(payload, remember);
            return;
          }

          // if older LoginPage simply passes role string, handle that
          if (typeof payload === "string") {
            handleLogin({ role: payload }, remember);
            return;
          }

          // if LoginPage returns role property
          if (payload?.role) {
            handleLogin({ role: payload.role }, remember);
            return;
          }

          // fallback: assume payload is { token, user }
          handleLogin(payload, remember);
        }}
      />
    );
  }

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={(p: Page) => setCurrentPage(p)}
      isAdmin={isAdmin}
      onLogout={handleLogout}
      currentUser={user ?? undefined}  
    >
      {currentPage === "Dashboard" && (
        <DashboardPage
          onViewShout={() => setCurrentPage("Analytics")}
          onViewFindPeople={() => setCurrentPage("findpeople")}
        />
      )}

      {currentPage === "findpeople" && (
        <FindPeoplePage onViewProfile={handleViewProfile} onBack={() => setCurrentPage("Dashboard")} />
      )}
      
      {currentPage === "profile" && (
        <UserProfilePage userId={selectedUserId} onNavigate={(p) => setCurrentPage(p)} />
      )}
      {currentPage === "settings" && <SettingsPage />}
      {currentPage === "leaderboard" && <LeaderboardPage />}
      {currentPage === "notifications" && <NotificationsPage />}

      {currentPage === "Analytics" && isAdmin && <Analytics />}
      {currentPage === "reports" && <ReportPage />}
      {currentPage === "userManagement" && isAdmin && <UserManagementPage />}


      {/* If user navigates to an admin-only page but isn't admin, show a fallback or redirect */}
      {currentPage === "userManagement" && !isAdmin && (
        <div className="p-6 text-center text-sm text-red-600">You do not have permission to view this page.</div>
      )}
      {currentPage === "Analytics" && !isAdmin && (
        <div className="p-6 text-center text-sm text-red-600">You do not have permission to view Analytics.</div>
      )}
      {currentPage === "reports" && !isAdmin && (
        <div className="p-6 text-center text-sm text-red-600">You do not have permission to view reports.</div>
      )}
    </MainLayout>
  );
}
