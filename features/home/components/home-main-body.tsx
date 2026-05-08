import { homeTools, platformStats } from "../home.data";
import { ArrowRightIcon, SparkIcon } from "@/shared/ui/icons";
import styles from "./home-main-body.module.css";

export function HomeMainBody() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <SparkIcon />
          Nền tảng AI sáng tạo hàng đầu
        </div>
        <h1>
          Sáng tạo <span>không giới hạn</span> với AI
        </h1>
        <p>
          Tạo ảnh, video và trò chuyện với AI thông minh - tất cả trong một nền tảng mạnh mẽ, dễ sử dụng và
          không cần kinh nghiệm kỹ thuật.
        </p>
        <div className={styles.heroActions}>
          <button className={styles.primaryGradientButton} type="button">
            <SparkIcon />
            Bắt đầu tạo
          </button>
          <button className={styles.secondaryButton} type="button">
            Chat với AI
            <ArrowRightIcon />
          </button>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Thống kê nền tảng">
        {platformStats.map(([value, label]) => (
          <article className={styles.statCard} key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className={styles.toolsSection}>
        <h2>Công cụ AI mạnh mẽ</h2>
        <p>Chọn công cụ phù hợp và bắt đầu sáng tạo ngay</p>
        <div className={styles.toolGrid}>
          {homeTools.map(([title, description]) => (
            <article className={styles.toolCard} key={title}>
              <div className={styles.toolIcon}>
                <SparkIcon />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <button type="button">Khám phá</button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
