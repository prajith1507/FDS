"use client"

import { cn } from "@/lib/utils"
import { Boxes, BookText, Clock, Globe, Settings } from "lucide-react"
import { useState } from "react"

const items = [
  { id: "home", icon: Boxes, label: "Home" },
  { id: "collections", icon: BookText, label: "Collections" },
  { id: "apis", icon: Globe, label: "APIs" },
  { id: "history", icon: Clock, label: "History" },
  { id: "settings", icon: Settings, label: "Settings" },
]

export function PrimarySidebar() {
  const [active, setActive] = useState("collections")

  return (
    <nav
      aria-label="Primary"
      className="bg-pm-surface border-r flex h-full w-14 flex-col items-center justify-between py-2"
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className="mt-1 mb-2 h-8 w-8 rounded bg-pm-brand text-pm-on-brand grid place-items-center text-xs font-bold"
          aria-label="App"
        >
          PM
        </div>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon
            const selected = active === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "group relative flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-pm-surface-2 hover:text-foreground",
                    selected && "bg-pm-surface-2 text-foreground",
                  )}
                  aria-current={selected ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                  {selected && <span aria-hidden className="absolute right-[-1px] h-5 w-[3px] rounded-l bg-pm-brand" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          className="text-[10px] text-foreground/60 hover:text-foreground/80"
          aria-label="Account"
          title="Account"
        >
          ⦿
        </button>
      </div>
    </nav>
  )
}
