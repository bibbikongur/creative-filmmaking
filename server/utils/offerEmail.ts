import type { Offer, Quote } from '~~/app/types'

// Customer-facing offer email — plain text in the customer's language with
// the PDF attached. replyTo (and bcc) go to the owner's inbox so acceptance
// replies land there and the owner keeps a copy of what was sent.

const STRINGS = {
  en: {
    subject: (q: Quote) => `Your offer from Creative Filmmaking${q.company || q.name ? ` - ${q.company || q.name}` : ''}`,
    greeting: (q: Quote) => q.name ? `Hi ${q.name},` : 'Hello,',
    body: () => [
      'Attached is an offer from Creative Filmmaking for the requested filming equipment.',
      '',
      'To accept the offer, or to discuss dates, equipment or anything else, simply reply to this email.',
    ],
    signoff: 'Best regards,',
    filename: (q: Quote) => `creative-filmmaking-offer-${q.id}.pdf`,
  },
  is: {
    subject: (q: Quote) => `Tilboð frá Creative Filmmaking${q.company || q.name ? ` - ${q.company || q.name}` : ''}`,
    greeting: (q: Quote) => q.name ? `Sæl/l ${q.name},` : 'Góðan dag,',
    body: () => [
      'Meðfylgjandi er tilboð frá Creative Filmmaking í tökubúnað sem hefur verið beðið um.',
      '',
      'Til að samþykkja tilboðið eða ræða dagsetningar, búnað eða annað þá er nóg að svara þessum tölvupósti.',
    ],
    signoff: 'Bestu kveðjur,',
    filename: (q: Quote) => `creative-filmmaking-tilbod-${q.id}.pdf`,
  },
} as const

export async function sendOfferEmail(quote: Quote, offer: Offer, pdf: Buffer) {
  const s = STRINGS[quote.locale]
  const contact = useRuntimeConfig().public.contact as { address: string, phone: string, email: string }

  const mailer = getMailer()
  if (!mailer.isConfigured) {
    if (import.meta.dev) {
      console.log(`[offer] SMTP not configured — offer #${offer.id} for ${quote.id} would go to ${quote.email} (${pdf.length} byte PDF)`)
      return
    }
    throw createError({ statusCode: 503, statusMessage: 'Mail service is not configured: set NUXT_SMTP_* and NUXT_CONTACT_TO' })
  }

  const text = [
    s.greeting(quote),
    '',
    ...s.body(),
    '',
    '',
    s.signoff,
    'Creative Filmmaking',
    contact.phone,
    contact.email,
  ].join('\n')

  // HTML alternative — plain-text newlines render cramped in most mail
  // clients, so real paragraphs with margins carry the spacing.
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const paragraphs = [s.greeting(quote), ...s.body().filter(Boolean)]
  const html = [
    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1f;">',
    ...paragraphs.map(p => `<p style="margin: 0 0 20px;">${esc(p)}</p>`),
    `<p style="margin: 32px 0 0;">${esc(s.signoff)}<br>Creative Filmmaking<br>${esc(contact.phone)}<br><a href="mailto:${contact.email}" style="color: #a87a1f;">${esc(contact.email)}</a></p>`,
    '</div>',
  ].join('\n')

  // Owner copies: the notification inbox plus the business address.
  const copies = [...new Set([mailer.contactTo, contact.email].filter(Boolean))]

  await mailer.createTransport().sendMail({
    from: `"Creative Filmmaking" <${mailer.fromAddress}>`,
    to: quote.email,
    replyTo: mailer.contactTo,
    bcc: copies,
    subject: s.subject(quote),
    text,
    html,
    attachments: [{ filename: s.filename(quote), content: pdf, contentType: 'application/pdf' }],
  })
}
