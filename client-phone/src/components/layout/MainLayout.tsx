import { useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import CreateShoutSlideOver from "../CreateShout";
import type { Page, CurrentUser } from "../../types/index";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isAdmin?: boolean;
  onLogout?: () => void;
  currentUser?: CurrentUser;
}

export function MainLayout({
  children,
  currentPage,
  onNavigate,
  isAdmin = false,
  onLogout,
  currentUser,
}: MainLayoutProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-surface)" }}>
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onCreateShout={() => setIsCreateOpen(true)}
        isAdmin={isAdmin}
        isCollapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
      />
      
      <TopBar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onCreateShout={() => setIsCreateOpen(true)}
        isAdmin={isAdmin}
        onLogout={onLogout}
        currentUser={currentUser}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <main
        className={cn(
          "pt-20 pb-6 pr-5 transition-all duration-300",
          isSidebarCollapsed ? "pl-24" : "pl-[272px]"
        )}
      >
        <div className="max-w-6xl mx-auto page-enter">
          {children}
        </div>
      </main>
      <CreateShoutSlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

export default MainLayout;
