import { Footer, Header, SITE_NAME } from '@/components/Chrome'
import { getLearner } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Terms of use' }

// Template wording. Review it, fill in the bracketed parts and adjust it to how you actually operate.
export default async function Page() {
  const learner = await getLearner()
  return (
    <div className="page">
      <Header learner={learner} />
      <main className="wrap doc-main">
        <p className="eyebrow eyebrow--lg">Terms of use</p>
        <h1>Terms for using {SITE_NAME}</h1>
        <p className="updated">Last updated: [DATE]</p>

        <h2>Using the site</h2>
        <p>The articles are free to read. An account is optional and is used only to keep your reading progress and saved articles.</p>

        <h2>Your account</h2>
        <p>Keep your sign-in details to yourself and tell us if you think someone else has used your account. We may suspend accounts that are used to disrupt the site.</p>

        <h2>The content</h2>
        <p>Articles are written for learning. We work to keep them accurate, but they are provided as they are, without a guarantee that they are complete or suited to a particular system you are building.</p>
        <p>Unless stated otherwise, the articles and diagrams belong to [NAME OR ORGANISATION]. You may quote short passages with a link back to the article.</p>

        <h2>Changes</h2>
        <p>We may update these terms. The date at the top shows when they last changed.</p>

        <h2>Contact</h2>
        <p>Questions about these terms can be sent to [CONTACT EMAIL].</p>
      </main>
      <Footer />
    </div>
  )
}
