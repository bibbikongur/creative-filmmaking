import type { EquipmentCategory } from '~/types'

// Equipment category ids. Display labels live in the locale files under
// `equipmentCategories.*` so they translate with the rest of the UI. This is
// also the source of truth the server store validates submissions against.
export const equipmentCategories: EquipmentCategory[] = [
  'heating',
  'shelter',
  'safety',
  'furniture',
  'power',
  'cleaning',
]
