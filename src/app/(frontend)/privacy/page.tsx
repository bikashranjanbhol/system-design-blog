import { Footer, Header, SITE_NAME } from '@/components/Chrome'
import { getLearner } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Privacy policy' }

// Template wording. Review it, fill in the bracketed parts and adjust it to how you actually operate.
export default async function Page() {
  const learner = await getLearner()
  return (
    <div className="page">
      <Header learner={learner} />
      <main className="wrap doc-main">
        <p className="eyebrow eyebrow--lg">Privacy policy</p>
        <h1>How {SITE_NAME} handles your information</h1>
        <p className="updated">Last updated: [DATE]</p>

        <p>You can read every article on this site without an account. This page explains what we store if you choose to create one.</p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your email address and, if you give it, your name. If you sign up with a password, we store it in hashed form, never as plain text.</li>
          <li><strong>Google sign-in:</strong> if you choose &ldquo;Continue with Google&rdquo;, Google tells us your name, email address and whether that address is verified. We do not receive your Google password or access to any other Google data.</li>
          <li><strong>Reading progress:</strong> which articles you have read and which you have saved, so that learning paths can show your place.</li>
          <li><strong>A sign-in cookie:</strong> one cookie that keeps you signed in. We do not use advertising or tracking cookies.</li>
        </ul>

        <h2>How we use it</h2>
        <p>We use this information only to sign you in and to show your progress. We do not sell it or use it for advertising.</p>

        <h2>Who processes it for us</h2>
        <ul>
          <li><strong>Vercel</strong> hosts the site.</li>
          <li><strong>Neon</strong> hosts the database that holds accounts and reading progress.</li>
          <li><strong>Google</strong> provides sign-in, if you choose it, and the fonts used on the site. Loading the fonts means your browser contacts Google&rsquo;s servers.</li>
        </ul>

        <h2>Your choices</h2>
        <p>You can ask us to delete your account and its reading progress, or to send you a copy of what we hold, by writing to [CONTACT EMAIL].</p>

        <h2>Who we are</h2>
        <p>{SITE_NAME} is run by [NAME OR ORGANISATION], [COUNTRY]. Questions about this policy can be sent to [CONTACT EMAIL].</p>
      </main>
      <Footer />
    </div>
  )
}
