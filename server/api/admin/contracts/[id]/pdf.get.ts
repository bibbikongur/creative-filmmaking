// GET /api/admin/contracts/:id/pdf — the printable agreement (inline, for the browser's print dialog).
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const contract = getContract(Number(getRouterParam(event, 'id')))
  if (!contract) throw createError({ statusCode: 404, statusMessage: 'Contract not found' })
  const pdf = await generateRentalContractPdf(contract)
  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'cache-control', 'no-store')
  setHeader(event, 'content-disposition', `inline; filename="rental-agreement-${contract.number}.pdf"`)
  return pdf
})
