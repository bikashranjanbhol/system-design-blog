'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createAccount, signIn, type FormState } from '@/app/(frontend)/actions'

export function AuthForm({ mode, next }: { mode: 'sign-in' | 'create'; next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === 'sign-in' ? signIn : createAccount, undefined)
  const q = next ? `?next=${encodeURIComponent(next)}` : ''
  return (
    <form action={action} className="auth-card">
      <h2>{mode === 'sign-in' ? 'Sign in' : 'Create a free account'}</h2>
      <input type="hidden" name="next" value={next} />
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      {mode === 'create' && (
        <div className="field">
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" type="text" autoComplete="name" defaultValue={state?.name} />
        </div>
      )}
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" defaultValue={state?.email} required />
      </div>
      <div className="field">
        <div className="field__row">
          <label htmlFor="password">Password</label>
          {mode === 'sign-in' && <Link href="/sign-in#forgot">Forgot password?</Link>}
        </div>
        <input id="password" name="password" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} required />
      </div>
      {mode === 'sign-in' && (
        <label className="check">
          <input type="checkbox" name="keep" />
          <span>Keep me signed in on this device</span>
        </label>
      )}
      <button type="submit" className="btn btn--accent btn--xl" disabled={pending}>
        {pending ? 'One moment…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
      </button>
      <p className="auth-card__alt">
        {mode === 'sign-in' ? (
          <>New here? <Link href={`/create-account${q}`}>Create a free account</Link></>
        ) : (
          <>Already have an account? <Link href={`/sign-in${q}`}>Sign in</Link></>
        )}
      </p>
    </form>
  )
}
