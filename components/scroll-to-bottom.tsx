"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScrollToBottomProps {
  itemCount: number
}

export default function ScrollToBottom({ itemCount }: ScrollToBottomProps) {
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    })
  }

  if (itemCount <= 10) return null

  return (
    <Button
      onClick={scrollToBottom}
      className="fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-lg z-50"
      size="icon"
      aria-label="Ir para o final"
    >
      <ChevronDown className="h-5 w-5" />
    </Button>
  )
}
