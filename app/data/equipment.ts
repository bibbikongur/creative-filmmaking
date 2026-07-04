import type { EquipmentItem } from '~/types'

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPMENT — production gear rented alongside the fleet (heating units, tents,
// safety kit, basecamp furniture). This static file only seeds the runtime
// store on first run; after that the admin panel (/admin/equipment) is the
// source of truth. Images are Unsplash placeholders — drop real photos in
// /public/images and change the URLs to '/images/your-photo.jpg'.
// ─────────────────────────────────────────────────────────────────────────────

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`

export const equipment: EquipmentItem[] = [
  {
    id: 'e-001',
    category: 'heating',
    name: {
      en: 'Diesel Heating Unit 5 kW',
      is: 'Dísilmiðstöð 5 kW',
    },
    tagline: {
      en: 'Portable standing heat to keep basecamp and tents warm on cold shoot days.',
      is: 'Færanleg dísilmiðstöð sem heldur grunnbúðum og tjöldum hlýjum á köldum tökudögum.',
    },
    images: [img('photo-1558618666-fcd25c85cd64')],
  },
  {
    id: 'e-002',
    category: 'shelter',
    name: {
      en: 'Crew Tent 6×3 m',
      is: 'Tökutjald 6×3 m',
    },
    tagline: {
      en: 'Weatherproof pop-up shelter for catering, wardrobe or a dry crew break.',
      is: 'Veðurþolið tjald fyrir veitingar, búninga eða þurra hvíld fyrir tökuliðið.',
    },
    images: [img('photo-1504280390367-361c6d9f38f4')],
  },
  {
    id: 'e-003',
    category: 'safety',
    name: {
      en: 'Traffic Cones (set of 20)',
      is: 'Umferðarkeilur (20 stk.)',
    },
    tagline: {
      en: 'High-visibility cones for closing lanes, marking parking and set perimeters.',
      is: 'Áberandi keilur til að loka akreinum og merkja bílastæði og tökusvæði.',
    },
    images: [img('photo-1516939884455-1445c8652f83')],
  },
  {
    id: 'e-004',
    category: 'furniture',
    name: {
      en: 'Folding Tables (set of 4)',
      is: 'Samanbrjótanleg borð (4 stk.)',
    },
    tagline: {
      en: 'Sturdy trestle tables for craft services, video village or the production office.',
      is: 'Traust borð fyrir veitingar, myndver eða framleiðsluskrifstofuna.',
    },
    images: [img('photo-1533473359331-0135ef1b58bf')],
  },
]
