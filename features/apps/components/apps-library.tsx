import Link from "next/link";
import { appsTools, type AppsTool } from "../apps.data";
import { AppsIcon } from "./apps-icons";
import styles from "./apps-library.module.css";

const statusLabel: Record<AppsTool["status"], string> = {
  available: "Sẵn sàng",
  beta: "Beta",
  comingSoon: "Sắp ra mắt"
};

export function AppsLibrary() {
  return (
    <section className={styles.appsPage} aria-labelledby="apps-title">
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>AI APPS</p>
        <h1 id="apps-title">Ứng dụng AI</h1>
        <p>Tổng hợp công cụ tạo ảnh, video, chatbot, prompt và quản lý gói cho quy trình sáng tạo nội dung.</p>
      </header>

      <section className={styles.popularSection} aria-labelledby="popular-apps-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="popular-apps-title">Phổ biến nhất</h2>
            <p>Các ứng dụng AI được dùng nhiều trong quy trình sáng tạo.</p>
          </div>
          <span>{appsTools.length} ứng dụng</span>
        </div>

        <div className={styles.appsGrid}>
          {appsTools.map((tool) => (
            <AppCard key={tool.title} tool={tool} />
          ))}
        </div>
      </section>
    </section>
  );
}

function AppCard({ tool }: { tool: AppsTool }) {
  const content = (
    <>
      <div className={`${styles.preview} ${styles[`${tool.previewType}Preview`]}`}>
        <PreviewVisual type={tool.previewType} />
        <span className={`${styles.badge} ${styles[`badge${tool.badge}`]}`}>{tool.badge}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitleRow}>
          <AppsIcon className={styles.cardIcon} name={tool.icon} />
          <span>{statusLabel[tool.status]}</span>
        </div>
        <h3>{tool.title}</h3>
        <p>{tool.description}</p>
        <strong className={tool.href ? styles.cta : styles.disabledCta}>{tool.ctaLabel}</strong>
      </div>
    </>
  );

  if (!tool.href) {
    return (
      <article aria-label={`${tool.title} chưa sẵn sàng`} className={`${styles.appCard} ${styles.isDisabled}`}>
        {content}
      </article>
    );
  }

  return (
    <Link aria-label={`Mở ${tool.title}`} className={styles.appCard} href={tool.href}>
      {content}
    </Link>
  );
}

function PreviewVisual({ type }: { type: AppsTool["previewType"] }) {
  if (type === "image") {
    return (
      <div className={styles.imageVisual}>
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className={styles.videoVisual}>
        <div className={styles.playDot} />
      </div>
    );
  }

  if (type === "product") {
    return (
      <div className={styles.productVisual}>
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <div className={styles.scriptVisual}>
      <span />
      <span />
      <span />
    </div>
  );
}
