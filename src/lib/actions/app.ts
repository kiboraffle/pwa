'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addReview(appId: string, data: { userName: string, rating: number, comment: string }) {
  if (data.rating < 1 || data.rating > 5) throw new Error('Rating must be between 1 dan 5')

  return await prisma.$transaction(async (tx) => {
    const app = await tx.app.findUnique({ where: { id: appId }, select: { averageRating: true, totalReviews: true } })
    if (!app) throw new Error('App not found')

    await tx.review.create({
      data: {
        app_id: appId,
        userName: data.userName,
        rating: data.rating,
        comment: data.comment,
      }
    })

    const newTotal = app.totalReviews + 1
    const newAvg = (app.averageRating * app.totalReviews + data.rating) / newTotal

    await tx.app.update({
      where: { id: appId },
      data: {
        averageRating: newAvg,
        totalReviews: newTotal
      }
    })

    revalidatePath(`/dashboard/app/${appId}`)
    revalidatePath(`/view/${appId}`)
    return { success: true, averageRating: newAvg, totalReviews: newTotal }
  })
}

export async function getRecentReviews(appId: string, limit = 3) {
  return await prisma.review.findMany({
    where: { app_id: appId },
    orderBy: { created_at: 'desc' },
    take: limit
  })
}

export async function deleteApp(appId: string) {
  return await prisma.$transaction(async (tx) => {
    await tx.pushSubscription.deleteMany({ where: { app_id: appId } })
    await tx.review.deleteMany({ where: { app_id: appId } })
    await tx.app.delete({ where: { id: appId } })
    revalidatePath('/dashboard')
    return { success: true }
  })
}

export async function updateCustomDomain(appId: string, domain: string | null) {
  const value = domain?.trim().toLowerCase() || null
  if (value) {
    const exists = await prisma.app.findUnique({ where: { customDomain: value } })
    if (exists && exists.id !== appId) {
      throw new Error('Domain sudah dipakai aplikasi lain')
    }
  }
  await prisma.app.update({
    where: { id: appId },
    data: { customDomain: value }
  })
  revalidatePath(`/dashboard/app/${appId}`)
  return { success: true }
}

export async function updateAppSettings(appId: string, data: { customDomain?: string | null; apkUrl?: string | null }) {
  const domain = data.customDomain?.trim().toLowerCase() || null
  if (domain) {
    if (domain.includes('://') || domain.includes('/')) {
      throw new Error('Format domain tidak valid')
    }
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain)) {
      throw new Error('Format domain tidak valid')
    }
  }
  if (domain) {
    const exists = await prisma.app.findUnique({ where: { customDomain: domain } })
    if (exists && exists.id !== appId) {
      throw new Error('Domain sudah dipakai aplikasi lain')
    }
  }
  await prisma.app.update({
    where: { id: appId },
    data: {
      customDomain: domain,
      apkUrl: data.apkUrl?.trim() || null
    }
  })
  revalidatePath(`/dashboard/app/${appId}`)
  return { success: true }
}
