import { navItems } from "../shell-navigation";
import type { PageKey } from "@/shared/types/navigation";
import { AppIcon, ChevronLeftIcon, StarIcon } from "@/shared/ui/icons";
import styles from "./app-shell.module.css";

export function Sidebar({
  activePage,
  onNavigate
}: {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <aside className={styles.sidebar} aria-label="Điều hướng chính">
      <div>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <StarIcon />
          </div>
          <strong>AI STUDIO</strong>
        </div>
        <div className={styles.sidebarDivider} />
        <p className={styles.sectionLabel}>KHÁM PHÁ</p>
        <nav className={styles.sideNav}>
          {navItems.map((item) => (
            <button
              className={`${styles.navItem} ${activePage === item.key ? styles.navItemActive : ""}`}
              key={item.key}
              onClick={() => onNavigate(item.key)}
              type="button"
            >
              <span className={styles.navIcon}>
                <AppIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div>
        <div className={styles.sidebarDivider} />
        <button className={styles.collapseButton} type="button">
          <ChevronLeftIcon />
          <span>Thu nhỏ</span>
        </button>
      </div>
    </aside>
  );
}
