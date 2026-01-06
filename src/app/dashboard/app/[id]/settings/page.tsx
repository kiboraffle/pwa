import { getApp } from '@/lib/actions'
import { updateAppSettings } from '@/lib/actions/app'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function AppSettingsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { id } = await params
  const sp = await searchParams
  const app = await getApp(id)
  if (!app) {
    notFound()
  }

  async function handleSave(formData: FormData) {
    'use server'
    const domain = (formData.get('custom_domain') as string)?.trim() || ''
    const apk = (formData.get('apk_url') as string)?.trim() || ''
    await updateAppSettings(app!.id, { customDomain: domain || null, apkUrl: apk || null })
    redirect(`/dashboard/app/${app!.id}/settings?saved=1`)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">App Settings</h1>
        {sp?.saved === '1' && (
          <div className="mt-3 text-sm text-green-600">Berhasil disimpan</div>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSave} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="custom_domain">Custom Domain</Label>
              <Input
                id="custom_domain"
                name="custom_domain"
                placeholder="domain-anda.com"
                defaultValue={app.customDomain || ''}
                pattern="^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
                title="Masukkan nama domain valid, tanpa http:// atau path"
              />
              <div className="text-xs text-slate-600 space-y-1">
                <p>Cara Menghubungkan Domain Anda:</p>
                <p>1. Masuk ke panel domain Anda (GoDaddy, Niagahoster, dll).</p>
                <p>2. Tambahkan CNAME Record.</p>
                <p>3. Isi Host/Name dengan @ atau subdomain (misal: app).</p>
                <p>4. Isi Value/Target dengan: <span className="font-mono">cname.vercel-dns.com</span>.</p>
                <p className="mt-2"><span className="font-medium">Status:</span> Waiting for DNS</p>
                <p className="mt-2 text-slate-500">Hosting sudah kami sediakan secara gratis. Anda hanya perlu menghubungkan domain Anda saja.</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apk_url">APK Download Link</Label>
              <Input id="apk_url" name="apk_url" placeholder="https://drive.google.com/..." defaultValue={app.apkUrl || ''} />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
