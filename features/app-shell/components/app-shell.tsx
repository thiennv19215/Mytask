"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import styles from "./app-shell.module.css";

const SIDEBAR_STORAGE_KEY = "ai-apps-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
  }, []);

  function toggleSidebar() {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
      return nextValue;
    });
  }

  return (
    <div className={styles.appShell}>
      <Sidebar collapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <section className={styles.contentShell} aria-label="AI Apps">
        <TopNav />
        <main className={styles.mainContent}>{children}</main>
      </section>
    </div>
  );
}
