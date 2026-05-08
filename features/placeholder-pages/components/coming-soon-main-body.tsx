import { placeholderPages } from "../placeholder-pages.data";
import type { PageKey } from "@/shared/types/navigation";
import { AppIcon } from "@/shared/ui/icons";
import styles from "./coming-soon-main-body.module.css";

type PlaceholderPageKey = Exclude<PageKey, "home">;

export function ComingSoonMainBody({ page }: { page: PlaceholderPageKey }) {
  const copy = placeholderPages[page];

  return (
    <section className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <p className={styles.eyebrow}>{copy.label}</p>
        <div className={styles.pageTitleRow}>
          <h1>{copy.heading}</h1>
          <span className={styles.statusPill}>Đang phát triển</span>
        </div>
        <p>{copy.subtext}</p>
      </div>
      <article className={styles.developmentPanel}>
        <div className={styles.developmentIcon}>
          <AppIcon name={copy.icon} />
        </div>
        <h2>Đang phát triển</h2>
        <p>{copy.panelDescription}</p>
        <button className={styles.disabledButton} type="button">
          Sắp ra mắt
        </button>
      </article>
      <div className={styles.previewGrid}>
        {copy.cards.map((card) => (
          <article className={styles.previewCard} key={card.title}>
            <div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <span>Sắp ra mắt</span>
          </article>
        ))}
      </div>
    </section>
  );
}
