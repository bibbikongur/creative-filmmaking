import type { ContactPayload } from '~/types'

// Cheap in-memory rate limit — resets on deploy/restart, which is fine for a
// low-traffic contact form. 5 submissions per IP per minute.
const hits = new Map<string, { count: number, windowStart: number }>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5

const isRateLimited = (ip: string) => {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now })
    return false
  }
  entry.count++
  return entry.count > MAX_PER_WINDOW
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody<ContactPayload>(event)

  // Honeypot filled → a bot. Pretend success so it doesn't adapt.
  if (body.website) {
    return { ok: true }
  }

  const name = body.name?.trim()
  const email = body.email?.trim()
  const message = body.message?.trim()

  if (!name || !email || !message || !EMAIL_RE.test(email) || message.length > 5000 || name.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid submission' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const vehicle = body.vehicle?.trim() || 'General inquiry'
  const lines = [
    `Name:       ${name}`,
    `Email:      ${email}`,
    `Phone:      ${body.phone?.trim() || '—'}`,
    `Company:    ${body.company?.trim() || '—'}`,
    `Dates:      ${body.dates?.trim() || '—'}`,
    `Vehicle:    ${vehicle}`,
    '',
    'Message:',
    message,
  ].join('\n')

  const mailer = getMailer()

  if (!mailer.isConfigured) {
    if (import.meta.dev) {
      // No SMTP in dev — log the lead so the flow is testable end to end.
      console.log('[contact] SMTP not configured — submission:\n' + lines)
      return { ok: true }
    }
    console.error('[contact] SMTP is not configured in production — set NUXT_SMTP_* and NUXT_CONTACT_TO')
    throw createError({ statusCode: 503, statusMessage: 'Mail service unavailable' })
  }

  try {
    await mailer.createTransport().sendMail({
      from: `"Creative Filmmaking" <${mailer.fromAddress}>`,
      to: mailer.contactTo,
      replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
      subject: `[Creative Filmmaking] Offer request: ${vehicle}`,
      text: lines,
    })
  }
  catch (error) {
    console.error('[contact] Failed to send email:', error)
    throw createError({ statusCode: 502, statusMessage: 'Failed to send message' })
  }

  return { ok: true }
})
