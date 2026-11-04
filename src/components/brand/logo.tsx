import { cn } from "@/lib/utils";

/**
 * StudyAI mark — an original FrenyTech identity.
 *
 * A knowledge peak crossed like an "A", with a floating idea node: the student
 * climbing toward understanding, guided by the AI spark.
 */
export function LogoMark({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="StudyAI logo"
    >
      <defs>
        <linearGradient id="studyai-tile" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-violet)" />
          <stop offset="0.5" stopColor="var(--brand-blue)" />
          <stop offset="1" stopColor="var(--brand-cyan)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="61" height="61" rx="17" fill="url(#studyai-tile)" />
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="17"
        stroke="var(--glass-highlight)"
        strokeWidth="1.5"
      />
      <path
        d="M15 45 L32 21 L49 45"
        stroke="var(--primary-foreground)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M23.5 36.5 H40.5"
        stroke="var(--primary-foreground)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="47" cy="17" r="4.5" fill="var(--primary-foreground)" />
    </svg>
  );
}

export function Logo({
  className,
  size = 34,
  showAttribution = false,
}: {
  className?: string;
  size?: number;
  showAttribution?: boolean;
}) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="inline-flex items-center gap-2.5">
        <LogoMark size={size} />
        <span
          className="font-display font-bold tracking-tight text-foreground"
          style={{ fontSize: size * 0.62 }}
        >
          Study
          <span className="text-gradient">AI</span>
        </span>
      </span>
      {showAttribution ? (
        <span className="mt-1 pl-[46px] text-[11px] font-medium tracking-wide text-muted-foreground">
          An AI Learning Platform by FrenyTech
        </span>
      ) : null}
    </span>
  );
}
