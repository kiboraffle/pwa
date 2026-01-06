import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0].toLowerCase()
  const platformHosts = ['localhost', '127.0.0.1']
  if (platformHosts.includes(hostname) || hostname.endsWith('.vercel.app')) {
    const res = NextResponse.next()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            res.cookies.set(name, value, options)
          },
          remove(name, options) {
            res.cookies.set(name, '', options)
          }
        }
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    const protectedPath = request.nextUrl.pathname.startsWith('/dashboard')
    if (protectedPath && !user) {
      const redirectUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return res
  }
  const resolveUrl = new URL(`/api/domain/resolve?host=${hostname}`, request.url)
  try {
    const res = await fetch(resolveUrl.toString(), { headers: { 'x-mw': '1' } })
    if (res.ok) {
      const data = await res.json()
      const rewriteUrl = new URL(`/view/${data.appId}`, request.url)
      return NextResponse.rewrite(rewriteUrl)
    }
  } catch {}
  return NextResponse.next()
}
