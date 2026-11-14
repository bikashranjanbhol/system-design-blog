/**
 * Fills an empty database with the sample content from the mockups.
 * Run with: npm run seed
 */
import { getPayload } from 'payload'
import config from './payload.config'

type Fmt = { type: 'text'; text: string; format: number; detail: 0; mode: 'normal'; style: ''; version: 1 }

const inline = (s: string): Fmt[] =>
  s
    .split('`')
    .map((text, i) => ({ type: 'text' as const, text, format: i % 2 ? 16 : 0, detail: 0 as const, mode: 'normal' as const, style: '' as const, version: 1 as const }))
    .filter((n) => n.text.length > 0)

const rich = (...paras: string[]) => ({
  root: {
    type: 'root',
    children: paras.map((p) => ({
      type: 'paragraph',
      children: inline(p),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      textFormat: 0,
      textStyle: '',
      version: 1,
    })),
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

const text = (...paras: string[]) => ({ blockType: 'text' as const, content: rich(...paras) })
const heading = (t: string) => ({ blockType: 'heading' as const, text: t })
const box = (label: string, style: 'plain' | 'dark' | 'accent' = 'plain') => ({ items: [{ label, style }] })
const stack = (...items: [string, ('plain' | 'dark' | 'accent')?][]) => ({
  items: items.map(([label, style]) => ({ label, style: style ?? 'plain' })),
})

async function run() {
  const payload = await getPayload({ config })

  const existing = await payload.count({ collection: 'articles' })
  if (existing.totalDocs > 0) {
    payload.logger.info('Articles already exist; nothing seeded.')
    process.exit(0)
  }

  const author = await payload.create({
    collection: 'users',
    data: { name: 'Author Name', email: 'admin@example.com', password: 'change-me-admin' },
  })
  const learner = await payload.create({
    collection: 'learners',
    data: { name: 'Demo Learner', email: 'learner@example.com', password: 'change-me-learner' },
  })

  const topicRows = [
    ['Fundamentals', 'fundamentals', 'Requests, scaling and estimates', true, false, false],
    ['Networking', 'networking', 'DNS, HTTP, load balancing, CDNs', false, true, false],
    ['Databases', 'databases', 'SQL, NoSQL, indexes, sharding', true, true, false],
    ['Caching', 'caching', 'Strategies, eviction, invalidation', true, true, true],
    ['Messaging', 'messaging', 'Queues, pub/sub, event streams', true, true, true],
    ['Consistency', 'consistency', 'CAP, replication, consensus', false, true, true],
    ['Reliability', 'reliability', 'Failover, retries, rate limiting', false, true, false],
    ['Observability', 'observability', 'Logs, metrics, tracing', false, true, false],
    ['Case studies', 'case-studies', 'Full designs, start to finish', true, true, false],
    ['Distributed data', 'distributed-data', 'Hashing, partitioning, replication', false, false, true],
  ] as const
  const topics: Record<string, number | string> = {}
  for (const [i, [name, slug, description, inFilter, inGrid, popular]] of topicRows.entries()) {
    const t = await payload.create({
      collection: 'topics',
      data: { name, slug, description, order: i, inFilter, inGrid, popular },
    })
    topics[slug] = t.id
  }

  let day = 0
  const ids: Record<string, number | string> = {}
  const add = async (a: {
    slug: string
    title: string
    shortTitle?: string
    dek: string
    topic: string
    level: 'beginner' | 'intermediate' | 'advanced'
    min: number
    cover: ReturnType<typeof box>[]
    body: unknown[]
    featured?: boolean
    quiz?: unknown[]
  }) => {
    const publishedAt = new Date(Date.UTC(2026, 10, 12 - day++)).toISOString()
    const doc = await payload.create({
      collection: 'articles',
      data: {
        title: a.title,
        shortTitle: a.shortTitle,
        slug: a.slug,
        status: 'published',
        featured: a.featured ?? false,
        publishedAt,
        author: author.id,
        topic: topics[a.topic],
        level: a.level,
        readMinutes: a.min,
        dek: a.dek,
        cover: a.cover,
        body: a.body,
        quiz: a.quiz,
      } as never,
    })
    ids[a.slug] = doc.id
  }

  await add({
    slug: 'consistent-hashing',
    title: 'Consistent hashing, explained with one ring and three servers',
    shortTitle: 'Consistent hashing',
    dek: 'Why adding a cache server should not reshuffle every key, and the small idea that prevents it.',
    topic: 'distributed-data',
    level: 'intermediate',
    min: 12,
    featured: true,
    cover: [box('key'), box('hash()', 'dark'), stack(['Server A'], ['Server B', 'accent'], ['Server C'])],
    body: [
      text(
        'Suppose you run three cache servers and pick one for each key with `hash(key) % 3`. It works until you add a fourth server. Now the rule is `% 4`, and most keys land somewhere new. Your cache is suddenly cold and every miss falls through to the database.',
      ),
      heading('Put servers and keys on the same ring'),
      text(
        "Consistent hashing hashes servers as well as keys into one shared range, and bends that range into a circle. A key belongs to the first server you meet walking clockwise from the key's position.",
      ),
      {
        blockType: 'lineDiagram',
        alt: 'The hash range drawn as a line from 0 to 2 to the power 32. Servers A, B and C sit at three points. Keys k1 and k2 fall before server B, so both belong to B.',
        startLabel: '0',
        endLabel: '2³²',
        markers: [
          { label: 'A', position: 14 },
          { label: 'B', position: 52, highlight: true },
          { label: 'C', position: 84 },
        ],
        points: [
          { label: 'k1', position: 28, highlight: true },
          { label: 'k2', position: 41, highlight: true },
          { label: 'k3', position: 68 },
        ],
        notes: [
          { text: 'k1, k2 → B', position: 28 },
          { text: 'k3 → C', position: 64 },
        ],
        caption:
          'Figure 1. The ring, unrolled into a line. Each key belongs to the next server to its right; past the end, it wraps around to A.',
      },
      heading('What happens when a server joins'),
      text(
        'Add server D between A and B. Only the keys that sit between A and D change owner, moving from B to D. Every other key stays put. On average, adding one server to N moves about 1/N of the keys, instead of nearly all of them.',
      ),
      {
        blockType: 'callout',
        label: 'Key takeaway',
        text: "Membership changes touch only a server's neighbours on the ring. That locality is the whole point.",
      },
      {
        blockType: 'code',
        code: 'def owner(key, ring):\n    # ring: sorted list of (position, server)\n    h = hash32(key)\n    for position, server in ring:\n        if position >= h:\n            return server\n    return ring[0][1]   # wrap around',
      },
      heading('Virtual nodes even out the load'),
      text(
        'With only three points on the ring, one server can own a far bigger arc than the others. The fix is to place each server at many positions, called virtual nodes, so the arcs average out.',
      ),
      {
        blockType: 'table',
        headers: [{ label: 'Approach' }, { label: 'Keys moved when a server joins' }, { label: 'Load spread' }],
        rows: [
          { cells: [{ value: 'hash % N' }, { value: 'Nearly all' }, { value: 'Even' }] },
          { cells: [{ value: 'Ring, one point per server' }, { value: 'About 1/N' }, { value: 'Uneven' }] },
          { cells: [{ value: 'Ring with virtual nodes' }, { value: 'About 1/N' }, { value: 'Close to even' }] },
        ],
      },
    ],
    quiz: [
      {
        question: 'Server B fails and is removed from the ring. Which keys need a new owner?',
        options: [
          { text: 'Every key in the cluster' },
          { text: 'Only the keys B owned, which move to the next server clockwise', correct: true },
          { text: 'Half of all keys, chosen at random' },
        ],
        explanation: 'Only the arc B owned is affected. Its keys fall through to the next server clockwise.',
      },
      {
        question: 'Why does hash(key) % N reshuffle most keys when N changes?',
        options: [
          { text: 'The hash function itself changes' },
          { text: 'The remainder depends on N, so almost every key gets a different result', correct: true },
          { text: 'Keys are rehashed in random order' },
        ],
        explanation: 'The hash stays the same, but dividing by a different N gives a different remainder for most keys.',
      },
      {
        question: 'What problem do virtual nodes solve?',
        options: [
          { text: 'Uneven load when servers own arcs of very different sizes', correct: true },
          { text: 'Keys moving when a server joins' },
          { text: 'Slow hash functions' },
        ],
        explanation: 'Many positions per server average out the arc sizes, so load is close to even.',
      },
    ],
  })

  await add({
    slug: 'load-balancers',
    title: 'Load balancers: round robin, least connections and when each fits',
    shortTitle: 'Load balancers',
    dek: 'What sits between your users and your servers, and how it decides who gets the next request.',
    topic: 'fundamentals',
    level: 'beginner',
    min: 8,
    cover: [box('Client'), box('LB', 'dark'), box('App ×3')],
    body: [
      text('One server can only handle so many requests. Once you run several copies of your application, something has to decide which copy answers each request. That something is a load balancer.'),
      heading('Round robin'),
      text('Requests go to each server in turn: first, second, third, then back to the first. It is simple and fair when every server has the same capacity and every request costs about the same.'),
      heading('Least connections'),
      text('The next request goes to the server with the fewest open connections. This suits workloads where some requests are much slower than others, because a server stuck on slow requests stops receiving new ones until it catches up.'),
      heading('Health checks'),
      text('Whatever the algorithm, the load balancer also probes each server regularly and stops sending traffic to any that fail. That is what turns several servers into a system that survives losing one.'),
    ],
  })

  await add({
    slug: 'cache-strategies',
    title: 'Cache-aside, write-through, write-behind: three ways to keep a cache fresh',
    shortTitle: 'Cache-aside, write-through, write-behind',
    dek: 'The same cache, three different promises about staleness and write cost.',
    topic: 'caching',
    level: 'beginner',
    min: 10,
    cover: [box('App'), box('Cache', 'accent'), box('DB')],
    body: [
      text('A cache keeps a copy of data closer to the application than the database is. The hard part is deciding when that copy gets written and how stale it is allowed to be.'),
      heading('Cache-aside'),
      text('The application checks the cache first. On a miss it reads the database, then stores the result in the cache. Only data that is actually requested gets cached, but the first read of anything is slow, and an entry can be stale until it expires or is deleted.'),
      heading('Write-through'),
      text('Every write goes to the cache and the database together, before the write is confirmed. Reads are fresh, at the price of slower writes and a cache holding data nobody may ever read.'),
      heading('Write-behind'),
      text('Writes go to the cache at once and reach the database later, in batches. Writes are fast, but anything not yet flushed is lost if the cache fails.'),
    ],
  })

  await add({
    slug: 'message-queues',
    title: 'Message queues and what "at-least-once" really costs you',
    shortTitle: 'Message queues',
    dek: 'Delivery guarantees, duplicate messages and why consumers need to be idempotent.',
    topic: 'messaging',
    level: 'intermediate',
    min: 11,
    cover: [box('Producer'), box('Queue', 'dark'), box('Consumer')],
    body: [
      text('A queue lets one service hand work to another without waiting for it. The producer writes a message and moves on; a consumer picks it up when it can.'),
      heading('At-least-once delivery'),
      text('Most queues redeliver a message if the consumer does not acknowledge it in time. That protects against lost work, but it means the same message can arrive twice, for example when a consumer finishes the work and crashes before acknowledging.'),
      heading('Idempotent consumers'),
      text('The usual answer is to make processing safe to repeat: record a message ID and skip it if seen before, or design the operation so that applying it twice gives the same result as applying it once.'),
    ],
  })

  await add({
    slug: 'replication-lag',
    title: 'Replication lag: why you sometimes cannot read your own write',
    shortTitle: 'Replication lag',
    dek: 'Synchronous versus asynchronous replicas, and the read patterns that hide the gap.',
    topic: 'databases',
    level: 'intermediate',
    min: 13,
    cover: [box('Primary', 'dark'), stack(['Replica 1'], ['Replica 2'])],
    body: [
      text('With asynchronous replication the primary confirms a write before the replicas have it. For a short time a replica still serves the old value. That gap is replication lag.'),
      heading('Read your own writes'),
      text('A user who saves a profile and is then served by a lagging replica sees the old profile. A common fix is to read from the primary for a short window after a user writes, or for data only that user can change.'),
      heading('Synchronous replicas'),
      text('Waiting for a replica to confirm before acknowledging the write removes the gap for that replica, at the cost of slower writes and a write path that stalls if the replica is unreachable.'),
    ],
  })

  await add({
    slug: 'shard-key',
    title: 'Choosing a shard key without painting yourself into a corner',
    shortTitle: 'Choosing a shard key',
    dek: 'Range, hash and directory sharding, and the hot-partition problem each one risks.',
    topic: 'databases',
    level: 'intermediate',
    min: 14,
    cover: [box('Router'), stack(['Shard A–M'], ['Shard N–Z', 'accent'])],
    body: [
      text('Sharding splits one large table across several databases. The shard key decides which database holds each row, and it is hard to change later.'),
      heading('Range, hash and directory'),
      text('Range sharding keeps neighbouring keys together, which makes range scans cheap but lets one busy range overload a shard. Hash sharding spreads keys evenly but scatters ranges. A directory maps each key to a shard explicitly, which is flexible but adds a lookup to every query.'),
      heading('Hot partitions'),
      text('A key that looks even on paper can still be skewed in practice: one very large customer, or a timestamp that sends all new writes to the last shard. Check the real distribution of the key before committing to it.'),
    ],
  })

  await add({
    slug: 'url-shortener',
    title: 'Design a URL shortener, from requirements to capacity estimate',
    shortTitle: 'Design a URL shortener',
    dek: 'A full walk-through: API, key generation, storage choice, caching and redirects.',
    topic: 'case-studies',
    level: 'advanced',
    min: 18,
    cover: [box('Long URL'), box('Encode', 'dark'), box('/x7Kp2')],
    body: [
      text('A URL shortener has two operations: create a short code for a long URL, and redirect a short code to its long URL. Redirects vastly outnumber creations, so the design is read-heavy.'),
      heading('Generating codes'),
      text('One approach is a counter encoded in base 62, which never collides but makes codes guessable. Another is a random code checked for collisions on insert. Seven base-62 characters give about 3.5 trillion codes.'),
      heading('Serving redirects'),
      text('A redirect is a single key lookup, which suits a key-value store with a cache in front. Popular links are read far more often than the rest, so even a small cache absorbs most of the traffic.'),
    ],
  })

  // Shorter starter articles, so every learning path has its full sequence.
  const starters: [string, string, string, string, 'beginner' | 'intermediate' | 'advanced', number, string, string, ReturnType<typeof box>[]][] = [
    ['request-path', 'How a request travels: client, DNS, server', 'What happens between typing an address and seeing a page.', 'fundamentals', 'beginner', 6,
      'A browser first asks DNS to turn a name into an IP address, then opens a connection to that address and sends an HTTP request. The server builds a response and sends it back over the same connection.',
      'Every later topic, from load balancers to CDNs, is a way of changing one step on this path.', [box('Client'), box('DNS', 'dark'), box('Server')]],
    ['scaling-up-or-out', 'Vertical versus horizontal scaling', 'A bigger machine or more machines, and what each choice costs.', 'fundamentals', 'beginner', 7,
      'Vertical scaling means moving to a larger machine. It needs no code changes but has a ceiling and leaves a single point of failure.',
      'Horizontal scaling means adding machines. It has no fixed ceiling and tolerates failures, but the application must cope with requests landing on different servers.', [box('1 big'), box('or', 'dark'), box('N small')]],
    ['sql-or-nosql', 'SQL or NoSQL: how to choose a database', 'Start from the queries you need, not from the label.', 'databases', 'beginner', 11,
      'Relational databases give you joins, transactions and a fixed schema. They fit data with many relationships and queries you cannot fully predict.',
      'Key-value, document and wide-column stores give up some of that for easier horizontal scaling. They fit known access patterns at large volume.', [box('Query'), box('SQL', 'dark'), box('NoSQL', 'accent')]],
    ['cdns', 'CDNs and serving static content close to users', 'Why distance matters and how edge caches shorten it.', 'networking', 'beginner', 7,
      'A CDN keeps copies of your files on servers in many regions. A user is served from the nearest one, which cuts the round trip.',
      'The origin server only sees a request when an edge copy is missing or expired, so a CDN also takes load off your own servers.', [box('User'), box('Edge', 'accent'), box('Origin')]],
    ['capacity-estimates', 'Back-of-the-envelope capacity estimates', 'Rough numbers that tell you which design is even plausible.', 'fundamentals', 'beginner', 9,
      'Start from users and actions per day, convert to requests per second, and multiply by the size of each item to get storage and bandwidth.',
      'The goal is the right order of magnitude. Knowing whether you need one server or a hundred changes the design; the exact figure does not.', [box('Users'), box('× rate', 'dark'), box('QPS')]],
    ['replication-basics', 'Replication basics', 'Copies of your data on more than one machine, and who is allowed to write.', 'databases', 'intermediate', 9,
      'Replication keeps the same data on several machines so that reads can be spread out and a failure does not lose data.',
      'In the common single-leader setup, one node accepts writes and the others copy them. Multi-leader and leaderless designs accept writes in several places and must resolve conflicts.', [box('Leader', 'dark'), stack(['Follower'], ['Follower'])]],
    ['consistency-models', 'Consistency models: strong, eventual and in between', 'What a read is allowed to return after a write.', 'consistency', 'intermediate', 12,
      'Strong consistency means every read sees the latest write. Eventual consistency means replicas agree only after writes stop for a while.',
      'In between sit guarantees such as read-your-writes and monotonic reads, which are often enough for users and much cheaper to provide.', [box('Write'), box('Replicas', 'dark'), box('Read')]],
    ['cap-theorem', 'The CAP theorem, one partition at a time', 'What you actually have to choose, and when.', 'consistency', 'intermediate', 10,
      'When a network partition splits a system, each side must either refuse some requests to stay consistent or answer with possibly stale data to stay available.',
      'The choice only arises during a partition. The rest of the time a system can be both consistent and available.', [box('Node A'), box('✕', 'dark'), box('Node B')]],
    ['indexes', 'Indexes: how a database finds a row fast', 'The structure behind a quick lookup, and its price on writes.', 'databases', 'intermediate', 10,
      'Without an index a query scans every row. An index is a sorted structure, usually a B-tree, that leads straight to the matching rows.',
      'Every index must be updated on each write, so indexes speed up reads at the cost of slower writes and more storage.', [box('Query'), box('Index', 'accent'), box('Row')]],
    ['hot-partitions', 'Hot partitions and how to cool them', 'When one shard gets most of the traffic.', 'databases', 'intermediate', 9,
      'A hot partition is a shard that receives far more requests than the others, usually because a few keys are much more popular than the rest.',
      'Common remedies are splitting the hot shard, adding a random suffix to the hottest keys to spread them, and caching the hottest items.', [box('Router'), stack(['Shard 1', 'accent'], ['Shard 2'])]],
    ['chat-service', 'Design a chat service', 'Persistent connections, ordering and delivery to offline users.', 'case-studies', 'advanced', 20,
      'Chat needs messages pushed to the recipient without polling, so clients keep a long-lived connection such as a WebSocket to a gateway server.',
      'The hard parts are routing a message to whichever gateway holds the recipient, keeping messages in order within a conversation, and storing them for users who are offline.', [box('Client'), box('Gateway', 'dark'), box('Client')]],
    ['news-feed', 'Design a news feed', 'Fan-out on write, fan-out on read, and the celebrity problem.', 'case-studies', 'advanced', 19,
      'A feed can be built when a post is written, by copying it into every follower\'s feed, or when the feed is read, by collecting recent posts from everyone the reader follows.',
      'Writing ahead makes reads fast but is expensive for accounts with millions of followers, so many designs mix the two.', [box('Post'), box('Fan-out', 'dark'), box('Feeds')]],
    ['rate-limiter', 'Design a rate limiter', 'Token buckets, sliding windows and where to keep the counters.', 'case-studies', 'advanced', 15,
      'A rate limiter caps how many requests a client may make in a period. A token bucket refills at a fixed rate and lets short bursts through; a sliding window counts requests over the last interval.',
      'With several servers the counters must be shared, typically in a fast in-memory store, or each server would enforce the limit separately.', [box('Request'), box('Limiter', 'accent'), box('API')]],
    ['notification-service', 'Design a notification service', 'Many channels, retries and not sending the same alert twice.', 'case-studies', 'advanced', 16,
      'A notification service accepts events and delivers them by push, email or SMS through outside providers that can be slow or fail.',
      'Queues between each stage absorb spikes and allow retries, and a record of what has been sent prevents duplicates when a retry succeeds late.', [box('Event'), box('Queue', 'dark'), box('Channel')]],
    ['file-storage', 'Design a file storage service', 'Chunking, metadata and syncing changes between devices.', 'case-studies', 'advanced', 18,
      'Large files are split into chunks stored in object storage, while a separate metadata database records which chunks make up each file version.',
      'Splitting lets a client upload only the chunks that changed and resume an interrupted upload where it stopped.', [box('File'), box('Chunks', 'dark'), box('Store')]],
  ]
  for (const [slug, title, dek, topic, level, min, p1, p2, cover] of starters) {
    await add({ slug, title, dek, topic, level, min, cover, body: [text(p1, p2)] })
  }

  const pathRows: [string, string, 'beginner' | 'intermediate' | 'advanced', string, string, string[]][] = [
    ['Foundations', 'foundations', 'beginner',
      'Clients and servers, DNS, load balancers, caches and the two families of databases.',
      'The parts every system is built from, and the vocabulary you need for everything after.',
      ['request-path', 'scaling-up-or-out', 'load-balancers', 'cache-strategies', 'sql-or-nosql', 'cdns', 'capacity-estimates']],
    ['Scaling data', 'scaling-data', 'intermediate',
      'Replication, sharding, consistent hashing, consistency models and message queues.',
      'Replication, sharding, consistent hashing, consistency models and message queues.',
      ['replication-basics', 'shard-key', 'consistent-hashing', 'replication-lag', 'message-queues', 'consistency-models', 'cap-theorem', 'indexes', 'hot-partitions']],
    ['Design case studies', 'design-case-studies', 'advanced',
      'Worked designs: a URL shortener, a chat service, a news feed and a rate limiter.',
      'Worked designs: a URL shortener, a chat service, a news feed and a rate limiter.',
      ['url-shortener', 'chat-service', 'news-feed', 'rate-limiter', 'notification-service', 'file-storage']],
  ]
  for (const [i, [title, slug, level, cardText, description, slugs]] of pathRows.entries()) {
    await payload.create({
      collection: 'paths',
      data: { title, slug, level, order: i, cardText, description, articles: slugs.map((s) => ids[s]) } as never,
    })
  }

  // The demo learner has read the first three Foundations articles and the first two of Scaling data.
  for (const s of ['request-path', 'scaling-up-or-out', 'load-balancers', 'replication-basics', 'shard-key']) {
    await payload.create({
      collection: 'progress',
      data: { learner: learner.id, article: ids[s], read: true, saved: false } as never,
    })
  }

  payload.logger.info('Seeded: 22 articles, 3 learning paths, 10 topics, 1 admin, 1 demo learner.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
