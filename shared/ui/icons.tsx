import type { IconName } from "../types/navigation";

export function AppIcon({ name }: { name: IconName }) {
  const icons: Record<IconName, React.ReactNode> = {
    home: <HomeIcon />,
    card: <CardIcon />,
    chat: <ChatIcon />,
    doc: <DocIcon />,
    wallet: <WalletIcon />,
    info: <InfoIcon />,
    star: <StarIcon />,
    spark: <SparkIcon />
  };

  return icons[name];
}

export function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20"
    >
      {children}
    </svg>
  );
}

export function StarIcon() {
  return (
    <IconBase>
      <path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3z" />
    </IconBase>
  );
}

export function SparkIcon() {
  return (
    <IconBase>
      <path d="M13 2l-2 7-7 2 7 2 2 7 2-7 7-2-7-2-2-7z" />
      <path d="M5 3v4" />
      <path d="M3 5h4" />
    </IconBase>
  );
}

export function HomeIcon() {
  return (
    <IconBase>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </IconBase>
  );
}

export function CardIcon() {
  return (
    <IconBase>
      <rect height="14" rx="2" width="16" x="4" y="5" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </IconBase>
  );
}

export function ChatIcon() {
  return (
    <IconBase>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </IconBase>
  );
}

export function DocIcon() {
  return (
    <IconBase>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </IconBase>
  );
}

export function InfoIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </IconBase>
  );
}

export function WalletIcon() {
  return (
    <IconBase>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H7" />
      <path d="M16 13h.01" />
    </IconBase>
  );
}

export function ArrowRightIcon() {
  return (
    <IconBase>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </IconBase>
  );
}

export function ChevronLeftIcon() {
  return (
    <IconBase>
      <path d="M15 18l-6-6 6-6" />
    </IconBase>
  );
}
