"use client"

import { cn } from "@/lib/utils"

export function BodyModeChip({
  label,
  active,
  onClick,
  className,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-3 text-xs font-medium transition-colors",
        active ? "bg-pm-brand text-pm-on-brand" : "border bg-card hover:bg-muted/60 text-foreground/80",
        className,
      )}
    >
      {label}
    </button>
  )
}
