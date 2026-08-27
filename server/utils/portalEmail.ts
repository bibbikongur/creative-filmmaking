import type { LocaleCode } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// Timesheet-portal emails: invites (set a password), added-to-job notices,
// alteration notices and password resets. Plain text, in the recipient's
// language. When SMTP is unset in dev the link is logged instead of sent so
// the flow stays testable.
// ─────────────────────────────────────────────────────────────────────────────

const STRINGS = {
  en: {
    inviteSubject: (company: string) => `You've been invited to the ${company} timesheet portal`,
    inviteBodyAdmin: (company: string) =>
      `You have been set up as the administrator of ${company} on the Creative Filmmaking timesheet portal. Create your password with the link below to manage jobs, staff and timesheets.`,
    inviteBodyEmployee: (company: string, job: string) =>
      `${company} has added you to the job "${job}" on the Creative Filmmaking timesheet portal. Create your password with the link below to start registering your hours.`,
    inviteAction: 'Set your password (link is valid for 7 days):',
    addedSubject: (job: string) => `You've been added to the job "${job}"`,
    addedBody: (company: string, job: string) =>
      `${company} has added you to the job "${job}". It is now available in your timesheet portal.`,
    addedAction: 'Open the portal:',
    alteredSubject: (week: string) => `Your timesheet for the week of ${week} was adjusted`,
    alteredBody: (company: string, job: string, week: string) =>
      `${company} adjusted your submitted timesheet for "${job}" (week of ${week}). Please review the changes and confirm them in the portal.`,
    alteredNote: (note: string) => `Note from the reviewer: ${note}`,
    alteredAction: 'Review and confirm:',
    resetSubject: 'Reset your timesheet portal password',
    resetBody: 'A password reset was requested for your Creative Filmmaking portal account. Use the link below to choose a new password. If you did not request this, you can ignore this email.',
    resetAction: 'Reset your password (link is valid for 2 hours):',
    docKind: { contract: 'crew contract', nda: 'NDA' } as Record<'contract' | 'nda', string>,
    signRequestSubject: (kind: string, job: string) => `Signature requested: ${kind} for ${job}`,
    signRequestBody: (company: string, kind: string, job: string) =>
      `${company} has sent you the ${kind} for "${job}" to sign electronically. Open the link below to review the document and sign it.`,
    signRequestAction: 'Review and sign (link is valid for 30 days):',
    signedCopySubject: (kind: string, job: string) => `Signed: ${kind} for ${job}`,
    signedCopyBody: (kind: string, job: string, signer: string) =>
      `${signer} has signed the ${kind} for "${job}". The signed document is attached. Please keep it for your records.`,
    poSubmittedSubject: (poNo: string, job: string) => `New purchase order ${poNo} on "${job}"`,
    poSubmittedBody: (creator: string, dept: string, job: string, vendor: string, amount: string) =>
      `${creator}${dept ? ` (${dept})` : ''} logged a cost on "${job}": ${vendor}, ${amount}. It is waiting for your approval.`,
    poSubmittedAction: 'Review and approve:',
    poDecidedSubject: (poNo: string, decided: string) => `${poNo} ${decided}`,
    poDecided: { approved: 'approved', rejected: 'rejected' } as Record<'approved' | 'rejected', string>,
    poDecidedBody: (poNo: string, vendor: string, job: string, decided: string, decider: string) =>
      `Your purchase order ${poNo} (${vendor}) on "${job}" was ${decided} by ${decider}.`,
    poDecidedNote: (note: string) => `Note: ${note}`,
    poDecidedAction: 'View the order:',
    signoff: 'Best regards,\nCreative Filmmaking',
  },
  is: {
    inviteSubject: (company: string) => `Þér hefur verið boðið í tímaskráningarkerfi ${company}`,
    inviteBodyAdmin: (company: string) =>
      `Þú hefur verið skráð/ur sem umsjónaraðili ${company} í tímaskráningarkerfi Creative Filmmaking. Búðu til lykilorð með hlekknum hér fyrir neðan til að halda utan um verkefni, starfsfólk og tímaskýrslur.`,
    inviteBodyEmployee: (company: string, job: string) =>
      `${company} hefur bætt þér við verkefnið „${job}" í tímaskráningarkerfi Creative Filmmaking. Búðu til lykilorð með hlekknum hér fyrir neðan til að byrja að skrá tímana þína.`,
    inviteAction: 'Veldu lykilorð (hlekkurinn gildir í 7 daga):',
    addedSubject: (job: string) => `Þér hefur verið bætt við verkefnið „${job}"`,
    addedBody: (company: string, job: string) =>
      `${company} hefur bætt þér við verkefnið „${job}". Það er nú aðgengilegt í tímaskráningarkerfinu þínu.`,
    addedAction: 'Opna kerfið:',
    alteredSubject: (week: string) => `Tímaskýrslu þinni fyrir vikuna ${week} var breytt`,
    alteredBody: (company: string, job: string, week: string) =>
      `${company} breytti innsendri tímaskýrslu þinni fyrir „${job}" (vika ${week}). Vinsamlegast farðu yfir breytingarnar og staðfestu þær í kerfinu.`,
    alteredNote: (note: string) => `Athugasemd frá yfirferðaraðila: ${note}`,
    alteredAction: 'Yfirfara og staðfesta:',
    resetSubject: 'Endurstilla lykilorð í tímaskráningarkerfinu',
    resetBody: 'Beðið var um endurstillingu lykilorðs fyrir aðganginn þinn hjá Creative Filmmaking. Notaðu hlekkinn hér fyrir neðan til að velja nýtt lykilorð. Ef þú baðst ekki um þetta getur þú hunsað þennan póst.',
    resetAction: 'Endurstilla lykilorð (hlekkurinn gildir í 2 klst.):',
    docKind: { contract: 'ráðningarsamningur', nda: 'trúnaðaryfirlýsing' } as Record<'contract' | 'nda', string>,
    signRequestSubject: (kind: string, job: string) => `Undirritun: ${kind} fyrir ${job}`,
    signRequestBody: (company: string, kind: string, job: string) =>
      `${company} hefur sent þér ${kind} fyrir „${job}" til rafrænnar undirritunar. Opnaðu hlekkinn hér fyrir neðan til að yfirfara skjalið og undirrita.`,
    signRequestAction: 'Yfirfara og undirrita (hlekkurinn gildir í 30 daga):',
    signedCopySubject: (kind: string, job: string) => `Undirritað: ${kind} fyrir ${job}`,
    signedCopyBody: (kind: string, job: string, signer: string) =>
      `${signer} hefur undirritað ${kind} fyrir „${job}". Undirritaða skjalið fylgir með. Vinsamlegast geymdu það.`,
    poSubmittedSubject: (poNo: string, job: string) => `Ný innkaupabeiðni ${poNo} í „${job}"`,
    poSubmittedBody: (creator: string, dept: string, job: string, vendor: string, amount: string) =>
      `${creator}${dept ? ` (${dept})` : ''} skráði kostnað í „${job}": ${vendor}, ${amount}. Beiðnin bíður samþykkis þíns.`,
    poSubmittedAction: 'Yfirfara og samþykkja:',
    poDecidedSubject: (poNo: string, decided: string) => `${poNo} ${decided}`,
    poDecided: { approved: 'samþykkt', rejected: 'hafnað' } as Record<'approved' | 'rejected', string>,
    poDecidedBody: (poNo: string, vendor: string, job: string, decided: string, decider: string) =>
      `Innkaupabeiðnin þín ${poNo} (${vendor}) í „${job}" var ${decided} af ${decider}.`,
    poDecidedNote: (note: string) => `Athugasemd: ${note}`,
    poDecidedAction: 'Skoða beiðnina:',
    signoff: 'Bestu kveðjur,\nCreative Filmmaking',
  },
} as const

