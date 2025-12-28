'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { savePushSubscription } from '@/lib/actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallButton({ appId, vapidKey, themeColor }: { appId: string, vapidKey: string, themeColor?: string }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')

  useEffect(() => {
    async function init() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            
            try {
                // Register SW
                const registration = await navigator.serviceWorker.register('/sw.js')
                console.log('SW registered: ', registration)
                
                // Check subscription
                const subscription = await registration.pushManager.getSubscription()
                if (subscription) {
                    setIsSubscribed(true)
                }
    
                // Request permission on load as requested
                if (Notification.permission === 'default') {
                    const perm = await Notification.requestPermission()
                    setPermissionState(perm)
                    if (perm === 'granted' && vapidKey) {
                         await subscribeToPush(registration)
                    }
                } else {
                     setPermissionState(Notification.permission)
                }
            } catch (error) {
                console.log('SW registration failed: ', error)
            }
        }
    }
    init()
    
    // Install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function subscribeToPush(registration?: ServiceWorkerRegistration) {
    try {
        if (!vapidKey) return
        const reg = registration || await navigator.serviceWorker.ready
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })
        
        await savePushSubscription(appId, JSON.parse(JSON.stringify(subscription)))
        setIsSubscribed(true)
        console.log('Subscribed to notifications!')
    } catch (e) {
        console.error('Failed to subscribe', e)
    }
  }

  async function handleInstall() {
      if (deferredPrompt) {
          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          if (outcome === 'accepted') {
              setDeferredPrompt(null)
          }
      }
  }

  if (!isSupported) return null // Hide if not supported
  
  // Use unused vars to silence linter or just remove them if not needed.
  // Actually, I should use them.
  console.log("Permission state:", permissionState)

  const btnStyle = { backgroundColor: themeColor || '#01875f', color: 'white' } // Play Store Green default

  return (
    <div className="flex flex-col gap-4 w-full">
      {!vapidKey && (
          <Button disabled className="w-full h-10 font-medium rounded-lg opacity-50" style={{ backgroundColor: themeColor || '#777', color: 'white' }}>
            Notifications unavailable
          </Button>
      )}
      {deferredPrompt ? (
          <Button onClick={handleInstall} className="w-full h-10 font-medium rounded-lg" style={btnStyle}>
            Install
          </Button>
      ) : (
          <Button disabled className="w-full h-10 font-medium rounded-lg opacity-50" style={btnStyle}>
             {isSubscribed ? "Installed & Subscribed" : "Installed"}
          </Button>
      )}
    </div>
  )
}
