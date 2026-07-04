// Admin-uploaded photos live outside public/ and are served by a runtime
// route, so IPX can't optimize them — render those with the pass-through
// provider. Unsplash/public images keep the default provider.
export const imgProvider = (src?: string): string | undefined =>
  src?.startsWith('/uploads/') ? 'none' : undefined
