'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createApp } from '@/lib/actions'

export function CreateAppDialog() {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
      // Process screenshots from comma-separated string to JSON string for the server action
      const screenshotsRaw = formData.get('screenshots_input') as string
      if (screenshotsRaw) {
          const urls = screenshotsRaw.split(',').map(s => s.trim()).filter(s => s)
          formData.set('screenshots', JSON.stringify(urls))
      }
      
      await createApp(formData)
      setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create App</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New App</DialogTitle>
          <DialogDescription>
            Enter the details for your new PWA wrapper.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" name="name" placeholder="My App" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target_url" className="text-right">Target URL</Label>
            <Input id="target_url" name="target_url" placeholder="https://example.com" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="logoUrl" className="text-right">Logo URL</Label>
            <Input id="logoUrl" name="logoUrl" placeholder="https://example.com/icon.png" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="themeColor" className="text-right">Theme Color</Label>
            <div className="col-span-3 flex gap-2">
                <Input id="themeColor" name="themeColor" type="color" className="w-12 p-1 h-10" defaultValue="#000000" />
                <Input name="themeColor_text" placeholder="#000000" className="flex-1" onChange={(e) => {
                    const el = document.getElementById('themeColor') as HTMLInputElement
                    if (el) el.value = e.target.value
                }} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" name="description" placeholder="App description..." className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="screenshots_input" className="text-right">Screenshots</Label>
            <Textarea id="screenshots_input" name="screenshots_input" placeholder="Comma separated URLs: https://..., https://..." className="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="submit">Create App</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
