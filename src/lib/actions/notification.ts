'use server'

import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const vapidPrivate = process.env.VAPID_PRIVATE_KEY!
const vapidSubject = 'mailto:admin@roibest.com'

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)
}

type NotificationData = {
  appId?: string | 'ALL'
  title: string
  body: string
  icon?: string
  image?: string
}

export async function sendNotification(data: NotificationData) {
  const { appId, title, body, icon, image } = data

  let subscribers
  let openUrl = '/'
  
  console.log(`Sending notification. AppID: ${appId || 'ALL'}`)

  if (appId && appId !== 'ALL') {
    const app = await prisma.app.findUnique({ where: { id: appId } })
    subscribers = await prisma.pushSubscription.findMany({ where: { app_id: appId } })
    openUrl = app?.target_url || '/'
    console.log(`Found ${subscribers.length} subscribers for app ${appId}`)
  } else {
    // If sending to ALL, we might want to group by endpoint to avoid duplicate sends to same device
    // But for now, let's just fetch all.
    subscribers = await prisma.pushSubscription.findMany()
    console.log(`Found ${subscribers.length} total subscribers (ALL)`)
  }

  const payload = JSON.stringify({
    title,
    body,
    url: openUrl,
    icon: icon || '/icon.png',
    image: image || undefined
  })

  let successCount = 0
  let failCount = 0

  const promises = subscribers.map(sub => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.keys_auth,
        p256dh: sub.keys_p256dh
      }
    }
    return webpush.sendNotification(pushSubscription, payload)
      .then(() => successCount++)
      .catch(async (err) => {
        failCount++
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
      })
  })

  await Promise.all(promises)
  return { success: true, successCount, failCount }
}
