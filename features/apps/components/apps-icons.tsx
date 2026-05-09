export type AppsIconName = "pen" | "image" | "video" | "file" | "calendar" | "spark" | "download";

type AppsIconProps = {
  className?: string;
  compact?: boolean;
  name: AppsIconName;
};

export function AppsIcon({ className, compact = false, name }: AppsIconProps) {
  const icons: Record<AppsIconName, React.ReactNode> = {
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
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </>
    )
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={compact ? "2.2" : "2"}
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
}
