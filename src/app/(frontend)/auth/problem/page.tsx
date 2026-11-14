import Link from 'next/link'
import { Footer, Header } from '@/components/Chrome'

export const metadata = { title: 'Sign-in problem' }

const messages: Record<string, { title: string; text: string }> = {
  off: { title: 'Google sign-in is not set up', text: 'Google sign-in is not available on this site yet. You can still sign in with your email address and password.' },
  'admin-off': { title: 'Google sign-in is not enabled for admins', text: 'No admin Google accounts have been allowed yet. Sign in to the editing panel with your email address and password.' },
  'not-admin': { title: 'That Google account is not an admin', text: 'This Google account is not on the list of accounts allowed into the editing panel. Try another account, or ask the site owner to add you.' },
  cancelled: { title: 'Sign-in was cancelled', text: 'You left Google before finishing. Nothing was changed. You can try again.' },
  expired: { title: 'That sign-in attempt expired', text: 'The sign-in took too long or was opened in a different browser. Start again from the sign-in page.' },
  unverified: { title: 'Google has not verified that email address', text: 'We can only sign you in with a Google account whose email address is verified.' },
  google: { title: 'Google did not complete the sign-in', text: 'Something went wrong while talking to Google. Wait a moment and try again.' },
}

export default async function Page({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason = 'google' } = await searchParams
  const m = messages[reason] || messages.google
  const admin = reason === 'not-admin' || reason === 'admin-off'
  return (
    <div className="page">
      <Header learner={null} minimal />
      <main className="wrap doc-main">
        <p className="eyebrow eyebrow--lg">Sign-in</p>
        <h1>{m.title}</h1>
        <p className="lead">{m.text}</p>
        <p><Link href={admin ? '/admin' : '/sign-in'} className="btn btn--accent btn--lg">{admin ? 'Back to admin sign-in' : 'Back to sign in'}</Link></p>
      </main>
      <Footer minimal />
    </div>
  )
}
