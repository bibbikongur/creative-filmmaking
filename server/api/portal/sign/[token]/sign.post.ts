import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

const isRateLimited = makeRateLimiter(60_000, 10)
const MAX_SIGNATURE_BYTES = 300 * 1024 // ~300 KB PNG from the canvas

// The crew member signs: typed full name + drawn signature. The template is
// stamped with their data, the signature image and an audit line, stored under
// signed-docs, and copies are emailed to the signer and the sending admin.
export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (isRateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests.' })
  }

  const req = findSigningRequest(getRouterParam(event, 'token')!)
  if (!req) {
    throw createError({ statusCode: 404, statusMessage: 'This signing link is invalid or has expired.' })
  }

  const body = await readBody<{ name?: string, signature?: string }>(event)
  const signedName = String(body?.name ?? '').trim()
  const signature = String(body?.signature ?? '')
  const errors: string[] = []
  if (signedName.length < 2 || signedName.length > 120) errors.push('Please type your full name.')
  if (!signature.startsWith('data:image/png;base64,')) errors.push('Please draw your signature.')
  if (signature.length > MAX_SIGNATURE_BYTES * 1.4) errors.push('Signature image is too large.')
  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed', data: { errors } })
  }

  const job = getJob(req.jobId)
  const member = listMembers(req.jobId).find(m => m.userId === req.userId)
  const template = getTemplate(req.jobId, req.kind)
  if (!job || !member || !template) {
    throw createError({ statusCode: 404, statusMessage: 'This signing link is invalid or has expired.' })
  }

  const pdf = await fs.readFile(templateFilePath(template.fileName)).catch(() => null)
  if (!pdf) {
    throw createError({ statusCode: 409, statusMessage: 'Document is missing. Ask for a new link.' })
  }

  const signedAt = new Date()
  const stamped = await stampSignedPdf({
    pdf,
    fields: template.fields,
    values: {
      name: member.name || member.email,
      role: member.role,
      email: member.email,
      phone: member.phone,
      dayRate: member.dayRate,
      sentDate: req.sentAt.slice(0, 10),
    },
    signaturePng: signature,
    signedName,
    signedAt,
    ip,
  })

  const fileName = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.pdf`
  mkdirSync(signedDocsDir(), { recursive: true })
  await fs.writeFile(join(signedDocsDir(), fileName), stamped)
  completeSigning(req.id, { signedName, ip, fileName })

  // Copies to the signer and the admin who sent it, in each one's language.
  const attachmentName = `${req.kind}-${job.name.replace(/[^\w-]+/g, '_')}.pdf`.toLowerCase()
  const admin = getUserById(req.sentBy)
  const sends = [
    sendSignedCopyEmail({
      email: member.email,
      locale: member.locale,
      jobName: job.name,
      kind: req.kind,
      signerName: signedName,
      pdf: stamped,
      fileName: attachmentName,
    }),
  ]
  if (admin && admin.email.toLowerCase() !== member.email.toLowerCase()) {
    sends.push(sendSignedCopyEmail({
      email: admin.email,
      locale: admin.locale,
      jobName: job.name,
      kind: req.kind,
      signerName: signedName,
      pdf: stamped,
      fileName: attachmentName,
    }))
  }
  await Promise.all(sends.map(p => p.catch(e => console.error('[portal] signed-copy email failed:', e))))

  return { ok: true }
})
