'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addReview(appId: string, userName: string, rating: number, comment: string) {
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5')

  return await prisma.$transaction(async (tx) => {
    const app = await tx.app.findUnique({ where: { id: appId }, select: { averageRating: true, totalReviews: true } })
    if (!app) throw new Error('App not found')

    await tx.review.create({
      data: {
        app_id: appId,
        userName,
        rating,
        comment,
      }
    })

    const newTotal = app.totalReviews + 1
    const newAvg = (app.averageRating * app.totalReviews + rating) / newTotal

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

