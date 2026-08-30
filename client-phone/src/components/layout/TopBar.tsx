import { useState } from "react";
import type { Page, CurrentUser } from "../../types/index";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Bell, Search, LogOut, User, Settings as SettingsIcon } from "lucide-react";
import { NotificationDropdown } from "../NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onCreateShout: () => void;
  onNavigate: (page: Page) => void;
  currentPage: Page;
  isAdmin?: boolean;
  onLogout?: () => void;
  currentUser?: CurrentUser;
  isSidebarCollapsed?: boolean;
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  Dashboard: {
    title: "Dashboard",
    subtitle: "Overview of team activity and engagement",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Recent updates and important alerts",
  },
  profile: {
    title: "My Profile",
    subtitle: "View and manage your personal information",
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your account settings and preferences",
  },
  findpeople: {
    title: "Find People",
    subtitle: "Discover and connect with teammates",
  },
  leaderboard: {
    title: "Leaderboard",
    subtitle: "See top performers across the organization",
  },
  reports: {
    title: "Reports & Moderation",
    subtitle: "Review, moderate and export reported content",
  },
  Analytics: {
    title: "Analytics",
    subtitle: "Platform performance and insights",
  },
  userManagement: {
    title: "User Management",
    subtitle: "Create, edit and manage all users",
  },
};

export function TopBar({
  onNavigate,
  currentPage,
  onLogout,
  currentUser,
  isSidebarCollapsed = false,
}: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = currentUser?.name || currentUser?.username || "User";
  const displayEmail = currentUser?.email || "—";
  const avatarSrc = currentUser?.avatarUrl || currentUser?.avatar || undefined;

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const page = PAGE_META[currentPage];

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 topbar z-40 transition-all duration-300",
        isSidebarCollapsed ? "left-20" : "left-64"
      )}
    >
      <div className="h-full px-8 flex items-center justify-between">
        {/* Page Title */}
        <div className="flex flex-col animate-fade-in">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {page?.title || "Welcome"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {page?.subtitle || ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              <span className="notification-badge ring-2 ring-background" />
            </Button>

            {showNotifications && (
              <NotificationDropdown
                onClose={() => setShowNotifications(false)}
                onViewAll={() => {
                  setShowNotifications(false);
                  onNavigate("notifications");
                }}
              />
            )}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-secondary transition-colors ml-2">
                <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                  {avatarSrc ? (
                    <AvatarImage src={avatarSrc} alt={displayName} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-medium">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{displayEmail}</p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1" sideOffset={8}>
              <DropdownMenuLabel className="px-3 py-2">
                <p className="font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onNavigate("profile")}
                className="px-3 py-2 rounded-lg cursor-pointer"
              >
                <User className="w-4 h-4 mr-3 text-muted-foreground" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onNavigate("settings")}
                className="px-3 py-2 rounded-lg cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 mr-3 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onNavigate("notifications")}
                className="px-3 py-2 rounded-lg cursor-pointer"
              >
                <Bell className="w-4 h-4 mr-3 text-muted-foreground" />
                Notifications
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  if (onLogout) onLogout();
                  else onNavigate("login");
                }}
                className="px-3 py-2 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
