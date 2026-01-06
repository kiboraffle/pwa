'use client'

import { useEffect, useCallback, useState } from 'react'
import { subscribeUser, subscribeUserToAllApps } from '@/lib/actions'

export default function SWRegister() {
  type NavigatorStandalone = Navigator & { standalone?: boolean }
  const [showBanner, setShowBanner] = useState(false)

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const ensureSubscription = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
      
      const isView = pathname.startsWith('/view/')
      const isDashboard = pathname.startsWith('/dashboard')
      
      if (isView) return // Disable for view app
      if (!isDashboard) return // Only allow on dashboard (User Panel)

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription && vapidKey) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })
      }
      if (subscription) {
        console.log('Subscription Token Berhasil Dibuat:', subscription)
        if (isDashboard) {
            await subscribeUserToAllApps(JSON.parse(JSON.stringify(subscription)))
        }
      }
    } catch (e) {
      console.error('Subscription update failed', e)
    }
  }, [])

  useEffect(() => {
    async function init() {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      const isView = /^\/view\/([^/]+)/.test(path)
      
      if (isView) return // Completely disable on view app

      const navigatorStandalone = window.navigator as NavigatorStandalone
      const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || !!navigatorStandalone.standalone
      console.log('Notification system initialized')
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js')
        } catch (e) {
          console.error('Service Worker registration failed', e)
        }
      }
      
      // Only proceed if NOT view app (already checked above)
      if (Notification.permission === 'granted') {
        await ensureSubscription()
        setShowBanner(false)
      } else if (Notification.permission === 'default' && !standalone) {
        // Only show banner/request if not standalone and default permission
         setShowBanner(true)
      }
    }
    init()
    
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    const isView = /^\/view\/([^/]+)/.test(path)
    
    if (isView) return

    let triggered = false
    async function requestOnFirstClick() {
      if (triggered) return
      triggered = true
      try {
        if (Notification.permission === 'default') {
          const result = await Notification.requestPermission()
          if (result === 'granted') {
            await ensureSubscription()
          }
        }
      } catch {}
    }
    
    document.addEventListener('click', requestOnFirstClick, { once: true, capture: true })
    
    return () => {
      document.removeEventListener('click', requestOnFirstClick, { capture: true })
    }
  }, [ensureSubscription])

  async function onActivate() {
    try {
      const result = await Notification.requestPermission()
      if (result === 'granted') {
        await ensureSubscription()
        setShowBanner(false)
      }
    } catch {}
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={onActivate}
        className="px-3 py-1.5 rounded-md shadow-md border bg-white text-slate-800 text-xs"
        aria-label="Aktifkan Notifikasi"
        title="Ketuk untuk aktifkan notifikasi"
      >
        Ketuk untuk aktifkan notifikasi
      </button>
    </div>
  )
}
