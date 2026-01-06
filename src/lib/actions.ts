'use server'

import { prisma } from '@/lib/prisma'
import webpush from 'web-push'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

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
  const apkUrl = formData.get('apkUrl') as string
  const screenshotsRaw = formData.get('screenshots') as string
  const initialReviewsRaw = formData.get('initial_reviews') as string
  
  let screenshots: string[] = []
  try {
    if (screenshotsRaw) {
        screenshots = JSON.parse(screenshotsRaw)
    }
  } catch (e) {
    console.error("Error parsing screenshots", e)
    screenshots = []
  }
  
  let initialReviews: { userName: string; rating: number; comment: string }[] = []
  try {
    if (initialReviewsRaw) {
      initialReviews = JSON.parse(initialReviewsRaw)
    }
  } catch (e) {
    console.error("Error parsing initial reviews", e)
    initialReviews = []
  }
  
  const supabase = await createSupabaseServerClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  console.log('Session User:', sessionUser)
  if (!sessionUser) {
    throw new Error('No Supabase session: user not logged in')
  }
  if (!sessionUser.email) {
    throw new Error('Supabase user missing email')
  }
  let user = await prisma.user.findUnique({ where: { email: sessionUser.email } })
  if (!user) {
    user = await prisma.user.create({
      data: { email: sessionUser.email, password_hash: 'supabase' }
    })
  }

  const app = await prisma.app.create({
    data: {
      name,
      target_url,
      logoUrl,
      themeColor,
      description,
      apkUrl,
      screenshots,
      userId: user.id
    }
  })

  try {
    if (initialReviews.length > 0) {
      const clamped = initialReviews.map(r => ({
        userName: r.userName,
        rating: Math.max(1, Math.min(5, Number(r.rating) || 0)),
        comment: r.comment
      }))
      const total = clamped.reduce((sum, r) => sum + r.rating, 0)
      for (const r of clamped) {
        await prisma.review.create({ data: { app_id: app.id, userName: r.userName, rating: r.rating, comment: r.comment } })
      }
      await prisma.app.update({
        where: { id: app.id },
        data: { averageRating: total / clamped.length, totalReviews: clamped.length }
      })
    } else {
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
    }
  } catch (e) {
    console.error('Failed to save initial reviews', e)
  }

  revalidatePath('/dashboard')
  return { success: true, app }
}

export async function getApps() {
    const supabase = await createSupabaseServerClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    if (!sessionUser?.email) return []
    const user = await prisma.user.findUnique({ where: { email: sessionUser.email } })
    if (!user) return []
    return await prisma.app.findMany({ 
        where: { userId: user.id },
        orderBy: { created_at: 'desc' }
    })
}

export async function getApp(appId: string) {
    return await prisma.app.findUnique({ where: { id: appId } })
}

export async function savePushSubscription(appId: string, subscription: { endpoint: string, keys: { auth: string, p256dh: string } }) {
  if (!appId) {
      console.error('AppId is missing')
      return { success: false, error: 'AppId is missing' }
  }
  try {
      // Check for existing subscription to prevent duplicates
      const existing = await prisma.pushSubscription.findFirst({
          where: {
              app_id: appId,
              endpoint: subscription.endpoint
          }
      })

      if (existing) {
          console.log('Subscription already exists, updating keys if changed')
          // Optionally update keys if they changed
          await prisma.pushSubscription.update({
              where: { id: existing.id },
              data: {
                  keys_auth: subscription.keys.auth,
                  keys_p256dh: subscription.keys.p256dh
              }
          })
          return { success: true }
      }

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

export async function subscribeUser(appId: string, subscription: { endpoint: string, keys: { auth: string, p256dh: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  console.log('subscribeUser session:', sessionUser?.email || 'anonymous', 'for app:', appId)
  console.log('Data yang diterima di server:', subscription)
  return await savePushSubscription(appId, subscription)
}

function logDebug(message: string) {
    console.log(`[DEBUG] ${message}`)
}

export async function subscribeUserToAllApps(subscription: { endpoint: string, keys: { auth: string, p256dh: string } }) {
  logDebug('subscribeUserToAllApps called')
  const supabase = await createSupabaseServerClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  
  if (!sessionUser?.email) {
      logDebug('subscribeUserToAllApps: No session user found')
      console.log('subscribeUserToAllApps: No session user found')
      return { success: false, error: 'Not authenticated' }
  }
  
  logDebug(`User authenticated: ${sessionUser.email}`)
  
  const user = await prisma.user.findUnique({ where: { email: sessionUser.email } })
  if (!user) {
      logDebug('User not found in Prisma DB')
      return { success: false, error: 'User not found' }
  }

  const apps = await prisma.app.findMany({ where: { userId: user.id } })
  logDebug(`Found ${apps.length} apps for user ${user.id}`)
  console.log(`Subscribing user ${sessionUser.email} to all ${apps.length} apps`)

  for (const app of apps) {
      logDebug(`Saving subscription for app ${app.name} (${app.id})`)
      const result = await savePushSubscription(app.id, subscription)
      logDebug(`Save result: ${JSON.stringify(result)}`)
  }
  return { success: true, count: apps.length }
}

export async function sendPushNotification(appId: string, title: string, body: string, url: string) {
    console.log('Mencari subscription untuk App ID:', appId)
    const subscribers = await prisma.pushSubscription.findMany({ where: { app_id: appId } })
    console.log('Jumlah subscription yang ditemukan di DB:', subscribers.length)
    
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
