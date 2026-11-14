import Link from 'next/link'
import type { Article } from '@/payload-types'
import { levelLabel, topicName } from '@/lib/data'
import { Cover } from './Cover'

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`} className="card">
      <Cover cover={article.cover} />
      <div className="meta">
        <span>{topicName(article)}</span>
        <span>{levelLabel(article.level)}</span>
        {article.readMinutes ? <span>{article.readMinutes} min</span> : null}
      </div>
      <h3>{article.title}</h3>
      <p>{article.dek}</p>
    </Link>
  )
}
