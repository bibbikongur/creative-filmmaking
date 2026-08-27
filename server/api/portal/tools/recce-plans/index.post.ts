export default defineEventHandler(async (event) => {
  const user = await requirePortalUser(event)
  const body = await readBody(event).catch(() => ({}))
  const name = validatePlanName(body?.name)
  // Optional job link — the plan then shows up under the job's "Hjálpargögn".
  const jobId = requireToolJob(user.id, body?.jobId)
  // A brand-new plan starts with the defaults; the browser may also push a
  // full payload right away (migrating a pre-server localStorage draft).
  const data = body?.data !== undefined ? validatePlanData(body.data) : emptyPlanData()
  return createReccePlan(user.id, name, data, jobId)
})
