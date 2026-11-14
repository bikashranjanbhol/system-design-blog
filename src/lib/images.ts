import sharp from 'sharp'
import { publicHost } from './oauth'

/** Turns what an assistant sent (SVG markup, a web address, or base64 data) into a checked image file. */

export type ImageFile = { data: Buffer; mimetype: string; ext: string }

const MAX_BYTES = 4 * 1024 * 1024
const MAX_SVG_BYTES = 500 * 1024
const RASTER: Record<string, { mimetype: string; ext: string }> = {
  png: { mimetype: 'image/png', ext: 'png' },
  jpeg: { mimetype: 'image/jpeg', ext: 'jpg' },
  webp: { mimetype: 'image/webp', ext: 'webp' },
  gif: { mimetype: 'image/gif', ext: 'gif' },
}

export class ImageError extends Error {}

/** SVG can carry scripts and outside references. Anything of that kind is refused rather than cleaned. */
function checkedSvg(markup: string): ImageFile {
  const svg = markup.trim().replace(/^<\?xml[^>]*\?>\s*/i, '').replace(/^<!DOCTYPE[^>]*>\s*/i, '')
  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) throw new ImageError('The SVG must start with <svg and end with </svg>.')
  if (Buffer.byteLength(svg) > MAX_SVG_BYTES) throw new ImageError('The SVG is larger than 500 KB.')
  if (/<\s*(script|foreignObject|iframe|object|embed|use|image|style)\b/i.test(svg))
    throw new ImageError('The SVG may not contain script, style, foreignObject, image, use, iframe, object or embed elements. Use plain shapes and text with inline attributes.')
  if (/\son[a-z]+\s*=/i.test(svg)) throw new ImageError('The SVG may not contain event handlers such as onclick.')
  if (/(href|src)\s*=\s*["']\s*(?!#)/i.test(svg) || /javascript:|data:/i.test(svg) || /url\(\s*["']?\s*(?!#)/i.test(svg))
    throw new ImageError('The SVG may not link to anything outside itself.')
  const withNs = /xmlns=/.test(svg) ? svg : svg.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  return { data: Buffer.from(withNs, 'utf8'), mimetype: 'image/svg+xml', ext: 'svg' }
}

async function checkedRaster(data: Buffer): Promise<ImageFile> {
  if (data.length > MAX_BYTES) throw new ImageError('The image is larger than 4 MB.')
  let format: string | undefined
  try {
    format = (await sharp(data).metadata()).format
  } catch {
    throw new ImageError('That data is not a readable image.')
  }
  const kind = format ? RASTER[format] : undefined
  if (!kind) throw new ImageError('Only PNG, JPEG, WebP, GIF and SVG images are accepted.')
  return { data, ...kind }
}

async function download(address: string): Promise<Buffer> {
  let url: URL
  try {
    url = new URL(address)
  } catch {
    throw new ImageError('imageUrl is not a valid web address.')
  }
  // Redirects are followed by hand so every hop is checked, not just the first.
  for (let hop = 0; hop < 4; hop++) {
    if (url.protocol !== 'https:' || !publicHost(url.hostname)) throw new ImageError('imageUrl must be a public https address.')
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10000) })
    const next = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && next) {
      url = new URL(next, url)
      continue
    }
    if (!res.ok) throw new ImageError(`The image address answered ${res.status}. It may need a sign-in, which the blog does not have.`)
    if (Number(res.headers.get('content-length') || 0) > MAX_BYTES) throw new ImageError('The image is larger than 4 MB.')
    const data = Buffer.from(await res.arrayBuffer())
    if (data.length > MAX_BYTES) throw new ImageError('The image is larger than 4 MB.')
    return data
  }
  throw new ImageError('The image address redirected too many times.')
}

const looksLikeSvg = (data: Buffer) => /^\s*(<\?xml[^>]*\?>\s*)?(<!DOCTYPE[^>]*>\s*)?<svg[\s>]/i.test(data.subarray(0, 600).toString('utf8'))

export async function readImage(input: { svg?: string; imageUrl?: string; imageBase64?: string }): Promise<ImageFile> {
  const given = [input.svg, input.imageUrl, input.imageBase64].filter(Boolean).length
  if (given !== 1) throw new ImageError('Pass exactly one of svg, imageUrl or imageBase64.')
  if (input.svg) return checkedSvg(input.svg)
  const data = input.imageUrl
    ? await download(input.imageUrl)
    : Buffer.from(input.imageBase64!.replace(/^data:[^,]*,/, '').replace(/\s+/g, ''), 'base64')
  if (!data.length) throw new ImageError('The image data is empty.')
  return looksLikeSvg(data) ? checkedSvg(data.toString('utf8')) : checkedRaster(data)
}