const portalUrl = (locale: LocaleCode, path = '') => {
  const base = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  return `${base}${locale === 'en' ? '/en' : ''}/portal${path}`
}

async function send(to: string, subject: string, lines: string[], attachment?: { filename: string, content: Buffer }) {
  const mailer = getMailer()
  const text = lines.join('\n')
  if (!mailer.isConfigured) {
    console.log(`[portal-mail] SMTP not configured — email to ${to} not sent:\n  Subject: ${subject}\n${text.split('\n').map(l => `  ${l}`).join('\n')}`)
    return
  }
  await mailer.createTransport().sendMail({
    from: `"Creative Filmmaking" <${mailer.fromAddress}>`,
    to,
    subject,
    text,
    attachments: attachment ? [attachment] : undefined,
  })
}

export async function sendPortalInviteEmail(opts: {
  email: string
  name?: string
  locale: LocaleCode
  companyName: string
  /** Set for employee invites; company-admin invites get admin copy. */
  jobName?: string
  token: string
}) {
  const s = STRINGS[opts.locale]
  const lines = opts.name ? [`${opts.name},`, ''] : []
  lines.push(
    opts.jobName ? s.inviteBodyEmployee(opts.companyName, opts.jobName) : s.inviteBodyAdmin(opts.companyName),
    '',
    s.inviteAction,
    portalUrl(opts.locale, `/invite/${opts.token}`),
    '',
    s.signoff,
  )
  await send(opts.email, s.inviteSubject(opts.companyName), lines)
}

