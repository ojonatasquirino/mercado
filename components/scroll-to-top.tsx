"use client"

import { ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScrollToTopProps {
  itemCount: number
}

export default function ScrollToTop({ itemCount }: ScrollToTopProps) {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  if (itemCount <= 10) return null

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
      size="icon"
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  )
}
