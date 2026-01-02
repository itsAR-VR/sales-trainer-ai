"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Phone, Users, Layers, Settings, Search, Plug } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"

const quickLinks = [
  { label: "Calls", href: "/app/calls", icon: Phone, group: "Navigation" },
  { label: "Clients", href: "/app/clients", icon: Users, group: "Navigation" },
  { label: "Frameworks", href: "/app/frameworks", icon: Layers, group: "Navigation" },
  { label: "Integrations", href: "/app/integrations", icon: Plug, group: "Navigation" },
  { label: "Settings", href: "/app/settings", icon: Settings, group: "Settings" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 bg-transparent"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {quickLinks
              .filter((l) => l.group === "Navigation")
              .map((link) => (
                <CommandItem key={link.href} onSelect={() => handleSelect(link.href)}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            {quickLinks
              .filter((l) => l.group === "Settings")
              .map((link) => (
                <CommandItem key={link.href} onSelect={() => handleSelect(link.href)}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
