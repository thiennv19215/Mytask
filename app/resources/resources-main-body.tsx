"use client";

import { useEffect, useMemo, useState } from "react";
import { AppsIcon } from "@/features/apps/components/apps-icons";
import { downloadMedia } from "@/features/downloads/download-media";
import { listGenerationResources, type GenerationResourceItem } from "@/features/generation/generation-history";
import { removeGenerationJob, removeGenerationJobs } from "@/features/generation/generation-store";
import { getPreviewImageUrl } from "@/features/uploads/upload-image-url";
import styles from "./resources-main-body.module.css";

type ResourceFilter = "all" | "image" | "video";

function formatDate(value: string | null) {
  if (!value) {
    return "Chua ro";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function getTitle(item: GenerationResourceItem) {
  return item.prompt?.trim() || (item.type === "image" ? "Anh da tao" : "Video da tao");
}

function handleDownload(url: string, fileName: string) {
  void downloadMedia({
    fallbackFileName: "generated-media",
    fileName,
    url
  });
}

export function ResourcesMainBody() {
  const [items, setItems] = useState<GenerationResourceItem[]>([]);
  const [filter, setFilter] = useState<ResourceFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<GenerationResourceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GenerationResourceItem | null>(null);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadResources() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const resources = await listGenerationResources({ limit: 20 });
      setItems(resources);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Khong tai duoc tai nguyen.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadResources();
  }, []);

  async function handleDeleteResource() {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage("");

    try {
      const response = await fetch("/api/resources/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: deleteTarget.id })
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message || "Khong xoa duoc tai nguyen.");
      }

      setItems((currentItems) => currentItems.filter((item) => item.id !== deleteTarget.id));
      removeGenerationJob(deleteTarget.id);
      setSelectedItem((currentItem) => (currentItem?.id === deleteTarget.id ? null : currentItem));
      setDeleteTarget(null);
    } catch (error) {
      setDeleteErrorMessage(error instanceof Error ? error.message : "Khong xoa duoc tai nguyen.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteAllResources() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage("");

    try {
      const response = await fetch("/api/resources/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ deleteAll: true })
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message || "Khong xoa duoc tat ca tai nguyen.");
      }

      setItems([]);
      removeGenerationJobs((job) => ["success", "failed"].includes(String(job.status).toLowerCase()));
      setSelectedItem(null);
      setIsDeleteAllConfirmOpen(false);
    } catch (error) {
      setDeleteErrorMessage(error instanceof Error ? error.message : "Khong xoa duoc tat ca tai nguyen.");
    } finally {
      setIsDeleting(false);
    }
  }

  const stats = useMemo(
    () => ({
      total: items.length,
      images: items.filter((item) => item.type === "image").length,
      videos: items.filter((item) => item.type === "video").length
    }),
    [items]
  );

  const visibleItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = filter === "all" || item.type === filter;
      const matchesQuery =
        !cleanQuery ||
        getTitle(item).toLowerCase().includes(cleanQuery) ||
        String(item.aspectRatio ?? "").toLowerCase().includes(cleanQuery);

      return matchesType && matchesQuery;
    });
  }, [filter, items, query]);

  return (
    <section className={styles.resourcesPage} aria-labelledby="resources-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Tai nguyen</p>
          <h1 id="resources-title">Kho anh & video da tao</h1>
          <p>Lay 20 ket qua thanh cong gan nhat tu Supabase genjob.</p>
        </div>

        <div className={styles.summary} aria-label="Thong ke tai nguyen">
          <article>
            <strong>{stats.total}</strong>
            <span>Tong</span>
          </article>
          <article>
            <strong>{stats.images}</strong>
            <span>Anh</span>
          </article>
          <article>
            <strong>{stats.videos}</strong>
            <span>Video</span>
          </article>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label>
          <span>Tim theo prompt</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhap tu khoa..."
            type="search"
            value={query}
          />
        </label>

        <div className={styles.filters} role="tablist" aria-label="Loc tai nguyen">
          {[
            ["all", "Tat ca"],
            ["image", "Anh"],
            ["video", "Video"]
          ].map(([value, label]) => (
            <button
              aria-selected={filter === value}
              className={filter === value ? styles.activeFilter : ""}
              key={value}
              onClick={() => setFilter(value as ResourceFilter)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <button className={styles.refreshButton} disabled={isLoading} onClick={loadResources} type="button">
          Lam moi
        </button>
      </div>

      <div className={styles.library}>
        <div className={styles.libraryHeader}>
          <div>
            <h2>Gan day</h2>
            <p>Chi hien job success co result_url.</p>
          </div>
          <div className={styles.libraryHeaderActions}>
            <span>{visibleItems.length} item</span>
            <button disabled={isLoading} onClick={() => setIsDeleteAllConfirmOpen(true)} type="button">
              Xoa tat ca
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.stateBox}>Dang tai tai nguyen...</div>
        ) : errorMessage ? (
          <div className={styles.stateBox}>
            <strong>Khong tai duoc du lieu</strong>
            <p>{errorMessage}</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className={styles.stateBox}>
            <strong>Chua co tai nguyen phu hop</strong>
            <p>Tao anh hoac video thanh cong, sau do quay lai muc nay.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {visibleItems.map((item) => (
              <article className={styles.card} key={item.id}>
                <button
                  aria-label={`Xem ${getTitle(item)}`}
                  className={styles.previewButton}
                  onClick={() => setSelectedItem(item)}
                  type="button"
                >
                  <span className={styles.typeBadge}>
                    <AppsIcon compact name={item.type === "image" ? "image" : "video"} />
                    {item.type === "image" ? "Anh" : "Video"}
                  </span>

                  {item.type === "image" ? (
                    <img alt={getTitle(item)} src={getPreviewImageUrl(item.url)} />
                  ) : (
                    <span className={styles.videoPlaceholder}>
                      <AppsIcon name="video" />
                      <span>Video</span>
                    </span>
                  )}
                </button>

                <div className={styles.meta}>
                  <h3>{getTitle(item)}</h3>
                  <p>{formatDate(item.createdAt)}</p>
                </div>

                <div className={styles.actions}>
                  <button onClick={() => setSelectedItem(item)} type="button">
                    Xem
                  </button>
                  <a href={item.url} rel="noreferrer" target="_blank">
                    Mo URL
                  </a>
                  <button
                    aria-label={`Tai ${getTitle(item)}`}
                    onClick={() => handleDownload(item.url, `generated-${item.type}-${item.id}`)}
                    type="button"
                  >
                    <AppsIcon compact name="download" />
                    Tai
                  </button>
                  <button
                    aria-label={`Xoa ${getTitle(item)}`}
                    className={styles.deleteAction}
                    onClick={() => setDeleteTarget(item)}
                    type="button"
                  >
                    Xoa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedItem ? (
        <div className={styles.viewerBackdrop} onClick={() => setSelectedItem(null)} role="presentation">
          <section
            aria-label="Xem tai nguyen"
            aria-modal="true"
            className={styles.viewer}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <div>
                <h2>{getTitle(selectedItem)}</h2>
                <p>{formatDate(selectedItem.createdAt)}</p>
              </div>
              <button aria-label="Dong viewer" onClick={() => setSelectedItem(null)} type="button">
                X
              </button>
            </header>

            <div className={styles.viewerMedia}>
              {selectedItem.type === "image" ? (
                <img alt={getTitle(selectedItem)} src={selectedItem.url} />
              ) : (
                <video autoPlay controls src={selectedItem.url} />
              )}
            </div>

            <footer>
              <a href={selectedItem.url} rel="noreferrer" target="_blank">
                Mo URL
              </a>
              <button onClick={() => handleDownload(selectedItem.url, `generated-${selectedItem.type}-${selectedItem.id}`)} type="button">
                Download
              </button>
              <button className={styles.viewerDeleteButton} onClick={() => setDeleteTarget(selectedItem)} type="button">
                Xoa
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className={styles.viewerBackdrop} onClick={() => setDeleteTarget(null)} role="presentation">
          <section
            aria-label="Xac nhan xoa tai nguyen"
            aria-modal="true"
            className={styles.confirmDialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <p className={styles.confirmEyebrow}>Xac nhan xoa</p>
            <h2>Xoa khoi thu vien?</h2>
            <p>
              Tai nguyen nay se duoc an khoi Resources bang soft delete. File tren R2 khong bi xoa trong buoc nay.
            </p>
            <strong>{getTitle(deleteTarget)}</strong>
            {deleteErrorMessage ? <p className={styles.deleteError}>{deleteErrorMessage}</p> : null}
            <div className={styles.confirmActions}>
              <button disabled={isDeleting} onClick={() => setDeleteTarget(null)} type="button">
                Huy
              </button>
              <button className={styles.confirmDangerButton} disabled={isDeleting} onClick={handleDeleteResource} type="button">
                {isDeleting ? "Dang xoa..." : "Xoa"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isDeleteAllConfirmOpen ? (
        <div className={styles.viewerBackdrop} onClick={() => setIsDeleteAllConfirmOpen(false)} role="presentation">
          <section
            aria-label="Xac nhan xoa tat ca tai nguyen"
            aria-modal="true"
            className={styles.confirmDialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <p className={styles.confirmEyebrow}>Hanh dong nguy hiem</p>
            <h2>Xoa tat ca tai nguyen?</h2>
            <p>
              Tat ca lich su da ket thuc, gom success va failed, se duoc an bang soft delete. Job dang chay khong bi xoa.
            </p>
            <strong>Don lich su tao anh/video da ket thuc</strong>
            {deleteErrorMessage ? <p className={styles.deleteError}>{deleteErrorMessage}</p> : null}
            <div className={styles.confirmActions}>
              <button disabled={isDeleting} onClick={() => setIsDeleteAllConfirmOpen(false)} type="button">
                Huy
              </button>
              <button className={styles.confirmDangerButton} disabled={isDeleting} onClick={handleDeleteAllResources} type="button">
                {isDeleting ? "Dang xoa..." : "Xoa tat ca"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
