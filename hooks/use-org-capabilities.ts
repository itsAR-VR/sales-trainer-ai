"use client"

import { useState, useEffect } from "react"
import type { OrgCapabilities } from "@/lib/types"
import { getOrgCapabilities } from "@/lib/api"
import { defaultCapabilities } from "@/lib/org-capabilities"

export function useOrgCapabilities() {
  const [capabilities, setCapabilities] = useState<OrgCapabilities>(defaultCapabilities)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getOrgCapabilities()
      .then(setCapabilities)
      .finally(() => setIsLoading(false))
  }, [])

  return {
    capabilities,
    isLoading,
    isV1Enabled: (feature: keyof OrgCapabilities["v1Features"]) => capabilities.v1Features[feature],
    isV2Enabled: (feature: keyof OrgCapabilities["v2Features"]) => capabilities.v2Features[feature],
  }
}
