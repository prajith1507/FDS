"use client"

import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, Table } from "lucide-react"

interface CollectionSelectorProps {
  collections: string[]
  selectedCollection: string
  onCollectionChange: (collection: string) => void
  isLoading?: boolean
  total?: number
}

export function CollectionSelector({
  collections,
  selectedCollection,
  onCollectionChange,
  isLoading = false,
  total
}: CollectionSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Table className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Collection:</span>
        <Select value={selectedCollection} onValueChange={onCollectionChange} disabled={isLoading}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Select collection" />
          </SelectTrigger>
          <SelectContent>
            {collections.map((collection) => (
              <SelectItem key={collection} value={collection}>
                {collection}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCollection && total !== undefined && (
        <Badge variant="secondary" className="h-6 text-xs">
          {total.toLocaleString()} docs
        </Badge>
      )}
    </div>
  )
}
