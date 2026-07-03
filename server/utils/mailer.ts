import nodemailer from 'nodemailer'

// SMTP transport built from runtime config (NUXT_SMTP_* env vars on Railway).
// isConfigured lets the contact route degrade gracefully when unset.
export const getMailer = () => {
  const config = useRuntimeConfig()

  const isConfigured = Boolean(config.smtpHost && config.contactTo)

  const createTransport = () => {
    const port = Number(config.smtpPort) || 587
    return nodemailer.createTransport({
      host: config.smtpHost,
      port,
      secure: port === 465,
      auth: config.smtpUser
        ? { user: config.smtpUser, pass: config.smtpPass }
        : undefined,
    })
  }

  return { isConfigured, createTransport, contactTo: config.contactTo, smtpUser: config.smtpUser }
}
