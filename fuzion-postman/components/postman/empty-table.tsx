"use client"

import { cn } from "@/lib/utils"

export function EmptyTable({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cn("p-4", className)}>
      <div className="rounded border bg-card">
        <div className="border-b px-3 py-2 text-sm font-medium text-foreground/85">{title}</div>
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-foreground/80">{subtitle || "Nothing here yet"}</p>
        </div>
      </div>
    </div>
  )
}
