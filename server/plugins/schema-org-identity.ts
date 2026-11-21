// One organisation node per page.
//
// nuxt-schema-org takes the `logo` off a LocalBusiness identity and emits a
// second, bare `Organization` node (`#organization`: name, url, address, logo)
// next to it, so every page described the company twice. Both nodes are the
// same business, so this folds the second into the first on the way out: the
// logo moves onto the `#identity` node (LocalBusiness is an Organization, the
// property is valid there) and the duplicate is dropped.
//
// Runs on the server-rendered HTML only, which is what search engines read
// (in production the JSON-LD is not re-rendered on the client).
const LD_SCRIPT = /(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g

type Node = Record<string, unknown> & { '@id'?: string }

function mergeIdentity(json: string): string {
  let doc: { '@graph'?: Node[] }
  try {
    doc = JSON.parse(json)
  }
  catch {
    return json
  }
  const graph = doc['@graph']
  if (!Array.isArray(graph)) return json
  const byId = (suffix: string) => graph.find(n => typeof n['@id'] === 'string' && n['@id'].endsWith(suffix))

  // The wordmark in the header says "CF Rentals": both names on the WebSite
  // node. (Set here and not with defineWebSite in app.vue, which replaced the
  // per-language WebSite node the i18n integration builds and left the English
  // pages pointing at a node that no longer existed.)
  const website = graph.find(n => n['@type'] === 'WebSite')
  if (website) website.alternateName ??= 'CF Rentals'

  const extra = byId('#organization')
  const identity = byId('#identity')
  if (extra && identity) {
    if (extra.logo && !identity.logo) {
      // Point at the logo node the library already emits instead of describing the image twice.
      const logoNode = byId('#logo')
      if (logoNode) {
        logoNode.width = 512
        logoNode.height = 512
        identity.logo = { '@id': logoNode['@id'] }
      }
      else {
        identity.logo = { '@type': 'ImageObject', 'url': extra.logo, 'width': 512, 'height': 512 }
      }
    }
    doc['@graph'] = graph.filter(n => n !== extra)
  }
  // "<" never appears raw inside a script element.
  return JSON.stringify(doc).replace(/</g, '\\u003c')
}

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html) => {
    for (const part of ['head', 'bodyPrepend', 'body', 'bodyAppend'] as const) {
      html[part] = html[part].map(chunk =>
        chunk.includes('application/ld+json')
          ? chunk.replace(LD_SCRIPT, (_m, open: string, json: string, close: string) => open + mergeIdentity(json) + close)
          : chunk,
      )
    }
  })
})

