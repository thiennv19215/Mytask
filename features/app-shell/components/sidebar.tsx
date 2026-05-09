"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "../shell-navigation";
import type { NavItem } from "@/shared/types/navigation";
import { AppIcon, ChevronLeftIcon, StarIcon } from "@/shared/ui/icons";
import styles from "./app-shell.module.css";

const primaryNavKeys = new Set(["home", "tools", "resources", "chatbotPrompt"]);
const primaryNavItems = navItems.filter((item) => primaryNavKeys.has(item.key));
const systemNavItems = navItems.filter((item) => !primaryNavKeys.has(item.key));

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarGroup({
  collapsed,
  items,
  label,
  onExpand,
  pathname
}: {
  collapsed: boolean;
  items: NavItem[];
  label: string;
  onExpand: () => void;
  pathname: string;
}) {
  return (
    <div className={styles.navGroup}>
      <p className={styles.sectionLabel}>{label}</p>
      <nav className={styles.sideNav} aria-label={label}>
        {items.map((item) => (
          <Link
            aria-label={collapsed ? item.label : undefined}
            className={`${styles.navItem} ${isActivePath(pathname, item.href) ? styles.navItemActive : ""}`}
            href={item.href}
            key={item.key}
            onClick={(event) => {
              if (collapsed) {
                event.preventDefault();
                onExpand();
              }
            }}
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.navIcon}>
              <AppIcon name={item.icon} />
            </span>
            <span className={styles.sidebarText}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();

  function expandSidebar() {
    if (collapsed) {
      onToggleCollapse();
    }
  }

  return (
    <aside
      aria-label="Điều hướng chính"
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      data-collapsed={collapsed}
      onClick={(event) => {
        if (!collapsed) {
          return;
        }

        const target = event.target as HTMLElement;
        if (target.closest("button") || target.closest("a")) {
          return;
        }

        expandSidebar();
      }}
    >
      <div className={styles.sidebarMain}>
        <button
          aria-label={collapsed ? "Mở rộng sidebar" : "AI APPS"}
          className={styles.brandButton}
          onClick={expandSidebar}
          tabIndex={collapsed ? 0 : -1}
          title={collapsed ? "Mở rộng" : undefined}
          type="button"
        >
          <div className={styles.brandMark}>
            <StarIcon />
          </div>
          <div className={`${styles.brandCopy} ${styles.sidebarText}`}>
            <strong>AI APPS</strong>
            <span>Workspace v0.1</span>
          </div>
        </button>

        <p className={styles.sidebarStatus}>Sẵn sàng tạo nội dung</p>

        <SidebarGroup collapsed={collapsed} items={primaryNavItems} label="Khám phá" onExpand={expandSidebar} pathname={pathname} />
        <SidebarGroup collapsed={collapsed} items={systemNavItems} label="Hệ thống" onExpand={expandSidebar} pathname={pathname} />
      </div>

      <div className={styles.sidebarFooter}>
        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          title={collapsed ? "Mở rộng" : "Thu nhỏ"}
          type="button"
        >
          <span className={styles.collapseIcon}>
            <ChevronLeftIcon />
          </span>
          <span className={styles.sidebarText}>{collapsed ? "Mở rộng" : "Thu nhỏ"}</span>
        </button>
      </div>
    </aside>
  );
}
