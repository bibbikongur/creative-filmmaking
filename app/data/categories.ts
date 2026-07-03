import type { VehicleCategory } from '~/types'

// Category ids + imagery. Display labels live in the locale files under
// `categories.*` so they translate with the rest of the UI.
export interface CategoryInfo {
  id: VehicleCategory
  image: string
}

export const categories: CategoryInfo[] = [
  {
    id: 'campers',
    image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'crew-trucks',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'support-vehicles',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'trailers',
    image: 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
  },
]
