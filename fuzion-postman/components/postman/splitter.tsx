import type * as React from "react"

type SplitterProps = {
  orientation: "vertical" | "horizontal"
  onPointerDown: (e: React.PointerEvent) => void
  className?: string
}

export function Splitter({ orientation, onPointerDown, className }: SplitterProps) {
  const isVertical = orientation === "vertical"
  return (
    <div
      role="separator"
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      tabIndex={0}
      onPointerDown={onPointerDown}
      className={[
        "flex-none group",
        // size
        isVertical ? "w-1.5 h-full cursor-col-resize" : "h-1.5 w-full cursor-row-resize",
        // visuals (use semantic tokens)
        "bg-muted/50 hover:bg-muted transition-all duration-150",
        // hit area
        isVertical ? "mx-1" : "my-1",
        // Enhanced hover state
        "hover:bg-blue-500/20",
        className || "",
      ].join(" ")}
    >
      {/* Visual indicator for better UX */}
      <div 
        className={[
          "transition-opacity duration-150 opacity-0 group-hover:opacity-100",
          isVertical 
            ? "w-full h-8 bg-blue-500/30 rounded-sm mx-auto mt-2" 
            : "h-full w-8 bg-blue-500/30 rounded-sm my-auto ml-2"
        ].join(" ")}
      />
    </div>
  )
}
