'use server'

import { prisma } from '@/lib/prisma'
import webpush from 'web-push'
import { revalidatePath } from 'next/cache'

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
  subject: 'mailto:admin@roibest.com'
}

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  )
}

export async function createApp(formData: FormData) {
  const name = formData.get('name') as string
  const target_url = formData.get('target_url') as string
  const logoUrl = formData.get('logoUrl') as string
  const themeColor = formData.get('themeColor') as string
  const description = formData.get('description') as string
  const screenshotsRaw = formData.get('screenshots') as string
  
  let screenshots: string[] = []
  try {
    if (screenshotsRaw) {
        screenshots = JSON.parse(screenshotsRaw)
    }
  } catch (e) {
    console.error("Error parsing screenshots", e)
    screenshots = []
  }
  
  let user = await prisma.user.findFirst()
  if (!user) {
    try {
        user = await prisma.user.create({
            data: {
                email: 'demo@example.com',
                password_hash: 'dummy',
            }
        })
    } catch {
        // If user exists but findFirst failed or race condition
        user = await prisma.user.findFirst()
    }
  }

  if (!user) throw new Error("Could not find or create user")

  const app = await prisma.app.create({
    data: {
      name,
      target_url,
      logoUrl,
      themeColor,
      description,
      screenshots,
      user_id: user.id
    }
  })

  try {
    // Dummy reviews to enrich initial UI
    const samples = [
      { userName: 'Andi', rating: 5, comment: 'Aplikasinya mantap dan sangat cepat!' },
      { userName: 'Budi', rating: 4, comment: 'Fungsional, tapi bisa ditingkatkan di UI.' },
      { userName: 'Citra', rating: 5, comment: 'Sangat membantu pekerjaan saya.' }
    ]
    for (const s of samples) {
      const appBefore = await prisma.app.findUnique({ where: { id: app.id }, select: { averageRating: true, totalReviews: true } })
      if (!appBefore) break
      const newTotal = appBefore.totalReviews + 1
      const newAvg = (appBefore.averageRating * appBefore.totalReviews + s.rating) / newTotal
      await prisma.review.create({ data: { app_id: app.id, userName: s.userName, rating: s.rating, comment: s.comment } })
      await prisma.app.update({ where: { id: app.id }, data: { averageRating: newAvg, totalReviews: newTotal } })
    }
  } catch (e) {
    console.error('Failed to seed dummy reviews', e)
  }

  revalidatePath('/dashboard')
  return { success: true, app }
}

export async function getApps() {
    const user = await prisma.user.findFirst()
    if (!user) return []
    return await prisma.app.findMany({ 
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
    })
}

export async function getApp(appId: string) {
    return await prisma.app.findUnique({ where: { id: appId } })
}

export async function savePushSubscription(appId: string, subscription: { endpoint: string, keys: { auth: string, p256dh: string } }) {
  try {
      await prisma.pushSubscription.create({
        data: {
            app_id: appId,
            endpoint: subscription.endpoint,
            keys_auth: subscription.keys.auth,
            keys_p256dh: subscription.keys.p256dh
        }
      })
      return { success: true }
  } catch (e) {
      console.error("Error saving subscription", e)
      return { success: false, error: String(e) }
  }
}

export async function sendPushNotification(appId: string, title: string, body: string, url: string) {
    const subscribers = await prisma.pushSubscription.findMany({ where: { app_id: appId } })
    
    const notificationPayload = JSON.stringify({
        title,
        body,
        url,
        icon: '/icon.png'
    })

    let successCount = 0;
    let failCount = 0;

    const promises = subscribers.map(sub => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                auth: sub.keys_auth,
                p256dh: sub.keys_p256dh
            }
        }
        return webpush.sendNotification(pushSubscription, notificationPayload)
            .then(() => successCount++)
            .catch((err) => {
                console.error("Error sending push", err)
                failCount++
                if (err.statusCode === 410) {
                    // Subscription expired, delete it
                    return prisma.pushSubscription.delete({ where: { id: sub.id } })
                }
            })
    })

    await Promise.all(promises)
    return { success: true, successCount, failCount }
}
