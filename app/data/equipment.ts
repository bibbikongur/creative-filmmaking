import type { EquipmentItem } from '~/types'

// The live equipment catalogue, mirrored. Production's SQLite database is the
// source of truth (admin panel edits win); this file only seeds fresh installs.
// Synced from https://creativefilmmaking.is/api/equipment on 2026-08-27.
export const equipment: EquipmentItem[] = [
  {
    id: 'e-mr754bhada10',
    category: 'heating',
    name: {
      en: 'Master BV 77 E Indirect Diesel Heater 21 kW',
      is: 'Master olíuhitablásari BV 77 E – 21 kW',
    },
    tagline: {
      en: 'Master oil heater perfect for heating up tents and other big areas. 100% clean, dry, odourless air straight into your tents or other areas. Runs about 19 h per tank. Comes with a tube and a chimney to direct the heat to the desired space.',
      is: 'Olíublásari tilvalinn til að hita upp tjöld og önnur stór rými. Hreint, þurrt og lyktarlaust loft í tjöld og önnur rými. Gengur um 19 klst. á tankfylli. Kemur með barka og stromp til að leiða hitann.',
    },
    images: [
      '/images/equipment/master-bv-77.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mr754bmhf449',
    category: 'heating',
    name: {
      en: 'Master BV 290 E Indirect Diesel Heater 81 kW',
      is: 'Master olíuhitablásari BV 290 E – 81 kW',
    },
    tagline: {
      en: 'High-output indirect heater pushing 3,300 m³/h: heats big tents, halls and large sets fast. 100% clean, dry, odourless air straight into your tents or other big areas. Comes with 2x tubes, a splitter and a chimney to direct the heat to the desired space.',
      is: 'Aflmikill óbeinn hitablásari sem skilar 3.300 m³/klst. og hitar stór tjöld, sali og stærri tökustaði hratt. Hreint, þurrt og lyktarlaust loft í tjöld og önnur stærri rými. Kemur með 2x börkum, splitter og strompi til að leiða hitann rétt.',
    },
    images: [
      '/images/equipment/master-bv-290.jpg',
    ],
    featured: true,
  },
  {
    id: 'e-mr754brqcd2c',
    category: 'power',
    name: {
      en: 'Schuko Cable / Stinger 20m',
      is: 'Framlengingarsnúra / stinger 20m',
    },
    tagline: {
      en: 'Heavy-duty Schuko extension cable, the classic 20 m stinger for power distribution on set. Weatherproof rubber, IP44, H07RN-F.',
      is: 'Öflug Schuko framlengingarsnúra, klassískur 20m stinger. Úr veðurþolnu gúmmí. IP44, H07RN-F.',
    },
    images: [
      '/uploads/mrpjjm5s-cbd9346a.png',
      '/uploads/mrpjjmfn-bfc1788d.png',
    ],
    featured: false,
  },
  {
    id: 'e-mr754bxk8aeb',
    category: 'power',
    name: {
      en: 'Inverter Generator 3.3 kVA 230V (CGM CG3300IE)',
      is: 'Rafstöð 3,3 kVA 230V (CGM CG3300IE)',
    },
    tagline: {
      en: 'Quiet 58 dB inverter generator with electric start, AVR and USB outlets.',
      is: 'Hljóðlát rafstöð (58 dB) með rafstarti, spennujafnara og USB-tengjum, tilvalið fyrir flest öll raftæki',
    },
    images: [
      '/images/equipment/generator-cg3300ie.webp',
    ],
    featured: false,
  },
  {
    id: 'e-mr754c3jf5e5',
    category: 'power',
    name: {
      en: 'Inverter Generator 2.2 kVA 230V (CGM CG2200I)',
      is: 'Rafstöð 2,2 kVA 230V (CGM CG2200I)',
    },
    tagline: {
      en: 'Compact 22 kg inverter generator, quiet and easy to carry anywhere power is needed.',
      is: 'Nett 22 kg inverter-rafstöð, hljóðlát og létt að bera hvert sem rafmagn vantar.',
    },
    images: [
      '/images/equipment/generator-cg2200i.webp',
    ],
    featured: true,
  },
  {
    id: 'e-mr754c8n9357',
    category: 'power',
    name: {
      en: 'LED Work Light NOVA 6K with Tripod',
      is: 'Kastari LED NOVA 6K með þrífæti',
    },
    tagline: {
      en: '6,000-lumen dimmable COB floodlight (IP67) on a 1.35–3 m tripod, this is battery powered so easy to set up whenever its needed, durable work light for night setups.',
      is: '6.000 lúmena deyfanlegur COB-kastari (IP67) á 1,35–3 m þrífæti, þetta eru batterísljós og þannig auðvelt að henda upp þegar þess þarf. Mjög gott fyrir næturtökur eða þegar fer að myrkva.',
    },
    images: [
      '/images/equipment/led-nova-6k.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mr754cdu38ba',
    category: 'safety',
    name: {
      en: 'High Visibility Safety Vest',
      is: 'Öryggisvesti',
    },
    tagline: {
      en: 'Hi-vis vest for crew working around traffic, vehicles and machinery.',
      is: 'Endurskinsvesti fyrir tökulið sem vinnur nálægt umferð, ökutækjum og vinnuvélum.',
    },
    images: [
      '/images/equipment/safety-vest.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mr754cj10dbb',
    category: 'furniture',
    name: {
      en: 'Folding Chair',
      is: 'Samanbrjótanlegur stóll',
    },
    tagline: {
      en: 'Black folding chair for basecamp, catering and video village seating.',
      is: 'Svartur samanbrjótanlegur stóll fyrir grunnbúðir, catering og video village.',
    },
    images: [
      '/images/equipment/folding-chair.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mr754coccab2',
    category: 'furniture',
    name: {
      en: 'Fold-in-Half Table (2-pack)',
      is: 'Samanbrjótanlegt borð 183 cm (2 stk.)',
    },
    tagline: {
      en: 'Commercial-grade 183 cm tables that fold in half, indoor/outdoor, easy to carry.',
      is: 'Vinnuborð sem klikkar aldrei: 183 cm, brotnar saman í tvennt, hentar úti sem inni og er auðvelt í flutningi.',
    },
    images: [
      '/images/equipment/folding-table-lifetime.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mre0iyjs764f',
    category: 'power',
    name: {
      en: 'Cable Reel 25m',
      is: 'Rafmagnskefli 25 m',
    },
    tagline: {
      en: 'Outdoor-rated 25 m extension reel (IP44) with three sockets, oil- and UV-resistant, usable down to −35°C.',
      is: 'Útikefli með 25 m snúru (IP44) og þremur tenglum, olíu- og UV-þolið, nothæft niður í −35°C.',
    },
    images: [
      '/images/equipment/cable-reel-25m.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-016',
    category: 'safety',
    name: {
      en: 'Tow Rope 15 m × 24 mm',
      is: 'Dráttartóg 15 m × 24 mm',
    },
    tagline: {
      en: 'Elastic nylon recovery rope with a spliced loop, for towing and recovering vehicles on location.',
      is: 'Teygjanlegt nælontóg með splæstri lykkju, til að draga og losa ökutæki á tökustað.',
    },
    images: [
      '/images/equipment/tow-rope-15m.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-017',
    category: 'shelter',
    name: {
      en: 'Heavy-Duty Tarp 3.6×4.8 m (2-pack)',
      is: 'Yfirbreiðsla 3,6×4,8 m (2 stk.)',
    },
    tagline: {
      en: 'Waterproof reversible poly tarps with reinforced corners and grommets, cover gear, vehicles or rig quick weather protection on set.',
      is: 'Vatnsheldar yfirbreiðslur með styrktum hornum og festingaraugum, tilvalið til að verja búnað og ökutæki eða veita skjól á tökustað.',
    },
    images: [
      '/images/equipment/tarp-heavy-duty.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-018',
    category: 'power',
    name: {
      en: 'Jump Starter for Trucks 24V (NOCO GB251+)',
      is: 'Starttæki fyrir vörubíla 24V',
    },
    tagline: {
      en: '3000 A lithium jump starter for 24V diesel and petrol engines up to 32 L trucks, buses and heavy machinery, with USB charging and LED work light.',
      is: '3000 A starttæki fyrir 24V dísil- og bensínvélar allt að 32 L vörubíla, rútur og vinnuvélar, með USB-hleðslu og LED-vinnuljósi.',
    },
    images: [
      '/images/equipment/jump-starter-noco-gb251.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-019',
    category: 'power',
    name: {
      en: 'Steel Fuel Can 20 L (Petrol & Diesel)',
      is: 'Bensín- og dísilbrúsi úr stáli 20 l',
    },
    tagline: {
      en: 'Classic 20-litre steel jerry can for petrol or diesel, keeps generators and heaters fuelled on location.',
      is: 'Klassískur 20 lítra stálbrúsi fyrir bensín eða dísil, heldur rafstöðvum og miðstöðvum gangandi á tökustað.',
    },
    images: [
      '/images/equipment/fuel-can-20l.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-020',
    category: 'power',
    name: {
      en: 'Jump Starter 12V (NOCO GBX155)',
      is: 'Starttæki 12V (NOCO GBX155)',
    },
    tagline: {
      en: '4250 A lithium jump starter for 12V petrol engines up to 10 L and diesels up to 8 L cars, vans and machinery, with USB-C charging and a 500-lumen LED light.',
      is: '4250 A starttæki fyrir 12V bensínvélar allt að 10 L og dísilvélar allt að 8 L bíla, sendibíla og vinnuvélar, með USB-C hleðslu og 500 lúmena LED-ljósi.',
    },
    images: [
      '/images/equipment/noco-gbx155.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-021',
    category: 'shelter',
    name: {
      en: 'Eskimo Outbreak 450XDP Insulated Pop-Up Shelter',
      is: 'Eskimo Outbreak 450XDP einangrað skjóltjald',
    },
    tagline: {
      en: 'Insulated 4–5 person pop-up shelter (~7 m² floor) with StormShield fabric, 7 windows and heater ports, a warm crew refuge.',
      is: 'Einangrað popup tjald rúmar 4–5 manns (~7 m² gólf) með StormShield-dúk, 7 gluggum og hitaraopum, hlýtt skjól fyrir tökuliðið.',
    },
    images: [
      '/images/equipment/eskimo-outbreak-450xdp.png',
    ],
    featured: true,
  },
  {
    id: 'e-022',
    category: 'safety',
    name: {
      en: 'Portable Fence Post with Ram\'s Horn',
      is: 'Plaststaur með hrútshorni',
    },
    tagline: {
      en: 'Lightweight 99 cm PVC post with a metal ground spike and ram\'s-horn hook — quick temporary fencing and perimeter marking on location.',
      is: 'Léttur 99 cm plaststaur með málmoddi og hrútshorni, fljótleg bráðabirgðagirðing fyrir tökustað.',
    },
    images: [
      '/uploads/mrl0mxcy-b323c800.png',
    ],
    featured: false,
  },
  {
    id: 'e-023',
    category: 'safety',
    name: {
      en: 'Lashing Strap 0.25 t',
      is: 'Strekkiborði 0,25 t',
    },
    tagline: {
      en: '1-3 m lashing strap for securing gear and cargo on trailers and trucks.',
      is: '1-3 m langur strekkiborði sem festir búnað og farm á kerrum og vörubílum.',
    },
    images: [
      '/images/equipment/strekkibordi-lashing-belt.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-024',
    category: 'safety',
    name: {
      en: 'Ratchet Strap with Hook (orange)',
      is: 'Strekkjari með krók (appelsínugulur)',
    },
    tagline: {
      en: 'Two-part ratchet strap with hook, lengths up to 10 m, for securing heavy cargo and gear on trailers and trucks.',
      is: 'Tvískiptur strekkjari með borða og krók, lengdir allt að 10 m, til að festa þyngri farm og búnað á kerrum og vörubílum.',
    },
    images: [
      '/images/equipment/ratchet-strap-orange.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mrl0eqb86480',
    category: 'safety',
    name: {
      en: 'Traffic Cones 50 cm',
      is: 'Umferðarkeilur 50 cm',
    },
    tagline: {
      en: '50 cm traffic cones for closing off sets, parking and work areas.',
      is: '50 cm umferðarkeilur til að loka af tökustaði, bílastæði og vinnusvæði.',
    },
    images: [
      '/uploads/mrl0ekpj-4d0c2ede.png',
    ],
    featured: true,
  },
  {
    id: 'e-mrl0gz0p4b08',
    category: 'safety',
    name: {
      en: 'Traffic Cones: No Parking',
      is: 'Umferðarkeilur: Bannað að leggja',
    },
    tagline: {
      en: 'Yellow traffic cones with a no-parking sign, keep the unit parking clear.',
      is: 'Gular umferðarkeilur með Bannað að leggja skilti, halda tökusvæðinu lausu við bíla.',
    },
    images: [
      '/uploads/mrl0guif-8721d6f5.png',
    ],
  },
  {
    id: 'e-mrl0vha3a57a',
    category: 'safety',
    name: {
      en: 'Traffic Cone LED Flares (orange)',
      is: 'Öryggisljós á keilur (LED)',
    },
    tagline: {
      en: 'Orange LED flares for traffic cones with smart sequential flashing, set of 8 in a carrying case.',
      is: 'Appelsínugul LED öryggisljós á keilur, hægt að stilla blikk, koma í þægilegri tösku með 8 stykkjum.',
    },
    images: [
      '/uploads/mrl0vfdh-7a1330ce.png',
      '/uploads/mrl3jkw6-ecc38660.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpjovke1eda',
    category: 'power',
    name: {
      en: '32 amp 3-phase extension cable 10m',
      is: '32 amp 3 fasa framlengingarsnúra 10m',
    },
    tagline: {
      en: '32 amp 3-phase extension cable 10m, rubber 5G4.0 IP44 400v/32a Plug+Socket',
      is: '32 amp 3 fasa framlengingarsnúra 10m, gúmmí 5G4.0 IP44 400v/32a Kló+hulsa',
    },
    images: [
      '/uploads/mrpjluce-b39c22a8.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpk2yn45a70',
    category: 'power',
    name: {
      en: '16 amp 3-phase extension cable 25m',
      is: '16 amp 3 fasa framlengingarsnúra 25m',
    },
    tagline: {
      en: '16 amp 3-phase extension cable 25m, Rubber 5G2.5 IP44 400V/16A Plug+Socket',
      is: '16 amp 3 fasa framlengingarsnúra 25m, gúmmí 5G2.5, IP44, 400V/16A, kló+hulsa',
    },
    images: [
      '/uploads/mrpk2e52-42ef77e1.png',
      '/uploads/mrpk2ebk-43ffb4db.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpkv0o93613',
    category: 'cleaning',
    name: {
      en: 'Fiskars Ergonomic Digging Shovel',
      is: 'Stunguskófla Fiskars Ergonomic',
    },
    tagline: {
      en: 'Light, strong Fiskars digging shovel for groundwork, snow and cleanup on location.',
      is: 'Létt og sterk stunguskófla frá Fiskars fyrir jarðvinnu, snjó og frágang á tökustað.',
    },
    images: [
      '/uploads/mrpkupwu-e8abc619.png',
      '/uploads/mrpkuq66-102ea37a.png',
      '/uploads/mrpkuqfd-c1e26c8d.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpkwla84949',
    category: 'cleaning',
    name: {
      en: 'Shovel 132cm Fiskars Ergonomic',
      is: 'Skófla 132cm Fiskars Ergonomic',
    },
    tagline: {
      en: 'Light 132 cm Fiskars shovel for snow, gravel and general cleanup.',
      is: 'Létt 132 cm Fiskars skófla fyrir snjó, möl og almennan frágang.',
    },
    images: [
      '/uploads/mrpkwhtp-ee3e6ee7.png',
      '/uploads/mrpkwi0n-10d256a1.png',
      '/uploads/mrpkwi7c-1525eff5.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpkxz90eec4',
    category: 'cleaning',
    name: {
      en: 'Broom 40x150cm Freund',
      is: 'Kústur 40x150cm Freund',
    },
    tagline: {
      en: 'Wide 40 cm Freund broom on a 150 cm handle for sweeping sets and work areas.',
      is: 'Breiður 40 cm Freund kústur á 150 cm skafti fyrir þrif á setti og vinnusvæðum.',
    },
    images: [
      '/uploads/mrpkxv25-5aabec90.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpl7l4td85e',
    category: 'power',
    name: {
      en: 'Multiplug outdoor 4 sockets',
      is: 'Fjöltengi úti 4 innstungur',
    },
    tagline: {
      en: 'Outdoor multiplug with 4 sockets, 2 m cable and protective lids. IP44.',
      is: 'Fjöltengi til að vera úti, 4 innstungur, 2 m snúra og lok yfir tenglum. IP44.',
    },
    images: [
      '/uploads/mrpl7g8u-cdc13a8c.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpl9cphbc39',
    category: 'power',
    name: {
      en: 'Multiplug outdoor 3 sockets with switch',
      is: 'Fjöltengi til að vera úti 3 innstungur og rofi',
    },
    tagline: {
      en: 'Outdoor multiplug with 3 sockets and a power switch, 3 m cable and protective lids. IP44.',
      is: 'Fjöltengi til að vera úti, 3 innstungur og rofi, 3 m snúra og lok yfir tenglum. IP44.',
    },
    images: [
      '/uploads/mrpl931c-456a3bca.png',
      '/uploads/mrpl938h-f136b489.png',
      '/uploads/mrpl93hf-7b063f44.png',
    ],
    featured: true,
  },
  {
    id: 'e-mrw8w5pqb2c8',
    category: 'safety',
    name: {
      en: 'NOX Modular Motorcycle Helmet',
      is: 'NOX kjálkahjálmar',
    },
    tagline: {
      en: 'Rent this high-quality polycarbonate and thermoplastic modular helmet, designed for maximum comfort and safety. It features a built-in sun visor, a chin wind deflector, excellent ventilation, and a visor ready for a Pinlock 30 anti-fog insert. Enjoy a quiet ride with great sound insulation, a removable inner lining, a quick-release buckle, and built-in space for an intercom system. A helmet bag is included. Certified to strict ECE 22.06 and Double P/J safety standards.',
      is: 'Kjálkahjálmur úr Polycarbonate og thermoplastic með innbyggðum sólgleraugum, vindhlíf við hökuna, gler fyrir Pinlock 30 filmu, fóðri sem er hægt að taka úr, góðri öndun, hraðsmellu og pláss fyrir talkerfi. Vel hljóðeingraður. Hjálmapoki fylgir. ECE 22.06 & Double P/J staðlar.',
    },
    images: [
      '/uploads/mrw8vnah-22bab71e.png',
      '/uploads/mrw8vmp7-79368a60.png',
      '/uploads/mrw8vlxm-f40bf942.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrwb9v1v7ef1',
    category: 'power',
    name: {
      en: '16 amp 3-phase distribution board',
      is: '16 amp 3 fasa rafmagnstafla',
    },
    tagline: {
      en: 'Mini U16 distribution board with RCD, 2x 16 A three-phase outlets and 4 Schuko sockets.',
      is: 'Mini U16 rafmagnstafla með lekaliða, 2x 16 A þriggja fasa út og 4 Schuko tenglar.',
    },
    images: [
      '/uploads/mrwb9tdt-e0b8e6ac.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrzktoe5d0c9',
    category: 'safety',
    name: {
      en: 'Traffic Cones 100 cm',
      is: 'Umferðarkeilur 100 cm',
    },
    tagline: {
      en: 'Large, stable 100 cm heavy-duty cones for road closures and highly visible marking.',
      is: 'Stórar og stöðugar 100 cm umferðarkeilur fyrir vegalokanir og áberandi merkingar.',
    },
    images: [
      '/uploads/mrzktm1l-ba921b94.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrzl0c5k7565',
    category: 'power',
    name: {
      en: 'Ecoflow Delta 3 Pro - Power bank',
      is: 'Ecoflow Delta 3 Pro - Batterí banki',
    },
    tagline: {
      en: 'Output: 4000W continuous power (handles heavy-duty appliances).\nCharging: Fast charges from 0 to 80% in just 1 hour.\nNoise Level: Whisper-quiet operation at only 30 dB.',
      is: 'Afl: 4000W samfellt afl (ræður við flest stærri tæki).\nHleðsla: Nær 80% hleðslu á aðeins einni klukkustund.\nHljóðstig: Mjög hljóðlát í notkun, eða aðeins um 30 dB.',
    },
    images: [
      '/uploads/mrzkxll3-1349ad1f.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrzl66ydd657',
    category: 'safety',
    name: {
      en: 'Detour Signs',
      is: 'Hjáleiðarskilti',
    },
    tagline: {
      en: 'Detour signs pointing right or left, route traffic smoothly around a closed set.',
      is: 'Hjáleiðarskilti til hægri eða vinstri sem stýra umferð fram hjá lokuðum tökustað.',
    },
    images: [
      '/uploads/mrzl656a-94b0ba66.png',
    ],
    featured: false,
  },
  {
    id: 'e-mseixxnp32fb',
    category: 'safety',
    name: {
      en: 'Filming in Progress Sign',
      is: 'Kvikmyndatökur í gangi skilti',
    },
    tagline: {
      en: 'Sign letting passers-by know that filming is in progress in the area.',
      is: 'Skilti sem lætur vegfarendur vita að kvikmyndatökur séu í gangi á svæðinu.',
    },
    images: [
      '/uploads/msfcduxx-3e147154.png',
    ],
    featured: false,
  },
  {
    id: 'e-msejvh5a659c',
    category: 'heating',
    name: {
      en: 'Air Pump',
      is: 'Loftdæla',
    },
    tagline: {
      en: 'Air pump for rent, light and simple to use.',
      is: 'Loftdæla til leigu, létt og einföld í notkun.',
    },
    images: [
      '/uploads/msejve7a-d0e06939.png',
    ],
    featured: false,
  },
  {
    id: 'e-msoi1sx7148c',
    category: 'power',
    name: {
      en: '32 amp 3-phase distribution board',
      is: '32 amp 3 fasa rafmagnstafla',
    },
    tagline: {
      en: 'Compact 32 A distribution board for three-phase power on set.',
      is: 'Nett 32 amp rafmagnstafla fyrir þriggja fasa rafmagn á tökustað.',
    },
    images: [
      '/uploads/msoi1qvu-02483ca3.png',
    ],
    featured: false,
  },
]
