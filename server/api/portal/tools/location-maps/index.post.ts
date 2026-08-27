export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const body = await readBody(event).catch(() => ({}))
  const name = validateMapName(body?.name)
  // Optional job link — the map then shows up under the job's "Hjálpargögn".
  const jobId = requireToolJob(user.id, body?.jobId)
  // A brand-new map starts with one street-map page centered on Reykjavík;
  // the editor may move it to the user's location right away.
  const pages = body?.pages !== undefined
    ? validatePages(body.pages)
    : [{
        id: `p-${Date.now().toString(36)}`,
        title: '',
        base: 'streets' as const,
        center: { lat: 64.1355, lng: -21.8954 },
        zoom: 13,
        markers: [],
        roads: [],
        texts: [],
        vehicles: [],
      }]
  return createLocationMap(user.id, name, pages, jobId)
})
