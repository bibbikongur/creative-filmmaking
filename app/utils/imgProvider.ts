// Admin-uploaded photos live outside public/ and are served by a runtime
// route, so IPX can't optimize them — render those with the custom provider
// that resizes through that route (app/providers/uploads.ts). Public /images
// files keep the default provider.
export const imgProvider = (src?: string): string | undefined =>
  src?.startsWith('/uploads/') ? 'uploads' : undefined
