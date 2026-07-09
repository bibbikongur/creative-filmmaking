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
    signoff: 'Bestu kveðjur,\nCreative Filmmaking',
  },
} as const

const portalUrl = (locale: LocaleCode, path = '') => {
  const base = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  return `${base}${locale === 'en' ? '/en' : ''}/portal${path}`
}

async function send(to: string, subject: string, lines: string[]) {
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
