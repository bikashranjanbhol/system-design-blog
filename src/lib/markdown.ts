/**
 * Converts between Markdown and the article body blocks used by the editing panel.
 * Supported Markdown: headings, paragraphs, bold, italic, inline code, links, bullet and
 * numbered lists, fenced code, tables and quote blocks (which become callouts).
 */
import type { Article } from '@/payload-types'

type Blocks = NonNullable<Article['body']>
type Node = Record<string, unknown>

const BOLD = 1
const ITALIC = 2
const CODE = 16

const textNode = (text: string, format = 0): Node => ({ type: 'text', text, format, detail: 0, mode: 'normal', style: '', version: 1 })

/** Inline Markdown to Lexical nodes. */
export function inline(src: string): Node[] {
  const out: Node[] = []
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\))/g
  let last = 0
  for (const m of src.matchAll(re)) {
    if (m.index! > last) out.push(textNode(src.slice(last, m.index)))
    const t = m[0]
    if (m[1]) out.push(textNode(t.slice(1, -1), CODE))
    else if (m[2]) out.push(textNode(t.slice(2, -2), BOLD))
    else if (m[3]) out.push(textNode(t.slice(1, -1), ITALIC))
    else {
      const [, label, url] = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!
      out.push({
        type: 'link',
        version: 3,
        fields: { linkType: 'custom', newTab: false, url },
        children: [textNode(label)],
        direction: 'ltr',
        format: '',
        indent: 0,
      })
    }
    last = m.index! + t.length
  }
  if (last < src.length) out.push(textNode(src.slice(last)))
  return out
}

const paragraph = (src: string): Node => ({
  type: 'paragraph', children: inline(src), direction: 'ltr', format: '', indent: 0, textFormat: 0, textStyle: '', version: 1,
})

const list = (items: string[], ordered: boolean): Node => ({
  type: 'list',
  listType: ordered ? 'number' : 'bullet',
  tag: ordered ? 'ol' : 'ul',
  start: 1,
  children: items.map((it, i) => ({ type: 'listitem', value: i + 1, children: inline(it), direction: 'ltr', format: '', indent: 0, version: 1 })),
  direction: 'ltr', format: '', indent: 0, version: 1,
})

const rich = (children: Node[]) => ({ root: { type: 'root', children, direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 } })

const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim())

export function markdownToBlocks(md: string, title?: string): Blocks {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: unknown[] = []
  let textNodes: Node[] = []
  const flush = () => {
    if (textNodes.length) blocks.push({ blockType: 'text', content: rich(textNodes) })
    textNodes = []
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]!
    if (!line.trim()) { i++; continue }

    const fence = /^```/.exec(line)
    if (fence) {
      const code: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i]!)) code.push(lines[i++]!)
      i++
      flush()
      blocks.push({ blockType: 'code', code: code.join('\n') })
      continue
    }

    // An image already stored on the blog, written as ![caption](media:ID).
    const img = /^!\[(.*?)\]\(media:(\d+)\)\s*$/.exec(line.trim())
    if (img) {
      i++
      flush()
      blocks.push({ blockType: 'figure', image: Number(img[2]), ...(img[1] ? { caption: img[1] } : {}) })
      continue
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) {
      i++
      const text = h[2]!.replace(/[*`]/g, '').trim()
      // A top-level heading that repeats the title is dropped; the page already shows the title.
      if (h[1] === '#' && title && text.toLowerCase() === title.trim().toLowerCase()) continue
      flush()
      blocks.push({ blockType: 'heading', text })
      continue
    }

    if (/^\|/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1]!)) {
      const headers = cells(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\|/.test(lines[i]!)) rows.push(cells(lines[i++]!))
      flush()
      blocks.push({
        blockType: 'table',
        headers: headers.map((label) => ({ label })),
        rows: rows.map((r) => ({ cells: r.map((value) => ({ value })) })),
      })
      continue
    }

    if (/^>/.test(line)) {
      const quote: string[] = []
      while (i < lines.length && /^>/.test(lines[i]!)) quote.push(lines[i++]!.replace(/^>\s?/, ''))
      const joined = quote.join(' ').trim()
      const labelled = /^\*\*([^*]+?):?\*\*:?\s*(.*)$/.exec(joined)
      flush()
      blocks.push({ blockType: 'callout', label: labelled ? labelled[1] : 'Note', text: (labelled ? labelled[2]! : joined).replace(/[*`]/g, '') })
      continue
    }

    const bullet = /^\s*[-*+]\s+/
    const numbered = /^\s*\d+[.)]\s+/
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line)
      const marker = ordered ? numbered : bullet
      const items: string[] = []
      while (i < lines.length && marker.test(lines[i]!)) items.push(lines[i++]!.replace(marker, '').trim())
      textNodes.push(list(items, ordered))
      continue
    }

    const para: string[] = []
    while (i < lines.length && lines[i]!.trim() && !/^(```|#{1,6}\s|>|\|)/.test(lines[i]!) && !bullet.test(lines[i]!) && !numbered.test(lines[i]!)) {
      para.push(lines[i++]!.trim())
    }
    textNodes.push(paragraph(para.join(' ')))
  }
  flush()
  return blocks as Blocks
}

const inlineToMd = (nodes: Node[] = []): string =>
  nodes
    .map((n) => {
      if (n.type === 'link') return `[${inlineToMd(n.children as Node[])}](${(n.fields as { url?: string })?.url || ''})`
      const t = String(n.text ?? '')
      const f = Number(n.format ?? 0)
      if (f & CODE) return `\`${t}\``
      if (f & BOLD) return `**${t}**`
      if (f & ITALIC) return `*${t}*`
      return t
    })
    .join('')

export function blocksToMarkdown(blocks: Blocks | null | undefined): string {
  const out: string[] = []
  for (const b of blocks || []) {
    switch (b.blockType) {
      case 'heading': out.push(`## ${b.text}`); break
      case 'code': out.push('```\n' + b.code + '\n```'); break
      case 'callout': out.push(`> **${b.label || 'Note'}:** ${b.text}`); break
      case 'table':
        out.push([
          `| ${(b.headers || []).map((h) => h.label).join(' | ')} |`,
          `| ${(b.headers || []).map(() => '---').join(' | ')} |`,
          ...(b.rows || []).map((r) => `| ${(r.cells || []).map((c) => c.value).join(' | ')} |`),
        ].join('\n'))
        break
      case 'text':
        for (const n of ((b.content as { root?: { children?: Node[] } })?.root?.children || [])) {
          if (n.type === 'list') {
            out.push(((n.children as Node[]) || []).map((li, i) => `${n.listType === 'number' ? `${i + 1}.` : '-'} ${inlineToMd(li.children as Node[])}`).join('\n'))
          } else out.push(inlineToMd(n.children as Node[]))
        }
        break
      case 'figure': {
        const id = b.image && typeof b.image === 'object' ? b.image.id : b.image
        out.push(`![${(b.caption || '').replace(/[\[\]\n]/g, ' ')}](media:${id})`)
        break
      }
      case 'lineDiagram': out.push(`[diagram: ${b.caption || b.alt}]`); break
    }
  }
  return out.join('\n\n')
}
