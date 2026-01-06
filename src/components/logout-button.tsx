'use client'

import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  async function onLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }
  return (
    <button onClick={onLogout} className="px-3 py-1.5 rounded-md border text-sm">
      Logout
    </button>
  )
}
