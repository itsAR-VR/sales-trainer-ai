import { prisma } from "../src/lib/prisma"
import { ensureOrgFrameworkTemplates } from "../src/lib/frameworks/templateCatalog"

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true } })
  for (const org of orgs) {
    await ensureOrgFrameworkTemplates(prisma, org.id)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
