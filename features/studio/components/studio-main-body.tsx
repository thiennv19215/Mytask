"use client";

import { useState } from "react";
import { studioTools, type StudioTool } from "../studio.data";
import styles from "./studio-main-body.module.css";

type ActiveTool = "library" | "image-generator";

const statusLabel: Record<StudioTool["status"], string> = {
  available: "Sẵn dùng",
  beta: "Beta",
  comingSoon: "Sắp ra mắt"
};

export function StudioMainBody() {
  const [activeTool, setActiveTool] = useState<ActiveTool>("library");

  if (activeTool === "image-generator") {
    return <ImageGeneratorMainBody onBack={() => setActiveTool("library")} />;
  }

  return (
    <section className={styles.studioBody} aria-labelledby="studio-title">
      <header className={styles.studioHeader}>
        <p className={styles.eyebrow}>STUDIO</p>
        <div className={styles.pageTitleRow}>
          <h1 id="studio-title">Công cụ AI</h1>
          <span className={styles.toolsBetaBadge}>Beta</span>
        </div>
        <p>Tạo nội dung, hình ảnh, video và tự động hóa quy trình sáng tạo bằng AI.</p>
      </header>

      <section className={styles.toolLibrary} aria-labelledby="studio-library-title">
        <div className={styles.sectionHeadingRow}>
          <div>
            <p className={styles.eyebrow}>THƯ VIỆN</p>
            <h2 id="studio-library-title">Công cụ hiện có</h2>
          </div>
          <span className={styles.libraryCount}>{studioTools.length} công cụ</span>
        </div>

        <div className={styles.studioToolGrid}>
          {studioTools.map((tool) => {
            const canOpenImageTool = tool.category === "image" && tool.status === "available";

            return (
              <button
                aria-label={canOpenImageTool ? "Mở công cụ Tạo ảnh AI" : `${tool.title} chưa sẵn sàng`}
                className={`${styles.studioToolCard} ${canOpenImageTool ? styles.isClickable : ""}`}
                disabled={!canOpenImageTool}
                key={tool.title}
                onClick={() => setActiveTool("image-generator")}
                type="button"
              >
                <div className={styles.toolCardTop}>
                  <ToolIcon name={tool.icon} />
                  <span className={`${styles.toolStatus} ${styles[tool.status]}`}>{statusLabel[tool.status]}</span>
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <div className={styles.toolCardFooter}>
                  <span>{tool.usage}</span>
                  <strong>{tool.status === "comingSoon" ? "Chờ mở" : "Mở công cụ"}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function ImageGeneratorMainBody({ onBack }: { onBack: () => void }) {
  const styleTags = ["Sản phẩm", "Poster", "Social", "Mockup"];

  return (
    <section className={styles.imageToolBody} aria-labelledby="image-tool-title">
      <button className={styles.backButton} onClick={onBack} type="button">
        <ChevronLeftIcon />
        Studio
      </button>

      <header className={styles.imageToolHeader}>
        <div>
          <p className={styles.eyebrow}>TẠO ẢNH AI</p>
          <h1 id="image-tool-title">Tạo ảnh từ prompt</h1>
          <p>Nhập mô tả, chọn phong cách và tạo visual đầu tiên cho chiến dịch của bạn.</p>
        </div>
        <span className={`${styles.toolStatus} ${styles.available}`}>Sẵn sàng</span>
      </header>

      <div className={styles.imageToolLayout}>
        <section className={styles.promptPanel} aria-labelledby="prompt-panel-title">
          <h2 id="prompt-panel-title">Prompt tạo ảnh</h2>
          <label className={styles.promptField}>
            <span>Mô tả hình ảnh</span>
            <textarea
              placeholder="Ví dụ: Ảnh sản phẩm nước hoa đặt trên nền đá cẩm thạch, ánh sáng studio mềm, phong cách cao cấp..."
              rows={7}
            />
          </label>

          <div className={styles.styleRow} aria-label="Phong cách ảnh">
            {styleTags.map((tag, index) => (
              <button className={index === 0 ? styles.activeStyle : ""} key={tag} type="button">
                {tag}
              </button>
            ))}
          </div>

          <div className={styles.settingGrid}>
            <label>
              <span>Tỉ lệ</span>
              <select defaultValue="1:1">
                <option>1:1</option>
                <option>4:5</option>
                <option>16:9</option>
              </select>
            </label>
            <label>
              <span>Số lượng</span>
              <select defaultValue="2 ảnh">
                <option>1 ảnh</option>
                <option>2 ảnh</option>
                <option>4 ảnh</option>
              </select>
            </label>
          </div>

          <button className={styles.generateButton} type="button">
            <SparkSmallIcon />
            Tạo ảnh
          </button>
        </section>

        <section className={styles.imagePreviewPanel} aria-labelledby="preview-panel-title">
          <div className={styles.previewPanelHeader}>
            <h2 id="preview-panel-title">Kết quả xem trước</h2>
            <span>Preview</span>
          </div>
          <div className={styles.emptyPreview}>
            <ToolIcon name="image" />
            <h3>Ảnh sẽ hiển thị tại đây</h3>
            <p>Hoàn thiện prompt và bấm “Tạo ảnh” để xem kết quả mô phỏng.</p>
          </div>
        </section>
      </div>
    </section>
  );
}

function ToolIcon({ name }: { name: StudioTool["icon"] }) {
  const icons = {
    pen: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </>
    ),
    image: (
      <>
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </>
    ),
    video: (
      <>
        <rect height="12" rx="2" width="14" x="3" y="6" />
        <path d="M17 10l4-2v8l-4-2z" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
    calendar: (
      <>
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </>
    ),
    spark: (
      <>
        <path d="M13 2l-2 7-7 2 7 2 2 7 2-7 7-2-7-2-2-7z" />
        <path d="M5 3v4" />
        <path d="M3 5h4" />
      </>
    )
  };

  return <IconShell>{icons[name]}</IconShell>;
}

function IconShell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={compact ? styles.inlineIcon : styles.toolsFeatureIcon}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <IconShell compact>
      <path d="M15 18l-6-6 6-6" />
    </IconShell>
  );
}

function SparkSmallIcon() {
  return (
    <IconShell compact>
      <path d="M13 2l-2 7-7 2 7 2 2 7 2-7 7-2-7-2-2-7z" />
    </IconShell>
  );
}
