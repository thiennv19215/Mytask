import { placeholderPages } from "../placeholder-pages.data";
import type { PageKey } from "@/shared/types/navigation";
import { AppIcon } from "@/shared/ui/icons";
import styles from "./coming-soon-main-body.module.css";

type PlaceholderPageKey = Exclude<PageKey, "home">;

const chatbotFlows = [
  { title: "Tư vấn bán hàng", tone: "Thân thiện", messages: 12 },
  { title: "Chăm sóc khách hàng", tone: "Chuyên nghiệp", messages: 8 },
  { title: "Thu thập lead", tone: "Ngắn gọn", messages: 6 }
];

const promptTemplates = [
  { title: "Caption ra mắt sản phẩm", category: "Content", uses: "2.4K" },
  { title: "Prompt ảnh sản phẩm cao cấp", category: "Image", uses: "1.8K" },
  { title: "Kịch bản chatbot bán hàng", category: "Chatbot", uses: "980" },
  { title: "Hook quảng cáo 5 biến thể", category: "Ads", uses: "1.2K" },
  { title: "Email chăm sóc khách hàng", category: "CRM", uses: "760" },
  { title: "Mô tả video ngắn", category: "Video", uses: "640" }
];

const pricingPlans = [
  {
    name: "Free",
    price: "0đ",
    description: "Dùng thử công cụ cơ bản và prompt mẫu.",
    features: ["20 lượt tạo/tháng", "Prompt mẫu miễn phí", "Lưu 10 lịch sử"],
    featured: false
  },
  {
    name: "Creator",
    price: "199K",
    description: "Cho creator cần tạo ảnh, video và nội dung thường xuyên.",
    features: ["500 lượt tạo/tháng", "Tạo ảnh/video ưu tiên", "Lưu lịch sử không giới hạn"],
    featured: true
  },
  {
    name: "Team",
    price: "499K",
    description: "Không gian làm việc cho đội nhóm nội dung.",
    features: ["2.000 lượt tạo/tháng", "Chia sẻ template", "Quản lý thành viên"],
    featured: false
  }
];

export function ComingSoonMainBody({ page }: { page: PlaceholderPageKey }) {
  if (page === "chatbotPrompt") {
    return <ChatbotPromptPage />;
  }

  if (page === "promptLibrary") {
    return <PromptLibraryPage />;
  }

  if (page === "pricing") {
    return <PricingPreviewPage />;
  }

  if (page === "about") {
    return <AboutPage />;
  }

  if (page === "resources") {
    return <ResourcesPage />;
  }

  return <DefaultPreviewPage page={page} />;
}

function PageHeader({ page }: { page: PlaceholderPageKey }) {
  const copy = placeholderPages[page];

  return (
    <header className={styles.pageHeader}>
      <p className={styles.eyebrow}>{copy.label}</p>
      <div className={styles.pageTitleRow}>
        <h1>{copy.heading}</h1>
        <span className={styles.statusPill}>Preview</span>
      </div>
      <p>{copy.subtext}</p>
    </header>
  );
}

