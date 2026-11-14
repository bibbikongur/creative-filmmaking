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
  const raw = await readBody<ContactPayload>(event).catch(() => null)
  if (!raw || typeof raw !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid submission' })
  }

  // Honeypot filled → a bot. Pretend success so it doesn't adapt.
  if (raw.website) {
    return { ok: true }
  }

  // One-line text fields: strings only, control characters out, length capped.
  const line = (v: unknown, max: number) =>
    // eslint-disable-next-line no-control-regex
    typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, max) : ''
  const body = {
    phone: line(raw.phone, 60),
    company: line(raw.company, 200),
    dates: line(raw.dates, 200),
    vehicle: line(raw.vehicle, 200),
  }
  const name = line(raw.name, 201)
  const email = line(raw.email, 201)
  const message = typeof raw.message === 'string' ? raw.message.trim() : ''

  if (!name || !email || !message || !EMAIL_RE.test(email) || email.length > 200 || message.length > 5000 || name.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid submission' })
  }

  const ip = getClientIp(event)
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const vehicle = body.vehicle?.trim() || 'General inquiry'
  const lines = [
    `Name:       ${name}`,
    `Email:      ${email}`,
    `Phone:      ${body.phone?.trim() || '–'}`,
    `Company:    ${body.company?.trim() || '–'}`,
    `Dates:      ${body.dates?.trim() || '–'}`,
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
      replyTo: { name, address: email },
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
