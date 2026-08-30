import { Button } from "../ui/button";
import type { Page } from "../../types";
import {
  LayoutDashboard,
  TrendingUp,
  User,
  Settings,
  Users,
  Bell,
  Megaphone,
  BarChart3,
  UserCog,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  icon: React.ElementType;
  page: Page;
};

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onCreateShout?: () => void;
  isAdmin?: boolean;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ currentPage, onNavigate, onCreateShout, isAdmin = false, isCollapsed = false, onCollapsedChange }: SidebarProps) {

  const baseNav: NavItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Notifications", icon: Bell, page: "notifications" },
    { name: "My Profile", icon: User, page: "profile" },
    { name: "Find People", icon: Users, page: "findpeople" },
    { name: "Settings", icon: Settings, page: "settings" },
  ];

  const userNav: NavItem[] = !isAdmin
    ? [{ name: "Leaderboard", icon: TrendingUp, page: "leaderboard" }]
    : [];

  const adminNav: NavItem[] = isAdmin
    ? [
        { name: "Reports", icon: Megaphone, page: "reports" },
        { name: "Analytics", icon: BarChart3, page: "Analytics" },
        { name: "User Management", icon: UserCog, page: "userManagement" },
      ]
    : [];

  const navigation: NavItem[] = [baseNav[0], ...userNav, ...baseNav.slice(1), ...adminNav];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col bg-sidebar transition-all duration-300 ease-out z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Logo Section */}
      <div className={cn(
        "h-16 flex items-center border-sidebar-border/30",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!isCollapsed && (
          <div className="h-16 flex items-center justify-center pt-2">
            <img src="/logo.png" alt="logo" />
          </div>
        )}
        <button
          onClick={() => onCollapsedChange?.(!isCollapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.page)}
              className={cn(
                "nav-item w-full group",
                isActive ? "nav-item-active" : "nav-item-inactive",
                isCollapsed && "justify-center px-0"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Create Button */}
      <div className={cn("p-4 border-t border-sidebar-border/30", isCollapsed && "px-3")}>
        <Button
          className={cn(
            "w-full h-11 btn-primary-glow rounded-xl text-sm font-semibold transition-all duration-200",
            isCollapsed ? "px-0" : "px-4"
          )}
          onClick={() => {
            if (onCreateShout) onCreateShout();
          }}
        >
          {isCollapsed ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Shout Out
            </>
          )}
        </Button>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-black/10 to-transparent" />
    </aside>
  );
}

export default Sidebar;
