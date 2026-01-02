import { prisma } from "@/src/lib/prisma"

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48)
}

export async function createUniqueOrgSlug(name: string) {
  const base = slugify(name) || "org"
  let slug = base
  for (let i = 0; i < 25; i++) {
    const exists = await prisma.organization.findUnique({ where: { slug }, select: { id: true } })
    if (!exists) return slug
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }
  return `${base}-${Date.now().toString(36)}`
}

