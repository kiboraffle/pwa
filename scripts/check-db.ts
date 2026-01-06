import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('--- Users ---')
  const users = await prisma.user.findMany({ include: { apps: true } })
  console.log(JSON.stringify(users, null, 2))

  console.log('\n--- Apps ---')
  const apps = await prisma.app.findMany()
  console.log(`Total Apps: ${apps.length}`)
  apps.forEach(app => console.log(`- ${app.name} (${app.id})`))

  console.log('\n--- Subscriptions ---')
  const subs = await prisma.pushSubscription.findMany()
  console.log(`Total Subscriptions: ${subs.length}`)
  subs.forEach(sub => console.log(`- App: ${sub.app_id}, Endpoint: ${sub.endpoint.substring(0, 20)}...`))
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
