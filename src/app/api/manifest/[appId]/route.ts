import { getApp } from '@/lib/actions'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params
  const app = await getApp(appId)

  if (!app) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const manifest = {
    name: app.name,
    short_name: app.name,
    description: app.description || app.name,
    start_url: app.target_url,
    display: "standalone",
    background_color: app.themeColor || "#ffffff",
    theme_color: app.themeColor || "#000000",
    icons: app.logoUrl ? [
      {
        src: app.logoUrl,
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: app.logoUrl,
        sizes: "512x512",
        type: "image/png"
      }
    ] : [],
    screenshots: app.screenshots?.map(src => ({
        src,
        type: "image/png",
        sizes: "1080x1920",
        form_factor: "narrow"
    })) || []
  }

  return NextResponse.json(manifest)
}
