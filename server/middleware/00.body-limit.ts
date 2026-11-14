// Caps request body size for the API. h3's readBody / readMultipartFormData
// buffer the whole body in memory with no limit of their own, and the size
// checks in the upload handlers only run after that. Without this, a handful
// of multi-gigabyte requests (to the public contact form, even) could exhaust
// the container's memory.
//
// Two layers: a declared Content-Length over the limit is refused up front
// (413), and the bytes actually received are counted as they stream in, which
// also covers chunked requests that declare no length.

const MB = 1024 * 1024
const DEFAULT_LIMIT = 2 * MB

// Routes that legitimately take large bodies. Each limit sits a little above
// the handler's own file-size cap to leave room for multipart overhead.
const LIMITS: { pattern: RegExp, bytes: number }[] = [
  { pattern: /^\/api\/admin\/upload\/?$/, bytes: 11 * MB },
  { pattern: /^\/api\/portal\/tools\/location-albums\/[^/]+\/photos\/?$/, bytes: 24 * MB },
  { pattern: /^\/api\/portal\/tools\/location-maps(\/|$)/, bytes: 26 * MB },
  { pattern: /^\/api\/portal\/tools\/recce-plans(\/|$)/, bytes: 21 * MB },
  { pattern: /^\/api\/portal\/jobs\/[^/]+\/purchase-orders(\/|$)/, bytes: 11 * MB },
  { pattern: /^\/api\/portal\/jobs\/[^/]+\/doc-templates\/[^/]+\/?$/, bytes: 16 * MB },
]

export default defineEventHandler((event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return
  const path = event.path.split('?')[0] ?? ''
  if (!path.startsWith('/api/')) return

  const limit = LIMITS.find(l => l.pattern.test(path))?.bytes ?? DEFAULT_LIMIT

  const declared = Number(getRequestHeader(event, 'content-length'))
  if (Number.isFinite(declared) && declared > limit) {
    throw createError({ statusCode: 413, statusMessage: 'Request body is too large.' })
  }

  // Count what really arrives. Wrapping emit observes the stream without
  // consuming it or switching it into flowing mode, so body readers further
  // down are unaffected.
  const req = event.node?.req
  if (!req) return
  let received = 0
  let tripped = false
  const emit = req.emit
  req.emit = function (this: typeof req, type: string | symbol, ...args: unknown[]) {
    if (type === 'data') {
      if (tripped) return false // drop everything after the limit: nothing more is buffered
      const chunk = args[0] as { length?: number } | undefined
      received += chunk?.length ?? 0
      if (received > limit) {
        tripped = true
        if (req.listenerCount('error') > 0) {
          // A handler is reading the body: fail that read so it answers 413,
          // then cut the connection once the response has had time to go out.
          if (!event.node.res.headersSent) event.node.res.setHeader('connection', 'close')
          emit.call(this, 'error', createError({ statusCode: 413, statusMessage: 'Request body is too large.' }))
          setTimeout(() => req.destroy(), 2000).unref()
        }
        else {
          req.destroy()
        }
        return false
      }
    }
    return emit.call(this, type, ...args)
  } as typeof req.emit
})
