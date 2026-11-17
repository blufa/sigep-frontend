import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "danger" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  danger: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  accent: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneClasses[tone])}>
      {label}
    </span>
  );
}
