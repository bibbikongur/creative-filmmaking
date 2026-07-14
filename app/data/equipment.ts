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
  {
    id: 'e-005',
    category: 'heating',
    name: {
      en: 'Master BV 77 E Indirect Diesel Heater 21 kW',
      is: 'Master olíuhitablásari BV 77 E – 21 kW',
    },
    tagline: {
      en: 'Chimney-vented indirect heater: 100% clean, dry, odourless air for tents and basecamp; runs ~19 h per tank.',
      is: 'Óbeinn hitablásari með skorsteini – hreint, þurrt og lyktarlaust loft í tjöld og grunnbúðir; gengur um 19 klst. á tankfylli.',
    },
    images: ['/images/equipment/master-bv-77.jpg'],
  },
  {
    id: 'e-006',
    category: 'heating',
    name: {
      en: 'Master BV 290 E Indirect Diesel Heater 81 kW',
      is: 'Master olíuhitablásari BV 290 E – 81 kW',
    },
    tagline: {
      en: 'High-output indirect heater pushing 3,300 m³/h that heats big tents, halls and large sets fast.',
      is: 'Aflmikill óbeinn hitablásari sem skilar 3.300 m³/klst. – hitar stór tjöld, sali og stærri tökustaði hratt.',
    },
    images: ['/images/equipment/master-bv-290.jpg'],
  },
  {
    id: 'e-007',
    category: 'power',
    name: {
      en: 'Schuko Cable / Stinger',
      is: 'Schuko snúra / stinger',
    },
    tagline: {
      en: 'Heavy-duty Schuko extension cable, the standard stinger for power distribution on set.',
      is: 'Öflug Schuko framlengingarsnúra – klassískur stinger fyrir rafmagnsdreifingu á tökustað.',
    },
    images: ['/images/equipment/schuko-stinger.jpg'],
  },
  {
    id: 'e-008',
    category: 'power',
    name: {
      en: 'Inverter Generator 3.3 kVA 230V (CGM CG3300IE)',
      is: 'Rafstöð 3,3 kVA 230V (CGM CG3300IE)',
    },
    tagline: {
      en: 'Quiet 58 dB inverter generator with electric start, AVR and USB outlets. Clean power for lights and video village.',
      is: 'Hljóðlát inverter-rafstöð (58 dB) með rafstarti, spennujafnara og USB-tengjum – hreint rafmagn fyrir ljós og myndver.',
    },
    images: ['/images/equipment/generator-cg3300ie.webp'],
  },
  {
    id: 'e-009',
    category: 'power',
    name: {
      en: 'Inverter Generator 2.2 kVA 230V (CGM CG2200I)',
      is: 'Rafstöð 2,2 kVA 230V (CGM CG2200I)',
    },
    tagline: {
      en: 'Compact 22 kg inverter generator with silent-running power for cameras, monitors and chargers.',
      is: 'Nett 22 kg inverter-rafstöð – hljóðlát orka fyrir myndavélar, skjái og hleðslutæki.',
    },
    images: ['/images/equipment/generator-cg2200i.webp'],
  },
  {
    id: 'e-010',
    category: 'power',
    name: {
      en: 'LED Work Light NOVA 6K with Tripod',
      is: 'Kastari LED NOVA 6K með þrífæti',
    },
    tagline: {
      en: '6,000-lumen dimmable COB floodlight (IP67) on a 1.35–3 m tripod, a durable work light for night setups.',
      is: '6.000 lúmena deyfanlegur COB-kastari (IP67) á 1,35–3 m þrífæti – harðgert vinnuljós fyrir næturtökur.',
    },
    images: ['/images/equipment/led-nova-6k.jpg'],
  },
  {
    id: 'e-011',
    category: 'safety',
    name: {
      en: 'High-Visibility Safety Vest',
      is: 'Öryggisvesti',
    },
    tagline: {
      en: 'Hi-vis vest for crew working around traffic, vehicles and machinery.',
      is: 'Endurskinsvesti fyrir tökulið sem vinnur nálægt umferð, ökutækjum og vinnuvélum.',
    },
    images: ['/images/equipment/safety-vest.jpg'],
  },
  {
    id: 'e-012',
    category: 'furniture',
    name: {
      en: 'Folding Chair',
      is: 'Samanbrjótanlegur stóll',
    },
    tagline: {
      en: 'Black folding chair for basecamp, catering and video village seating.',
      is: 'Svartur samanbrjótanlegur stóll fyrir grunnbúðir, veitingar og myndver.',
    },
    images: ['/images/equipment/folding-chair.jpg'],
  },
  {
    id: 'e-013',
    category: 'furniture',
    name: {
      en: 'Lifetime 6\' Fold-in-Half Table (2-pack)',
      is: 'Lifetime samanbrjótanlegt borð 183 cm (2 stk.)',
    },
    tagline: {
      en: 'Commercial-grade 183 cm fold-in-half tables: seat 8, indoor/outdoor, easy to carry.',
      is: 'Atvinnuborð 183 cm sem brotna saman í tvennt – rúma 8 manns, henta úti sem inni og auðveld í flutningi.',
    },
    images: ['/images/equipment/folding-table-lifetime.jpg'],
  },
  {
    id: 'e-014',
    category: 'cleaning',
    name: {
      en: 'Push Broom 40×150 cm',
      is: 'Kústur 40×150 cm',
    },
    tagline: {
      en: 'Sturdy 40 cm push broom on a 150 cm handle for set and stage cleanup.',
      is: 'Traustur kústur með 40 cm haus og 150 cm skafti fyrir þrif á setti og sviði.',
    },
    images: ['/images/equipment/broom.jpg'],
  },
  {
    id: 'e-015',
    category: 'power',
    name: {
      en: 'Cable Reel 25 m 3G1.5 (Brennenstuhl Bremaxx)',
      is: 'Rafmagnskefli 25 m 3G1,5 (Brennenstuhl Bremaxx)',
    },
    tagline: {
      en: 'Outdoor-rated 25 m extension reel (IP44) with three sockets. Oil- and UV-resistant, usable down to −35°C.',
      is: 'Útikefli með 25 m snúru (IP44) og þremur tenglum – olíu- og UV-þolið, nothæft niður í −35°C.',
    },
    images: ['/images/equipment/cable-reel-25m.jpg'],
  },
  {
    id: 'e-016',
    category: 'safety',
    name: {
      en: 'Tow Rope 15 m × 24 mm',
      is: 'Dráttartóg 15 m × 24 mm',
    },
    tagline: {
      en: 'Elastic nylon recovery rope with a spliced loop for towing and recovering vehicles on location.',
      is: 'Teygjanlegt nælontóg með splæstri lykkju – til að draga og losa ökutæki á tökustað.',
    },
    images: ['/images/equipment/tow-rope-15m.jpg'],
  },
  {
    id: 'e-017',
    category: 'shelter',
    name: {
      en: 'Heavy-Duty Tarp 3.6×4.8 m (2-pack)',
      is: 'Yfirbreiðsla 3,6×4,8 m (2 stk.)',
    },
    tagline: {
      en: 'Waterproof reversible poly tarps with reinforced corners and grommets. Cover gear, vehicles or rig quick weather protection on set.',
      is: 'Vatnsheldar yfirbreiðslur með styrktum hornum og festingaraugum – verja búnað og ökutæki eða veita skjól á tökustað.',
    },
    images: ['/images/equipment/tarp-heavy-duty.jpg'],
  },
  {
    id: 'e-018',
    category: 'power',
    name: {
      en: 'Jump Starter for Trucks 24V (NOCO GB251+)',
      is: 'Starttæki fyrir vörubíla 24V',
    },
    tagline: {
      en: '3000 A lithium jump starter for 24V diesel and petrol engines up to 32 L: trucks, buses and heavy machinery, with USB charging and LED work light.',
      is: '3000 A starttæki fyrir 24V dísil- og bensínvélar allt að 32 L – vörubíla, rútur og vinnuvélar, með USB-hleðslu og LED-vinnuljósi.',
    },
    images: ['/images/equipment/jump-starter-noco-gb251.jpg'],
  },
  {
    id: 'e-019',
    category: 'power',
    name: {
      en: 'Steel Fuel Can 20 L (Petrol & Diesel)',
      is: 'Bensín- og dísilbrúsi úr stáli 20 l',
    },
    tagline: {
      en: 'Classic 20-litre steel jerry can for petrol or diesel. Keeps generators and heaters fuelled on location.',
      is: 'Klassískur 20 lítra stálbrúsi fyrir bensín eða dísil – heldur rafstöðvum og miðstöðvum gangandi á tökustað.',
    },
    images: ['/images/equipment/fuel-can-20l.jpg'],
  },
  {
    id: 'e-020',
    category: 'power',
    name: {
      en: 'Jump Starter 12V (NOCO GBX155)',
      is: 'Starttæki 12V (NOCO GBX155)',
    },
    tagline: {
      en: '4250 A lithium jump starter for 12V petrol engines up to 10 L and diesels up to 8 L: cars, vans and machinery, with USB-C charging and a 500-lumen LED light.',
      is: '4250 A starttæki fyrir 12V bensínvélar allt að 10 L og dísilvélar allt að 8 L – bíla, sendibíla og vinnuvélar, með USB-C hleðslu og 500 lúmena LED-ljósi.',
    },
    images: ['/images/equipment/noco-gbx155.jpg'],
  },
  {
    id: 'e-021',
    category: 'shelter',
    name: {
      en: 'Eskimo Outbreak 450XDP Insulated Pop-Up Shelter',
      is: 'Eskimo Outbreak 450XDP einangrað skjóltjald',
    },
    tagline: {
      en: 'Insulated 4–5 person pop-up shelter (~7 m² floor) with StormShield fabric, 7 windows and heater ports, a warm crew refuge on winter and glacier shoots.',
      is: 'Einangrað sprett-tjald fyrir 4–5 manns (~7 m² gólf) með StormShield-dúk, 7 gluggum og hitaraopum – hlýtt skjól fyrir tökuliðið í vetrar- og jöklatökum.',
    },
    images: ['/images/equipment/eskimo-outbreak-450xdp.png'],
  },
  {
    id: 'e-022',
    category: 'safety',
    name: {
      en: 'Portable Fence Post with Ram\'s Horn',
      is: 'Randbeitarstaur með hrútshorni',
    },
    tagline: {
      en: 'Lightweight 99 cm PVC post with a metal ground spike and ram\'s-horn hook for quick temporary fencing and perimeter marking on location.',
      is: 'Léttur 99 cm plaststaur með málmoddi og hrútshorni – fljótleg bráðabirgðagirðing og svæðamerking á tökustað.',
    },
    images: ['/images/equipment/randbeitarstaur-hrutshorn.jpg'],
  },
  {
    id: 'e-023',
    category: 'safety',
    name: {
      en: 'Lashing Strap 0.25 t',
      is: 'Strekkiborði 0,25 t',
    },
    tagline: {
      en: 'Hampiðjan lashing belt with a 0.25-tonne breaking load, in 0.5–3 m lengths. Straps down gear and cargo on trailers and trucks.',
      is: 'Strekkiborði frá Hampiðjunni með 0,25 tonna togþoli, fáanlegur í 0,5–3 m lengdum – festir búnað og farm á kerrum og vörubílum.',
    },
    images: ['/images/equipment/strekkibordi-lashing-belt.jpg'],
  },
  {
    id: 'e-024',
    category: 'safety',
    name: {
      en: 'Ratchet Strap with Hook (orange)',
      is: 'Strekkjari og borði með krók (appelsínugulur)',
    },
    tagline: {
      en: 'Two-part Hampiðjan ratchet strap with hook: breaking loads from 0.8 to 10 tonnes and lengths up to 10 m, for securing heavy cargo and gear on trailers and trucks.',
      is: 'Tvískiptur strekkjari frá Hampiðjunni með borða og krók – brotþol 0,8 til 10 tonn og lengdir allt að 10 m, til að festa þyngri farm og búnað á kerrum og vörubílum.',
    },
    images: ['/images/equipment/ratchet-strap-orange.jpg'],
  },
]
