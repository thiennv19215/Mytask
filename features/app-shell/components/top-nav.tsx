import { topNavItems } from "../shell-navigation";
import type { PageKey } from "@/shared/types/navigation";
import styles from "./app-shell.module.css";

export function TopNav({
  activePage,
  onNavigate
}: {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <header className={styles.topNav}>
      <nav className={styles.topLinks} aria-label="Điều hướng đầu trang">
        {topNavItems.map((item) => (
          <button
            className={`${styles.topLink} ${activePage === item.key ? styles.topLinkActive : ""}`}
            key={item.key}
            onClick={() => onNavigate(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button className={styles.loginButton} type="button">
        Đăng ký / Đăng nhập
      </button>
    </header>
  );
}
