// PUT /api/admin/contracts/:id  — replaces the agreement document (RentalContractData).
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!getContract(id)) throw createError({ statusCode: 404, statusMessage: 'Contract not found' })
  const data = parseContractData(await readBody(event))
  return updateContract(id, data)
})
