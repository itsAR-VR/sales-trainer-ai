"use client"

import { CopyButton } from "./copy-button"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
  showCopy?: boolean
}

export function CodeBlock({ code, language = "json", className, showCopy = true }: CodeBlockProps) {
  return (
    <div className={cn("relative rounded-lg bg-muted", className)}>
      {showCopy && (
        <div className="absolute right-2 top-2">
          <CopyButton value={code} />
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  )
}
