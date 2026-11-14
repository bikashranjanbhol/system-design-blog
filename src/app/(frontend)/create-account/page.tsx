import { redirect } from 'next/navigation'
import { getLearner } from '@/lib/data'
import { Footer, Header } from '@/components/Chrome'
import { AuthForm } from '@/components/AuthForm'
import { googleEnabled } from '@/lib/google'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Create account' }

const Check = () => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11.5l4.5 4.5L18 6.5" /></svg>
)

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '' } = await searchParams
  const learner = await getLearner()
  if (learner) redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/learning-paths')
  return (
    <div className="page page--auth">
      <Header learner={null} minimal />
      <main className="wrap auth-main">
        <div className="auth-pitch">
          <p className="eyebrow eyebrow--lg">Your learning progress</p>
          <h1>Create an account to keep your place.</h1>
          <ul>
            <li><Check /><span>Pick up each learning path at the article you stopped on.</span></li>
            <li><Check /><span>See which articles you have read and what is next.</span></li>
            <li><Check /><span>Save articles to come back to later.</span></li>
          </ul>
          <p className="auth-pitch__note">Reading stays open to everyone. You only need an account to track progress.</p>
        </div>
        <AuthForm mode="create" next={next} google={googleEnabled()} />
      </main>
      <Footer minimal />
    </div>
  )
}
