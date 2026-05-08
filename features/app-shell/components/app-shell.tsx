"use client";

import { useMemo, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { navItems } from "../shell-navigation";
import { HomeMainBody } from "@/features/home/components/home-main-body";
import { ComingSoonMainBody } from "@/features/placeholder-pages/components/coming-soon-main-body";
import { StudioMainBody } from "@/features/studio/components/studio-main-body";
import type { PageKey } from "@/shared/types/navigation";
import styles from "./app-shell.module.css";

export function AppShell() {
  const [activePage, setActivePage] = useState<PageKey>("home");

  const activeLabel = useMemo(
    () => navItems.find((item) => item.key === activePage)?.label ?? "Trang chủ",
    [activePage]
  );

  return (
    <div className={styles.appShell}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <section className={styles.contentShell} aria-label={activeLabel}>
        <TopNav activePage={activePage} onNavigate={setActivePage} />
        <main className={styles.mainContent}>
          {activePage === "home" ? (
            <HomeMainBody />
          ) : activePage === "tools" ? (
            <StudioMainBody />
          ) : (
            <ComingSoonMainBody page={activePage} />
          )}
        </main>
      </section>
    </div>
  );
}
