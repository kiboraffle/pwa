/* eslint-disable @next/next/no-img-element */
import { getApp, sendPushNotification } from '@/lib/actions'
import { getRecentReviews } from '@/lib/actions/app'
import { notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AppDetailPage({ params }: { params: { id: string } }) {
  const app = await getApp(params.id)
  const reviews = await getRecentReviews(params.id, 3)
  
  if (!app) {
    notFound()
  }

  async function handleSendPush(formData: FormData) {
      'use server'
      const title = formData.get('title') as string
      const body = formData.get('body') as string
      const url = formData.get('url') as string
      
      await sendPushNotification(app!.id, title, body, url)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">{app.name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < Math.round(app.averageRating || 0)
              return <Star key={i} className={`w-4 h-4 ${filled ? 'text-yellow-500' : 'text-slate-300'}`} />
            })}
          </div>
          <span className="text-sm text-slate-600">{(app.averageRating || 0).toFixed(1)} • {app.totalReviews} reviews</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Send Push Notification</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSendPush} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" required placeholder="Hello World" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body">Body</Label>
                        <Textarea id="body" name="body" required placeholder="This is a notification" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="url">Target URL (Optional)</Label>
                        <Input id="url" name="url" defaultValue={app.target_url} />
                    </div>
                    <Button type="submit">Send Notification</Button>
                </form>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>App Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><strong>Target URL:</strong> {app.target_url}</p>
                <p><strong>Public Page:</strong> <a href={`/view/${app.id}`} className="text-blue-500 hover:underline" target="_blank">/view/{app.id}</a></p>
                <p><strong>Theme Color:</strong> <span style={{ color: app.themeColor || '#000' }}>{app.themeColor}</span></p>
                <p><strong>Description:</strong> {app.description}</p>
                {app.logoUrl && (
                    <div className="mt-2">
                        <p className="font-bold mb-1">Logo:</p>
                        <img src={app.logoUrl} alt="App Icon" className="w-16 h-16 rounded shadow" />
                    </div>
                )}
                {app.screenshots && app.screenshots.length > 0 && (
                    <div className="mt-2">
                        <p className="font-bold mb-1">Screenshots:</p>
                        <div className="flex gap-2 overflow-x-auto">
                            {app.screenshots.map((s, i) => (
                                <img key={i} src={s} alt="Screenshot" className="h-20 rounded shadow" />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.length === 0 && (
              <p className="text-sm text-slate-500">Belum ada review.</p>
            )}
            {reviews.map((rev) => (
              <div key={rev.id} className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{rev.userName}</span>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const filled = i < rev.rating
                      return <Star key={i} className={`w-3 h-3 ${filled ? 'text-yellow-500' : 'text-slate-300'}`} />
                    })}
                  </div>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{rev.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
