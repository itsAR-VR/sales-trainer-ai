import type { OrgCapabilities } from "./types"

// Default capabilities - can be overridden via context/props
export const defaultCapabilities: OrgCapabilities = {
  v1Features: {
    callLibrary: true,
    frameworks: true,
    integrations: true,
    embeds: true,
  },
  v2Features: {
    liveCoach: false,
    contentStudio: false,
    whiteLabel: false,
  },
  limits: {
    maxCalls: 1000,
    maxFrameworks: 20,
    maxApiKeys: 10,
    maxWebhooks: 5,
  },
}

export function isV2FeatureEnabled(
  capabilities: OrgCapabilities,
  feature: keyof OrgCapabilities["v2Features"],
): boolean {
  return capabilities.v2Features[feature]
}

export function isV1FeatureEnabled(
  capabilities: OrgCapabilities,
  feature: keyof OrgCapabilities["v1Features"],
): boolean {
  return capabilities.v1Features[feature]
}
