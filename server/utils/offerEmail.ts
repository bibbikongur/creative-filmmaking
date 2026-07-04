import type { Offer, Quote } from '~~/app/types'

// Customer-facing offer email — plain text in the customer's language with
// the PDF attached. replyTo (and bcc) go to the owner's inbox so acceptance
// replies land there and the owner keeps a copy of what was sent.

const STRINGS = {
  en: {
    subject: (q: Quote) => `Your offer from Creative Filmmaking — ${q.company || q.name}`,
    greeting: (q: Quote) => `Hi ${q.name},`,
    body: (o: Offer, total: string) => [
      'Thank you for your request. Our offer for the vehicles and equipment on your list is attached as a PDF.',
      '',
      `Total: ${total}${o.validUntil ? ` (valid until ${o.validUntil})` : ''}`,
      '',
      'To accept the offer — or to discuss dates, items or anything else — simply reply to this email.',
    ],
    signoff: 'Best regards,',
    filename: (q: Quote) => `creative-filmmaking-offer-${q.id}.pdf`,
  },
  is: {
    subject: (q: Quote) => `Tilboð frá Creative Filmmaking — ${q.company || q.name}`,
    greeting: (q: Quote) => `Sæl/l ${q.name},`,
    body: (o: Offer, total: string) => [
      'Takk fyrir fyrirspurnina. Tilboð okkar í bílana og búnaðinn á listanum þínum fylgir með sem PDF-skjal.',
      '',
      `Samtals: ${total}${o.validUntil ? ` (gildir til ${o.validUntil})` : ''}`,
      '',
      'Til að samþykkja tilboðið — eða ræða dagsetningar, búnað eða annað — er nóg að svara þessum tölvupósti.',
    ],
    signoff: 'Bestu kveðjur,',
    filename: (q: Quote) => `creative-filmmaking-tilbod-${q.id}.pdf`,
  },
} as const

export async function sendOfferEmail(quote: Quote, offer: Offer, pdf: Buffer) {
  const s = STRINGS[quote.locale]
  const contact = useRuntimeConfig().public.contact as { address: string, phone: string, email: string }
  const total = formatMoney(offer.total, offer.currency, quote.locale)

  const mailer = getMailer()
  if (!mailer.isConfigured) {
    if (import.meta.dev) {
      console.log(`[offer] SMTP not configured — offer #${offer.id} for ${quote.id} would go to ${quote.email} (${pdf.length} byte PDF)`)
      return
    }
    throw createError({ statusCode: 503, statusMessage: 'Mail service is not configured — set NUXT_SMTP_* and NUXT_CONTACT_TO' })
  }

  const text = [
    s.greeting(quote),
    '',
    ...s.body(offer, total),
    '',
    s.signoff,
    'Creative Filmmaking',
    contact.phone,
    contact.email,
  ].join('\n')

  await mailer.createTransport().sendMail({
    from: `"Creative Filmmaking" <${mailer.fromAddress}>`,
    to: quote.email,
    replyTo: mailer.contactTo,
    bcc: mailer.contactTo,
    subject: s.subject(quote),
    text,
    attachments: [{ filename: s.filename(quote), content: pdf, contentType: 'application/pdf' }],
  })
}
