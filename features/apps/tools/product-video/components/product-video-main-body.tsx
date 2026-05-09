"use client";

import { useMemo, useState } from "react";
import { AppsIcon } from "../../../components/apps-icons";
import styles from "./product-video-main-body.module.css";

type UploadSlot = {
  helper: string;
  icon: "pen" | "image" | "file";
  key: string;
  label: string;
  required?: boolean;
};

const uploadSlots: UploadSlot[] = [
  { key: "model", label: "Người mẫu", helper: "Tải ảnh người mẫu hoặc KOL", icon: "pen", required: true },
  { key: "product", label: "Sản phẩm", helper: "Ảnh sản phẩm rõ nền", icon: "file", required: true },
  { key: "scene", label: "Bối cảnh", helper: "Moodboard hoặc bối cảnh", icon: "image" }
];

const steps = [
  "Tải ảnh",
  "Tạo kịch bản",
  "Edit & tạo ảnh",
  "Tạo video"
];

export function ProductVideoMainBody() {
  const [activeStep, setActiveStep] = useState(1);
  const [productName, setProductName] = useState("Giày thể thao sneaker nữ");
  const [description, setDescription] = useState("");
  const [sceneCount, setSceneCount] = useState(5);
  const [ratio, setRatio] = useState("9:16");
  const [language, setLanguage] = useState("vi");
  const [selectedUploads, setSelectedUploads] = useState<string[]>(["model"]);
  const [generated, setGenerated] = useState(false);

  const scriptLines = useMemo(
    () => [
      `Hook: Mở cảnh người mẫu mang ${productName || "sản phẩm"} trong bối cảnh sáng, sạch, có chuyển động gần.`,
      `Giới thiệu: Nhấn vào điểm nổi bật ${description.trim() || "thiết kế nhẹ, dễ phối đồ và phù hợp dùng hằng ngày"}.`,
      `Review: Chia ${sceneCount} cảnh ngắn, mỗi cảnh tập trung một lợi ích để giữ nhịp video nhanh.`,
      `CTA: Kết thúc bằng lời mời xem chi tiết sản phẩm hoặc đặt hàng ngay.`
    ],
    [description, productName, sceneCount]
  );

  function toggleUpload(key: string) {
    setSelectedUploads((items) => (items.includes(key) ? items.filter((item) => item !== key) : [...items, key]));
  }

  function handleGenerate() {
    setGenerated(true);
    setActiveStep(2);
  }

  return (
    <section className={styles.productVideoBody} aria-label="Công cụ làm video product">
      <header className={styles.heroHeader}>
        <p className={styles.eyebrow}>PRODUCT VIDEO</p>
        <h1>Làm video product</h1>
        <p>Tạo kịch bản review sản phẩm, dựng cảnh và chuẩn bị video ngắn theo quy trình AI.</p>
      </header>

      <nav className={styles.stepper} aria-label="Quy trình tạo video product">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          return (
            <button
              className={stepNumber === activeStep ? styles.activeStep : ""}
              key={step}
              onClick={() => setActiveStep(stepNumber)}
              type="button"
            >
              <span>{stepNumber}</span>
              {step}
            </button>
          );
        })}
      </nav>

      <section className={styles.uploadGrid} aria-label="Ảnh đầu vào">
        {uploadSlots.map((slot) => {
          const selected = selectedUploads.includes(slot.key);
          return (
            <button
              className={`${styles.uploadCard} ${selected ? styles.uploadSelected : ""}`}
              key={slot.key}
              onClick={() => toggleUpload(slot.key)}
              type="button"
            >
              <div className={styles.uploadIcon}>
                <AppsIcon name={slot.icon} />
              </div>
              <strong>{selected ? "Đã chọn ảnh" : "Click để tải ảnh"}</strong>
              <p>{slot.helper}</p>
              <span>
                {slot.label}
                {slot.required ? " *" : ""}
              </span>
            </button>
          );
        })}
      </section>

      <div className={styles.workspaceGrid}>
        <section className={styles.panel} aria-labelledby="product-info-title">
          <div className={styles.panelTitle}>
            <AppsIcon name="file" />
            <h2 id="product-info-title">Thông tin sản phẩm</h2>
          </div>

          <label className={styles.fieldGroup}>
            <span>Tên sản phẩm *</span>
            <input onChange={(event) => setProductName(event.target.value)} value={productName} />
          </label>

          <label className={styles.fieldGroup}>
            <span>Nội dung</span>
            <textarea
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mô tả chi tiết về sản phẩm, đặc điểm nổi bật, khách hàng mục tiêu..."
              rows={6}
              value={description}
            />
          </label>

          <div className={styles.quickTips}>
            <span>Gợi ý</span>
            <p>Nêu chất liệu, điểm khác biệt, tình huống sử dụng và cảm xúc muốn truyền tải.</p>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="script-settings-title">
          <div className={styles.panelTitle}>
            <AppsIcon name="spark" />
            <h2 id="script-settings-title">Thiết lập kịch bản</h2>
          </div>

          <div className={styles.optionBlock}>
            <div className={styles.optionHeader}>
              <span>Số cảnh quay</span>
              <strong>{sceneCount}</strong>
            </div>
            <div className={styles.scenePicker}>
              {[3, 4, 5, 6, 7, 8, 9].map((count) => (
                <button className={count === sceneCount ? styles.activeOption : ""} key={count} onClick={() => setSceneCount(count)} type="button">
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionBlock}>
            <span className={styles.optionLabel}>Tỉ lệ video</span>
            <div className={styles.segmentGrid}>
              {["9:16", "16:9"].map((item) => (
                <button className={item === ratio ? styles.activeSegment : ""} key={item} onClick={() => setRatio(item)} type="button">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.optionBlock}>
            <span className={styles.optionLabel}>Ngôn ngữ thoại</span>
            <div className={styles.languageGrid}>
              {[
                ["vi", "VN Việt"],
                ["en", "GB English"],
                ["jp", "JP 日本語"],
                ["kr", "KR 한국어"]
              ].map(([value, label]) => (
                <button className={value === language ? styles.activeOption : ""} key={value} onClick={() => setLanguage(value)} type="button">
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button className={styles.primaryButton} onClick={handleGenerate} type="button">
            Tạo kịch bản product
          </button>
        </section>

        <section className={`${styles.panel} ${styles.outputPanel}`} aria-labelledby="product-output-title">
          <div className={styles.panelTitle}>
            <AppsIcon name="video" />
            <h2 id="product-output-title">Bản dựng đề xuất</h2>
          </div>

          <div className={styles.previewFrame}>
            <div className={ratio === "9:16" ? styles.phoneFrame : styles.wideFrame}>
              <AppsIcon name="video" />
              <span>{ratio}</span>
            </div>
          </div>

          <div className={styles.scriptBox}>
            <span>{generated ? "Kịch bản đã tạo" : "Preview kịch bản"}</span>
            {scriptLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