function ChatbotPromptPage() {
  return (
    <section className={styles.pageBody}>
      <PageHeader page="chatbotPrompt" />

      <div className={styles.chatbotLayout}>
        <aside className={styles.workspacePanel}>
          <div className={styles.panelHeader}>
            <AppIcon name="chat" />
            <strong>Bộ prompt chatbot</strong>
          </div>
          <label className={styles.fieldGroup}>
            <span>Mục tiêu chatbot</span>
            <select defaultValue="sales">
              <option value="sales">Tư vấn bán hàng</option>
              <option value="support">Chăm sóc khách hàng</option>
              <option value="lead">Thu thập lead</option>
            </select>
          </label>
          <label className={styles.fieldGroup}>
            <span>Giọng trả lời</span>
            <select defaultValue="friendly">
              <option value="friendly">Thân thiện</option>
              <option value="expert">Chuyên gia</option>
              <option value="short">Ngắn gọn</option>
            </select>
          </label>
          <label className={styles.fieldGroup}>
            <span>Thông tin nền</span>
            <textarea
              defaultValue="Bạn là trợ lý tư vấn sản phẩm. Hỏi đúng nhu cầu, gợi ý lựa chọn phù hợp và chốt bước tiếp theo."
              rows={7}
            />
          </label>
          <button className={styles.primaryButton} type="button">
            Tạo prompt
          </button>
        </aside>

        <section className={styles.chatPreviewPanel}>
          <div className={styles.chatTopbar}>
            <div>
              <strong>Preview hội thoại</strong>
              <span>Prompt bán hàng</span>
            </div>
            <button type="button">Sao chép prompt</button>
          </div>
          <div className={styles.chatWindow}>
            <div className={styles.botBubble}>Xin chào, bạn đang tìm sản phẩm cho nhu cầu nào?</div>
            <div className={styles.userBubble}>Tôi muốn tạo ảnh quảng cáo sản phẩm mới.</div>
            <div className={styles.botBubble}>
              Mình sẽ hỏi 3 ý chính: sản phẩm, phong cách hình ảnh và kênh đăng. Sau đó mình đề xuất prompt tối ưu.
            </div>
          </div>
        </section>

        <aside className={styles.savedList}>
          <div className={styles.panelHeader}>
            <AppIcon name="doc" />
            <strong>Kịch bản đã lưu</strong>
          </div>
          {chatbotFlows.map((flow) => (
            <article className={styles.savedItem} key={flow.title}>
              <strong>{flow.title}</strong>
              <p>{flow.tone}</p>
              <span>{flow.messages} bước hội thoại</span>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}

function PromptLibraryPage() {
  return (
    <section className={styles.pageBody}>
      <PageHeader page="promptLibrary" />

      <section className={styles.libraryToolbar}>
        <label>
          <span>Tìm prompt</span>
          <input placeholder="Tìm theo mục tiêu, kênh, loại nội dung..." />
        </label>
        <div className={styles.filterChips}>
          <button className={styles.activeChip} type="button">
            Tất cả
          </button>
          <button type="button">Content</button>
          <button type="button">Image</button>
          <button type="button">Chatbot</button>
          <button type="button">Video</button>
        </div>
      </section>

      <section className={styles.featuredPrompt}>
        <div>
          <p className={styles.eyebrow}>GỢI Ý HÔM NAY</p>
          <h2>Bộ prompt ra mắt chiến dịch mới</h2>
          <p>Tạo caption, visual prompt, chatbot script và hook quảng cáo trong một luồng làm việc.</p>
        </div>
        <button className={styles.primaryButton} type="button">
          Dùng template
        </button>
      </section>

      <div className={styles.promptGrid}>
        {promptTemplates.map((template) => (
          <article className={styles.promptCard} key={template.title}>
            <span>{template.category}</span>
            <h3>{template.title}</h3>
            <p>Dùng nhanh template, chỉnh biến số và lưu vào bộ sưu tập riêng.</p>
            <strong>{template.uses} lượt dùng</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function PricingPreviewPage() {
  return (
    <section className={styles.pageBody}>
      <PageHeader page="pricing" />

      <section className={styles.pricingHero}>
        <div>
          <p className={styles.eyebrow}>LINH HOẠT THEO NHU CẦU</p>
          <h2>Chọn gói cho creator hoặc đội nhóm</h2>
          <p>Tất cả gói đều dùng chung hệ sinh thái ứng dụng AI, lịch sử tạo và thư viện prompt.</p>
        </div>
        <div className={styles.billingToggle} aria-label="Chu kỳ thanh toán">
          <button className={styles.activeChip} type="button">
            Tháng
          </button>
          <button type="button">Năm -20%</button>
        </div>
      </section>

      <div className={styles.pricingGrid}>
        {pricingPlans.map((plan) => (
          <article className={`${styles.priceCard} ${plan.featured ? styles.featuredPlan : ""}`} key={plan.name}>
            <span>{plan.featured ? "Phổ biến" : "Gói"}</span>
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className={styles.priceValue}>
              {plan.price}
              <small>/tháng</small>
            </div>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button className={plan.featured ? styles.primaryButton : styles.secondaryButton} type="button">
              {plan.featured ? "Dùng gói này" : "Xem chi tiết"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutPage() {
  const values = [
    {
      title: "Một không gian thống nhất",
      description: "Tập trung tạo ảnh, video, prompt, chatbot và lịch sử làm việc trong cùng một bộ công cụ."
    },
    {
      title: "Thiết kế cho creator",
      description: "Ưu tiên thao tác nhanh, preview rõ ràng và những mẫu prompt có thể dùng lại trong nhiều chiến dịch."
    },
    {
      title: "Sẵn sàng mở rộng",
      description: "Các màn hình được tách theo công cụ riêng để sau này kết nối API, template và backend mà không phải đổi lại khung ứng dụng."
    }
  ];

  return (
    <section className={styles.pageBody}>
      <PageHeader page="about" />

      <section className={styles.aboutHero} aria-label="Tổng quan nền tảng">
        <div>
          <p className={styles.eyebrow}>AI WORKSPACE</p>
          <h2>Xây dựng quy trình sáng tạo nội dung gọn hơn</h2>
          <p>
            AI APPS gom các công cụ tác nghiệp hằng ngày: lên ý tưởng, viết prompt, tạo visual, mô phỏng video và quản lý
            lịch sử kết quả. Giao diện giữ màu sáng, dễ quét nhanh và phù hợp với công việc lặp lại.
          </p>
        </div>
        <div className={styles.aboutMetricGrid} aria-label="Chỉ số sản phẩm">
          <article>
            <strong>5+</strong>
            <span>nhóm công cụ</span>
          </article>
          <article>
            <strong>3</strong>
            <span>workflow chính</span>
          </article>
          <article>
            <strong>1</strong>
            <span>không gian chung</span>
          </article>
        </div>
      </section>

      <div className={styles.aboutGrid}>
        {values.map((value) => (
          <article className={styles.aboutCard} key={value.title}>
            <h3>{value.title}</h3>
            <p>{value.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResourcesPage() {
  const mediaItems = [
    { title: "Ảnh sản phẩm serum", type: "image", tool: "Tạo ảnh AI", createdAt: "Hôm nay, 09:42", size: "2.4 MB", ratio: "1:1" },
    { title: "Video giới thiệu giày", type: "video", tool: "Làm video product", createdAt: "Hôm qua, 18:10", size: "48 MB", ratio: "9:16" },
    { title: "Ảnh banner mỹ phẩm", type: "image", tool: "Tạo ảnh AI", createdAt: "07/05/2026", size: "3.1 MB", ratio: "16:9" },
    { title: "Video review túi xách", type: "video", tool: "Tạo video AI", createdAt: "06/05/2026", size: "36 MB", ratio: "4:5" },
    { title: "Ảnh mockup đồng hồ", type: "image", tool: "Tạo ảnh AI", createdAt: "05/05/2026", size: "1.8 MB", ratio: "3:4" },
    { title: "Video launch sản phẩm", type: "video", tool: "Làm video product", createdAt: "04/05/2026", size: "52 MB", ratio: "16:9" }
  ];
  const imageCount = mediaItems.filter((item) => item.type === "image").length;
  const videoCount = mediaItems.filter((item) => item.type === "video").length;

  return (
    <section className={styles.resourcesPage} aria-labelledby="resources-title">
      <header className={styles.resourcesHeader}>
        <div>
          <p className={styles.eyebrow}>TÀI NGUYÊN</p>
          <h1 id="resources-title">Kho ảnh & video đã tạo</h1>
          <p>Lưu trữ toàn bộ media được tạo từ các công cụ AI trong hệ thống, giúp bạn xem lại, tải xuống và tái sử dụng nhanh.</p>
        </div>
        <div className={styles.storageSummary} aria-label="Tổng quan kho lưu trữ">
          <article>
            <strong>{mediaItems.length}</strong>
            <span>Tệp đã tạo</span>
          </article>
          <article>
            <strong>{imageCount}</strong>
            <span>Ảnh</span>
          </article>
          <article>
            <strong>{videoCount}</strong>
            <span>Video</span>
          </article>
        </div>
      </header>

      <section className={styles.mediaToolbar} aria-label="Bộ lọc tài nguyên">
        <label>
          <span>Tìm kiếm media</span>
          <input placeholder="Tìm theo tên file, công cụ tạo, tỷ lệ khung..." />
        </label>
        <div className={styles.mediaFilters} aria-label="Lọc theo loại tệp">
          <button className={styles.activeChip} type="button">Tất cả</button>
          <button type="button">Ảnh</button>
          <button type="button">Video</button>
        </div>
        <button className={styles.primaryButton} type="button">Tải lên</button>
      </section>

      <div className={styles.resourcesLayout}>
        <section className={styles.mediaLibrary} aria-label="Danh sách ảnh và video">
          <div className={styles.libraryHeader}>
            <div>
              <h2>Gần đây</h2>
              <p>Sắp xếp theo thời gian tạo mới nhất.</p>
            </div>
            <button className={styles.secondaryButton} type="button">Chọn nhiều</button>
          </div>

          <div className={styles.mediaGrid}>
            {mediaItems.map((item) => (
              <article className={styles.mediaCard} key={item.title}>
                <div className={`${styles.mediaPreview} ${item.type === "video" ? styles.videoAsset : styles.imageAsset}`}>
                  <div className={styles.previewPattern} />
                  {item.type === "video" ? <span className={styles.playBadge}>Play</span> : null}
                  <span className={styles.assetType}>{item.type === "video" ? "Video" : "Ảnh"}</span>
                </div>
                <div className={styles.mediaMeta}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.tool}</p>
                  </div>
                  <button aria-label={`Mở menu ${item.title}`} type="button">...</button>
                </div>
                <dl className={styles.mediaDetails}>
                  <div>
                    <dt>Ngày tạo</dt>
                    <dd>{item.createdAt}</dd>
                  </div>
                  <div>
                    <dt>Dung lượng</dt>
                    <dd>{item.size}</dd>
                  </div>
                  <div>
                    <dt>Tỷ lệ</dt>
                    <dd>{item.ratio}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function DefaultPreviewPage({ page }: { page: PlaceholderPageKey }) {
  const copy = placeholderPages[page];

  return (
    <section className={styles.pageBody}>
      <PageHeader page={page} />
      <div className={styles.promptGrid}>
        {copy.cards.map((card) => (
          <article className={styles.promptCard} key={card.title}>
            <span>Sắp ra mắt</span>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
