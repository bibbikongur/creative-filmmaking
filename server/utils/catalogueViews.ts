import type { H3Event } from 'h3'
import type { EquipmentCategoryDef, EquipmentCategorySummary, EquipmentItem, Vehicle, VehicleSummary } from '~~/app/types'

// The "card" view of the public catalogue lists (?view=card): what cards,
// lists, the quote form and the footer print. The long copy (descriptions,
// category intros and FAQs) is left out, because those lists are serialised
// into the HTML of every page; the page that shows the long copy fetches its
// own record from /api/equipment/<id>, /api/vehicles/<id> or
// /api/equipment-categories/<id>.

export const wantsCardView = (event: H3Event): boolean => getQuery(event).view === 'card'

export function equipmentCard(item: EquipmentItem): EquipmentItem {
  const { description: _description, ...card } = item
  return card
}

export function vehicleCard(vehicle: Vehicle): VehicleSummary {
  const { description: _description, ...card } = vehicle
  return card
}

export function equipmentCategoryCard(category: EquipmentCategoryDef): EquipmentCategorySummary {
  const { title: _title, metaTitle: _metaTitle, metaDescription: _metaDescription, intro: _intro, faq: _faq, ...card } = category
  return card
}
