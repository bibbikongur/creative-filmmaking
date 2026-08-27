import { beforeAll, describe, expect, it } from 'vitest'

beforeAll(() => {
  (globalThis as any).useRuntimeConfig = () => ({});
  (globalThis as any).createError = (opts: any) => Object.assign(new Error(opts.statusMessage), opts)
})

describe('PORTAL_TOOL_SLUGS', () => {
  it('stays in sync with the client tool registry', async () => {
    const { PORTAL_TOOL_SLUGS } = await import('../server/utils/toolAccessStore')
    const { portalTools } = await import('../app/composables/usePortalTools')
    expect([...PORTAL_TOOL_SLUGS].sort()).toEqual(portalTools.map(t => t.slug).sort())
  })
})

describe('sanitizeToolSlugs', () => {
  it('accepts known slugs and returns them in registry order, deduped', async () => {
    const { sanitizeToolSlugs, PORTAL_TOOL_SLUGS } = await import('../server/utils/toolAccessStore')
    expect(sanitizeToolSlugs(['recce-plan', 'pdf-merge', 'recce-plan']))
      .toEqual(['pdf-merge', 'recce-plan'])
    expect(sanitizeToolSlugs([...PORTAL_TOOL_SLUGS].reverse())).toEqual([...PORTAL_TOOL_SLUGS])
  })

  it('accepts an empty list (no tools at all)', async () => {
    const { sanitizeToolSlugs } = await import('../server/utils/toolAccessStore')
    expect(sanitizeToolSlugs([])).toEqual([])
  })

  it('rejects unknown slugs and non-arrays', async () => {
    const { sanitizeToolSlugs } = await import('../server/utils/toolAccessStore')
    expect(() => sanitizeToolSlugs(['pdf-merge', 'not-a-tool'])).toThrow()
    expect(() => sanitizeToolSlugs('pdf-merge')).toThrow()
    expect(() => sanitizeToolSlugs(null)).toThrow()
    expect(() => sanitizeToolSlugs([42])).toThrow()
  })
})
