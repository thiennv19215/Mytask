"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import styles from "./app-shell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  function toggleSidebar() {
    setIsSidebarCollapsed((currentValue) => !currentValue);
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
