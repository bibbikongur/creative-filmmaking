import type { VehicleCategory } from '~/types'

// Category ids. Display labels live in the locale files under `categories.*`
// so they translate with the rest of the UI.
export interface CategoryInfo {
  id: VehicleCategory
}

export const categories: CategoryInfo[] = [
  { id: 'campers' },
  { id: 'equipment-cars' },
  { id: 'support-vehicles' },
  { id: 'trailers' },
]
