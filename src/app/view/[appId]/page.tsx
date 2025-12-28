/* eslint-disable @next/next/no-img-element */
import { getApp } from '@/lib/actions'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import InstallButton from './install-button'
import { ArrowLeft, Search, MoreVertical, Star, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = {
  params: { appId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const app = await getApp(params.appId)
  if (!app) return {}
  
  return {
    title: app.name,
    description: app.description,
    manifest: `/api/manifest/${app.id}`,
    themeColor: app.themeColor || '#ffffff',
  }
}

export default async function ViewAppPage({ params }: Props) {
  const app = await getApp(params.appId)
  
  if (!app) {
    notFound()
  }

  const themeColor = app.themeColor || '#01875f'

  return (
    <div className="bg-white min-h-screen text-slate-900 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-white z-10 shadow-sm">
        <ArrowLeft className="w-6 h-6 text-slate-600" />
        <div className="flex gap-4">
            <Search className="w-6 h-6 text-slate-600" />
            <MoreVertical className="w-6 h-6 text-slate-600" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 pt-2">
          {/* App Header */}
          <div className="flex gap-5 mb-6">
              <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  {app.logoUrl ? (
                      <img src={app.logoUrl} alt={app.name} className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-2xl font-bold">
                          {app.name.charAt(0)}
                      </div>
                  )}
              </div>
              <div className="flex flex-col justify-center">
                  <h1 className="text-2xl font-semibold leading-tight mb-1">{app.name}</h1>
                  <p className="text-[#01875f] font-medium text-sm mb-1">RoiBest Developer</p>
                  <p className="text-xs text-slate-500">Contains ads • In-app purchases</p>
              </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-8 px-2 border-b border-slate-100 pb-4">
              <div className="flex flex-col items-center gap-1 border-r border-slate-200 flex-1">
                  <div className="flex items-center gap-1 font-semibold">
                      <span>4.5</span>
                      <Star className="w-3 h-3 fill-current" />
                  </div>
                  <span className="text-xs text-slate-500">2K reviews</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-r border-slate-200 flex-1">
                  <span className="font-semibold">1M+</span>
                  <span className="text-xs text-slate-500">Downloads</span>
              </div>
              <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="bg-slate-100 w-8 h-8 rounded-sm flex items-center justify-center font-bold text-xs border border-slate-300">3+</div>
                  <span className="text-xs text-slate-500">Rated for 3+</span>
              </div>
          </div>

          {/* Install Button */}
          <div className="mb-8">
              <InstallButton appId={app.id} vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!} themeColor={themeColor} />
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified by Play Protect</span>
              </div>
          </div>

          {/* Screenshots */}
          <div className="mb-8 overflow-x-auto whitespace-nowrap pb-4 -mx-5 px-5 scrollbar-hide">
              {app.screenshots && app.screenshots.length > 0 ? (
                  app.screenshots.map((shot, i) => (
                      <img key={i} src={shot} alt="Screenshot" className="inline-block h-64 w-auto rounded-lg mr-3 shadow-sm border border-slate-100" />
                  ))
              ) : (
                 <div className="inline-block h-64 w-32 rounded-lg mr-3 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                    No shots
                 </div>
              )}
          </div>

          {/* About */}
          <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">About this app</h2>
                  <ArrowLeft className="w-5 h-5 rotate-180 text-slate-600" />
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {app.description || "No description provided."}
              </p>
          </div>

          {/* Data Safety */}
          <div className="mb-8">
               <h2 className="text-lg font-semibold mb-4">Data safety</h2>
               <p className="text-slate-600 text-sm mb-4">Safety starts with understanding how developers collect and share your data.</p>
               <div className="border border-slate-200 rounded-lg p-4">
                   <div className="flex gap-4 items-start mb-4">
                       <ShieldCheck className="w-6 h-6 text-slate-500 mt-0.5" />
                       <div>
                           <p className="font-medium text-sm">No data shared with third parties</p>
                           <p className="text-xs text-slate-500">Learn more about how developers declare sharing</p>
                       </div>
                   </div>
               </div>
          </div>
      </div>
    </div>
  )
}
