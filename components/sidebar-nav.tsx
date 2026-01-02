"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Phone,
  Users,
  Layers,
  Plug,
  Settings,
  Shield,
  Radio,
  FileText,
  Palette,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useOrgCapabilities } from "@/hooks/use-org-capabilities"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isV2?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Calls", href: "/app/calls", icon: Phone },
      { label: "Clients", href: "/app/clients", icon: Users },
      { label: "Frameworks", href: "/app/frameworks", icon: Layers },
    ],
  },
  {
    label: "Integrations",
    items: [{ label: "Integrations", href: "/app/integrations", icon: Plug }],
  },
  {
    label: "V2 Features",
    items: [
      { label: "Live Coach", href: "/app/live-coach", icon: Radio, isV2: true },
      { label: "Content Studio", href: "/app/content-studio", icon: FileText, isV2: true },
      { label: "White Label", href: "/app/white-label", icon: Palette, isV2: true },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Settings", href: "/app/settings", icon: Settings },
      { label: "Admin", href: "/app/admin", icon: Shield },
    ],
  },
]

function NavContent({ collapsed, onItemClick }: { collapsed: boolean; onItemClick?: () => void }) {
  const pathname = usePathname()
  const { isV2Enabled } = useOrgCapabilities()

  return (
    <ScrollArea className="flex-1 py-4">
      <div className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
            )}
            <nav className="space-y-1 px-2">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                const isLocked =
                  item.isV2 &&
                  !isV2Enabled(
                    item.label === "Live Coach"
                      ? "liveCoach"
                      : item.label === "Content Studio"
                        ? "contentStudio"
                        : "whiteLabel",
                  )

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      collapsed && "justify-center",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {isLocked && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                            V2
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

export function SidebarNav() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-50 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/app" className="flex items-center gap-2 font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  M
                </div>
                <span>MaxOut.ai</span>
              </Link>
            </div>
            <NavContent collapsed={false} onItemClick={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/app" className={cn("flex items-center gap-2 font-semibold", collapsed && "justify-center")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              M
            </div>
            {!collapsed && <span>MaxOut.ai</span>}
          </Link>
        </div>

        <NavContent collapsed={collapsed} />

        {/* Collapse Button */}
        <div className="border-t p-2">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="w-full">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
