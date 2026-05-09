"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { topNavItems } from "../shell-navigation";
import styles from "./app-shell.module.css";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            className={`${styles.topLink} ${isActivePath(pathname, item.href) ? styles.topLinkActive : ""}`}
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
