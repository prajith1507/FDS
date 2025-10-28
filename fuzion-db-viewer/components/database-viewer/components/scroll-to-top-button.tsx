"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScrollToTopButtonProps {
  containerRef: React.RefObject<HTMLDivElement>
}

export function ScrollToTopButton({ containerRef }: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setIsVisible(container.scrollTop > 300)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [containerRef])

  const scrollToTop = () => {
    const container = containerRef.current
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-8 right-8 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
        isVisible ? "opacity-100 visible" : "opacity-0 invisible",
      )}
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  )
}
