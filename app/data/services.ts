import type { LocalizedText } from '~/types'

/**
 * Services the admin can put on a quote next to vehicles and equipment.
 * Not listed on the public site: the picker in the admin quote builder is the
 * only place they appear. Priced like any other line on the offer form.
 */
export interface ServiceItem {
  /** Stable key stored on quote_items.item_id, e.g. 'svc-transport' */
  id: string
  name: LocalizedText
  /** First image is the thumbnail on the picker and the offer PDF */
  images: string[]
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'svc-transport',
    name: { en: 'Transport', is: 'Flutningur' },
    images: ['/images/services/transport.png'],
  },
]
