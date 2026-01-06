import { getApps } from '@/lib/actions'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { CreateAppDialog } from '@/components/create-app-dialog'
import { Trash } from 'lucide-react'
import { DeleteAppButton } from '@/components/delete-app-button'
import { PushNotificationDialog } from '@/components/push-notification-dialog'
import { Settings } from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'
import { SubscribeDebug } from '@/components/subscribe-debug'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const apps = await getApps()

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Apps</h1>
        <div className="flex gap-2 items-center">
          <LogoutButton />
          <CreateAppDialog />
          <PushNotificationDialog apps={apps.map(a => ({ id: a.id, name: a.name }))} />
        </div>
      </div>

      <SubscribeDebug />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 bg-slate-100"
                  style={
                    app.logoUrl
                      ? { backgroundImage: `url(${app.logoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : undefined
                  }
                />
                <div>
                  <CardTitle className="text-base">{app.name}</CardTitle>
                  <p className="text-xs text-slate-500">{app.target_url}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild>
                <Link href={`/view/${app.id}`} target="_blank">View App</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/app/${app.id}/settings`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <DeleteAppButton appId={app.id}>
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </DeleteAppButton>
            </CardFooter>
          </Card>
        ))}
        
        {apps.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            No apps found. Create your first one!
          </div>
        )}
      </div>
    </div>
  )
}
