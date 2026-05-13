"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { topNavItems } from "../shell-navigation";
import styles from "./app-shell.module.css";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveTopNavKey(pathname: string) {
  return [...topNavItems]
    .sort((firstItem, secondItem) => secondItem.href.length - firstItem.href.length)
    .find((item) => isActivePath(pathname, item.href))?.key;
}

export function TopNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const activeTopNavKey = getActiveTopNavKey(pathname);

  return (
    <header className={styles.topNav}>
      <button
        aria-controls="top-navigation"
        aria-expanded={isMobileMenuOpen}
        aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
        className={styles.mobileMenuButton}
        onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        aria-label="Điều hướng đầu trang"
        className={`${styles.topLinks} ${isMobileMenuOpen ? styles.topLinksOpen : ""}`}
        id="top-navigation"
      >
        {topNavItems.map((item) => (
          <Link
            className={`${styles.topLink} ${activeTopNavKey === item.key ? styles.topLinkActive : ""}`}
            href={item.href}
            key={item.key}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button className={styles.loginButton} type="button">
        Đăng ký / Đăng nhập
      </button>
    </header>
  );
}
