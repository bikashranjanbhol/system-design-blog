import React from 'react'
import { adminGoogleEnabled } from '@/lib/google'

/** Shown under the email and password form on the /admin login screen. */
export function AdminGoogleButton() {
  if (!adminGoogleEnabled()) return null
  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
      <span style={{ textAlign: 'center', fontSize: 13, opacity: 0.7 }}>or</span>
      <a
        href="/auth/google?as=admin"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 16px', border: '1px solid currentColor', borderRadius: 4, textDecoration: 'none', fontWeight: 600 }}
      >
        Sign in with Google
      </a>
    </div>
  )
}
