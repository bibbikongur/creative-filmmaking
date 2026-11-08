export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contract = getContract(Number(getRouterParam(event, 'id')))
  if (!contract) throw createError({ statusCode: 404, statusMessage: 'Contract not found' })
  return contract
})
