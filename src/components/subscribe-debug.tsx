'use client'

import { useState } from 'react'
import { subscribeUserToAllApps } from '@/lib/actions'

export function SubscribeDebug() {
  const [status, setStatus] = useState<string>('')

  async function handleSubscribe() {
    setStatus('Starting subscription process...')
    try {
      if (!('serviceWorker' in navigator)) {
        setStatus('Service Worker not supported')
        return
      }

      const registration = await navigator.serviceWorker.ready
      setStatus('Service Worker ready. Checking subscription...')
      
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        setStatus('No subscription found. Attempting to subscribe...')
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
            setStatus('VAPID Key missing in env')
            return
        }
        
        const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4)
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
            const rawData = window.atob(base64)
            const outputArray = new Uint8Array(rawData.length)
            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i)
            }
            return outputArray
        }

        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })
      }

      setStatus('Subscription obtained. Sending to server...')
      console.log('Subscription:', subscription)
      
      const result = await subscribeUserToAllApps(JSON.parse(JSON.stringify(subscription)))
      if (result.success) {
        setStatus(`Success! Subscribed to ${result.count} apps.`)
      } else {
        setStatus(`Failed to save to server: ${result.error}`)
      }

    } catch (e) {
      console.error(e)
      setStatus(`Error: ${String(e)}`)
    }
  }

  return (
    <div className="mb-4 p-4 border rounded bg-slate-50">
      <h3 className="font-bold mb-2">Notification Debug</h3>
      <p className="text-sm mb-2 text-slate-600">{status}</p>
      <button 
        onClick={handleSubscribe}
        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        Force Subscribe
      </button>
    </div>
  )
}