export async function sendAddedToJobEmail(opts: {
  email: string
  locale: LocaleCode
  companyName: string
  jobName: string
}) {
  const s = STRINGS[opts.locale]
  await send(opts.email, s.addedSubject(opts.jobName), [
    s.addedBody(opts.companyName, opts.jobName),
    '',
    s.addedAction,
    portalUrl(opts.locale),
    '',
    s.signoff,
  ])
}

export async function sendAlterationEmail(opts: {
  email: string
  locale: LocaleCode
  companyName: string
  jobName: string
  weekStart: string
  note?: string
}) {
  const s = STRINGS[opts.locale]
  const lines = [
    s.alteredBody(opts.companyName, opts.jobName, opts.weekStart),
    '',
  ]
  if (opts.note) lines.push(s.alteredNote(opts.note), '')
  lines.push(s.alteredAction, portalUrl(opts.locale, '/timesheet'), '', s.signoff)
  await send(opts.email, s.alteredSubject(opts.weekStart), lines)
}

/** Ask a crew member to sign the contract/NDA via the built-in signing page. */
export async function sendSignRequestEmail(opts: {
  email: string
  name?: string
  locale: LocaleCode
  companyName: string
  jobName: string
  kind: 'contract' | 'nda'
  token: string
}) {
  const s = STRINGS[opts.locale]
  const kind = s.docKind[opts.kind]
  const lines = opts.name ? [`${opts.name},`, ''] : []
  lines.push(
    s.signRequestBody(opts.companyName, kind, opts.jobName),
    '',
    s.signRequestAction,
    portalUrl(opts.locale, `/sign/${opts.token}`),
    '',
    s.signoff,
  )
  await send(opts.email, s.signRequestSubject(kind, opts.jobName), lines)
}

/** Deliver the stamped, signed PDF to the signer and the admin who sent it. */
export async function sendSignedCopyEmail(opts: {
  email: string
  locale: LocaleCode
  jobName: string
  kind: 'contract' | 'nda'
  signerName: string
  pdf: Buffer
  fileName: string
}) {
  const s = STRINGS[opts.locale]
  const kind = s.docKind[opts.kind]
  await send(opts.email, s.signedCopySubject(kind, opts.jobName), [
    s.signedCopyBody(kind, opts.jobName, opts.signerName),
    '',
    s.signoff,
  ], { filename: opts.fileName, content: opts.pdf })
}

/** Tell a job's company admins that a department head logged a cost. */
export async function sendPoSubmittedEmail(opts: {
  email: string
  locale: LocaleCode
  jobId: string
  jobName: string
  poNo: string
  vendor: string
  /** Pre-formatted, e.g. "125.000 kr." */
  amountText: string
  creatorName: string
  departmentName?: string
}) {
  const s = STRINGS[opts.locale]
  await send(opts.email, s.poSubmittedSubject(opts.poNo, opts.jobName), [
    s.poSubmittedBody(opts.creatorName, opts.departmentName ?? '', opts.jobName, opts.vendor, opts.amountText),
    '',
    s.poSubmittedAction,
    portalUrl(opts.locale, `/tools/purchase-orders?job=${opts.jobId}&focus=approve`),
    '',
    s.signoff,
  ])
}

/** Tell the creator their purchase order was approved or rejected. */
export async function sendPoDecidedEmail(opts: {
  email: string
  locale: LocaleCode
  jobId: string
  jobName: string
  poNo: string
  vendor: string
  status: 'approved' | 'rejected'
  deciderName: string
  note?: string
}) {
  const s = STRINGS[opts.locale]
  const decided = s.poDecided[opts.status]
  const lines = [
    s.poDecidedBody(opts.poNo, opts.vendor, opts.jobName, decided, opts.deciderName),
    '',
  ]
  if (opts.note) lines.push(s.poDecidedNote(opts.note), '')
  lines.push(s.poDecidedAction, portalUrl(opts.locale, `/tools/purchase-orders?job=${opts.jobId}&focus=list`), '', s.signoff)
  await send(opts.email, s.poDecidedSubject(opts.poNo, decided), lines)
}

export async function sendPasswordResetEmail(opts: { email: string, locale: LocaleCode, token: string }) {
  const s = STRINGS[opts.locale]
  await send(opts.email, s.resetSubject, [
    s.resetBody,
    '',
    s.resetAction,
    portalUrl(opts.locale, `/reset/${opts.token}`),
    '',
    s.signoff,
  ])
}
