"use client"

import { Card } from "@/components/ui/card"

interface QualityWidgetProps {
  quality: {
    valid: number
    invalid: number
    missing: number
  }
}

export function QualityWidget({ quality }: QualityWidgetProps) {
  const total = quality.valid + quality.invalid + quality.missing
  const validPercent = Math.round((quality.valid / total) * 100)
  const invalidPercent = Math.round((quality.invalid / total) * 100)
  const missingPercent = Math.round((quality.missing / total) * 100)

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Data Quality</h3>
      <div className="space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Valid</span>
            <span className="font-medium text-green-600">{validPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-green-500" style={{ width: `${validPercent}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Invalid</span>
            <span className="font-medium text-red-600">{invalidPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-red-500" style={{ width: `${invalidPercent}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Missing</span>
            <span className="font-medium text-yellow-600">{missingPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-yellow-500" style={{ width: `${missingPercent}%` }} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded bg-green-50 dark:bg-green-950/20 p-2">
            <div className="font-semibold text-green-700">{quality.valid}</div>
            <div className="text-muted-foreground">Valid</div>
          </div>
          <div className="rounded bg-red-50 dark:bg-red-950/20 p-2">
            <div className="font-semibold text-red-700">{quality.invalid}</div>
            <div className="text-muted-foreground">Invalid</div>
          </div>
          <div className="rounded bg-yellow-50 dark:bg-yellow-950/20 p-2">
            <div className="font-semibold text-yellow-700">{quality.missing}</div>
            <div className="text-muted-foreground">Missing</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
