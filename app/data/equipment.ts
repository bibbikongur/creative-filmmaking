import type { EquipmentItem } from '~/types'

// The live equipment catalogue, mirrored. Production's SQLite database is the
// source of truth (admin panel edits win); this file seeds fresh installs and
// carries copy pushed to production via SEED_EQUIPMENT_UPDATES in
// server/utils/db.ts. Synced from https://creativefilmmaking.is/api/equipment
// on 2026-10-03, then given a stored `slug` (pins every item's URL) and, for the
// main items, a description + highlights for the detail page. Re-synced on
// 2026-11-04 (ten items added in admin since, slugs pinned to what the live
// site derived from their names) and given a copy pass: description and
// highlights on every item, one-line taglines, shorter names.
export const equipment: EquipmentItem[] = [
  {
    id: 'e-mr754bhada10',
    slug: 'master-oliuhitablasari-bv-77-e-21-kw',
    category: 'heating',
    name: {
      en: 'Diesel Heater 21 kW (Master BV 77 E)',
      is: 'Olíuhitablásari 21 kW (Master BV 77 E)',
    },
    tagline: {
      en: 'Master oil heater perfect for heating up tents and other big areas. 100% clean, dry, odourless air straight into your tents or other areas. Runs about 19 h per tank. Comes with a tube and a chimney to direct the heat to the desired space.',
      is: 'Olíublásari tilvalinn til að hita upp tjöld og önnur stór rými. Hreint, þurrt og lyktarlaust loft í tjöld og önnur rými. Gengur um 19 klst. á tankfylli. Kemur með barka og stromp til að leiða hitann.',
    },
    description: {
      en: 'The Master BV 77 E is an indirect-fired diesel heater: the burner exhaust goes out through its own chimney, so only clean, dry, odourless warm air reaches the space. That makes it the standard choice for heating crew tents, holding areas and basecamp on a winter shoot in Iceland.\n\nIt runs around 19 hours on a full tank and comes with a flexible duct and a chimney, so you place the heater outside and lead the warm air in. Rents on its own or with our shelters, generators and vehicles, delivered anywhere in Iceland.',
      is: 'Master BV 77 E er óbeinn olíuhitablásari: útblásturinn fer út um sérstakan stromp og aðeins hreint, þurrt og lyktarlaust heitt loft kemur inn í rýmið. Þess vegna er hann staðalbúnaður til að hita tjöld tökuliðs, biðsvæði og grunnbúðir í vetrartökum á Íslandi.\n\nHann gengur um 19 klukkustundir á tankfylli og kemur með barka og strompi, svo blásarinn stendur úti og heita loftið er leitt inn. Leigist stakur eða með tjöldum, rafstöðvum og bílum, afhentur hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Indirect-fired: 100% clean, dry, odourless air',
        is: 'Óbeinn bruni: hreint, þurrt og lyktarlaust loft',
      },
      {
        en: '21 kW output, about 19 hours per tank',
        is: '21 kW, um 19 klst. á tankfylli',
      },
      {
        en: 'Flexible duct and chimney included',
        is: 'Barki og strompur fylgja',
      },
      {
        en: 'Ideal for crew tents, holding and basecamp',
        is: 'Tilvalinn í tjöld, biðsvæði og grunnbúðir',
      },
    ],
    images: [
      '/images/equipment/master-bv-77.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mr754bmhf449',
    slug: 'master-oliuhitablasari-bv-290-e-81-kw',
    category: 'heating',
    name: {
      en: 'Diesel Heater 81 kW (Master BV 290 E)',
      is: 'Olíuhitablásari 81 kW (Master BV 290 E)',
    },
    tagline: {
      en: 'High-output indirect heater pushing 3,300 m³/h: heats big tents, halls and large sets fast. 100% clean, dry, odourless air straight into your tents or other big areas. Comes with 2x tubes, a splitter and a chimney to direct the heat to the desired space.',
      is: 'Aflmikill óbeinn hitablásari sem skilar 3.300 m³/klst. og hitar stór tjöld, sali og stærri tökustaði hratt. Hreint, þurrt og lyktarlaust loft í tjöld og önnur stærri rými. Kemur með 2x börkum, splitter og strompi til að leiða hitann rétt.',
    },
    description: {
      en: 'The Master BV 290 E is the big indirect diesel heater in our kit: 81 kW and 3,300 m³ of warm air per hour, enough to bring a large tent, a hall or a sizeable set up to temperature quickly. Combustion gases leave through the chimney, so the air it delivers is clean, dry and odourless.\n\nIt comes with two ducts, a splitter and a chimney, so one heater can feed two spaces or two ends of a long tent. Pair it with a generator or a three-phase distribution board from us and it arrives ready to run, anywhere in Iceland.',
      is: 'Master BV 290 E er stóri óbeini olíuhitablásarinn í safninu okkar: 81 kW og 3.300 m³ af heitu lofti á klukkustund, nóg til að hita stórt tjald, sal eða stærri tökustað hratt. Útblásturinn fer út um strompinn og loftið sem kemur inn er hreint, þurrt og lyktarlaust.\n\nHann kemur með tveimur börkum, splitter og strompi, svo einn blásari getur hitað tvö rými eða báða enda á löngu tjaldi. Með rafstöð eða þriggja fasa rafmagnstöflu frá okkur kemur hann tilbúinn í gang, hvert á land sem er.',
    },
    highlights: [
      {
        en: '81 kW, 3,300 m³/h of clean warm air',
        is: '81 kW, 3.300 m³/klst. af hreinu heitu lofti',
      },
      {
        en: 'Two ducts, splitter and chimney included',
        is: 'Tveir barkar, splitter og strompur fylgja',
      },
      {
        en: 'Heats large tents, halls and big sets fast',
        is: 'Hitar stór tjöld, sali og stærri tökustaði hratt',
      },
      {
        en: 'Rents with generators and distribution boards',
        is: 'Leigist með rafstöðvum og rafmagnstöflum',
      },
    ],
    images: [
      '/images/equipment/master-bv-290.jpg',
    ],
    featured: true,
  },
  {
    id: 'e-mr754brqcd2c',
    slug: 'framlengingarsnura-stinger-20m',
    category: 'power',
    name: {
      en: 'Schuko Extension Cable / Stinger 20 m',
      is: 'Framlengingarsnúra / stinger 20 m',
    },
    tagline: {
      en: 'Heavy-duty Schuko extension cable, the classic 20 m stinger for power distribution on set. Weatherproof rubber, IP44, H07RN-F.',
      is: 'Öflug Schuko framlengingarsnúra, klassískur 20m stinger. Úr veðurþolnu gúmmí. IP44, H07RN-F.',
    },
    description: {
      en: 'A heavy-duty 20 m Schuko extension cable in weatherproof rubber (H07RN-F, IP44): the classic stinger that gets power around a set, a work site or an event. Stands up to wet ground, gravel and crew traffic day after day.\n\nRents in quantity with our cable reels, multiplugs, distribution boards and generators. Delivered anywhere in Iceland.',
      is: 'Öflug 20 m Schuko framlengingarsnúra úr veðurþolnu gúmmíi (H07RN-F, IP44): klassíski stingerinn sem dreifir rafmagni um tökustað, vinnusvæði eða viðburð. Þolir bleytu, möl og umferð tökuliðs dag eftir dag.\n\nLeigist í magni með rafmagnskeflum, fjöltengjum, rafmagnstöflum og rafstöðvum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '20 m, H07RN-F rubber, IP44',
        is: '20 m, H07RN-F gúmmí, IP44',
      },
      {
        en: 'Schuko plug and socket',
        is: 'Schuko kló og tengill',
      },
      {
        en: 'Rents in quantity with the power kit',
        is: 'Leigist í magni með rafmagnsbúnaði',
      },
    ],
    images: [
      '/uploads/mrpjjm5s-cbd9346a.png',
      '/uploads/mrpjjmfn-bfc1788d.png',
    ],
    featured: false,
  },
  {
    id: 'e-mr754bxk8aeb',
    slug: 'rafstod-3-3-kva-230v-cgm-cg3300ie',
    category: 'power',
    name: {
      en: 'Inverter Generator 3.3 kVA 230V (CGM CG3300IE)',
      is: 'Rafstöð 3,3 kVA 230V (CGM CG3300IE)',
    },
    tagline: {
      en: 'Quiet 58 dB inverter generator with electric start, AVR and USB outlets.',
      is: 'Hljóðlát rafstöð (58 dB) með rafstarti, spennujafnara og USB-tengjum, tilvalið fyrir flest öll raftæki',
    },
    description: {
      en: 'A 3.3 kVA inverter generator from CGM with electric start, a voltage regulator (AVR) and USB outlets. Inverter output is clean enough for cameras, laptops, chargers and lighting, and at 58 dB it is quiet enough to run near set without getting into the sound.\n\nIt powers a heater, a few lights and the charging table at basecamp, or a small set on its own. Rents with our cable reels, multiplugs and distribution boards, delivered anywhere in Iceland.',
      is: '3,3 kVA inverter-rafstöð frá CGM með rafstarti, spennujafnara (AVR) og USB-tengjum. Inverter-straumurinn er nógu hreinn fyrir myndavélar, tölvur, hleðslutæki og ljós, og með 58 dB er hún nógu hljóðlát til að ganga nálægt setti án þess að heyrast í hljóðinu.\n\nHún keyrir hitablásara, nokkur ljós og hleðsluborðið í grunnbúðum, eða lítið sett ein og sér. Leigist með rafmagnskeflum, fjöltengjum og rafmagnstöflum, afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '3.3 kVA, 230 V inverter output safe for electronics',
        is: '3,3 kVA, 230 V inverter-straumur öruggur fyrir rafeindatæki',
      },
      {
        en: 'Electric start, AVR and USB outlets',
        is: 'Rafstart, spennujafnari og USB-tengi',
      },
      {
        en: 'Quiet: about 58 dB',
        is: 'Hljóðlát: um 58 dB',
      },
    ],
    images: [
      '/images/equipment/generator-cg3300ie.webp',
    ],
    featured: false,
  },
  {
    id: 'e-mr754c3jf5e5',
    slug: 'rafstod-2-2-kva-230v-cgm-cg2200i',
    category: 'power',
    name: {
      en: 'Inverter Generator 2.2 kVA 230V (CGM CG2200I)',
      is: 'Rafstöð 2,2 kVA 230V (CGM CG2200I)',
    },
    tagline: {
      en: 'Compact 22 kg inverter generator, quiet and easy to carry anywhere power is needed.',
      is: 'Nett 22 kg inverter-rafstöð, hljóðlát og létt að bera hvert sem rafmagn vantar.',
    },
    description: {
      en: 'The CGM CG2200I is the small, quiet inverter generator: 2.2 kVA of clean 230 V power in a 22 kg suitcase you carry with one hand. It is the one to bring when a location has no power at all and you need to run chargers, a light or two, a monitor or a small heater.\n\nInverter output means no spikes for sensitive camera and sound gear. Rents on its own or with the rest of the power kit, delivered anywhere in Iceland.',
      is: 'CGM CG2200I er litla, hljóðláta inverter-rafstöðin: 2,2 kVA af hreinum 230 V straumi í 22 kg tösku sem einn maður ber. Hún er sú sem fer með þegar tökustaðurinn er alveg rafmagnslaus og það þarf að keyra hleðslutæki, eitt eða tvö ljós, skjá eða lítinn hitara.\n\nInverter-straumur þýðir engar spennusveiflur fyrir viðkvæman myndavéla- og hljóðbúnað. Leigist stök eða með öðrum rafmagnsbúnaði, afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '2.2 kVA, 230 V inverter output',
        is: '2,2 kVA, 230 V inverter-straumur',
      },
      {
        en: 'Only 22 kg, carried by one person',
        is: 'Aðeins 22 kg, einn maður ber hana',
      },
      {
        en: 'Quiet enough to run near set',
        is: 'Nógu hljóðlát til að ganga nálægt setti',
      },
    ],
    images: [
      '/images/equipment/generator-cg2200i.webp',
    ],
    featured: true,
  },
  {
    id: 'e-mr754c8n9357',
    slug: 'kastari-led-nova-6k-med-thrifaeti',
    category: 'lighting',
    name: {
      en: 'LED Floodlight 6,000 lm on Tripod (NOVA 6K)',
      is: 'LED kastari 6.000 lm á þrífæti (NOVA 6K)',
    },
    tagline: {
      en: '6,000-lumen dimmable COB floodlight (IP67) on a 1.35–3 m tripod, this is battery powered so easy to set up whenever its needed, durable work light for night setups.',
      is: '6.000 lúmena deyfanlegur COB-kastari (IP67) á 1,35–3 m þrífæti, þetta eru batterísljós og þannig auðvelt að henda upp þegar þess þarf. Mjög gott fyrir næturtökur eða þegar fer að myrkva.',
    },
    description: {
      en: 'A battery-powered LED work light that puts out 6,000 lumens from a dimmable COB panel, mounted on a tripod that extends from 1.35 to 3 metres. No cable to run, so it goes up in a minute wherever light is needed: a basecamp walkway, a parking area, a night exterior or an early winter morning.\n\nThe head is IP67 rated, so rain and snow are not a problem. Rents on its own or with our generators and Scangrip lights, delivered anywhere in Iceland.',
      is: 'Batterísknúinn LED vinnukastari sem gefur 6.000 lúmen frá deyfanlegri COB-plötu, á þrífæti sem nær frá 1,35 upp í 3 metra. Engin snúra, svo hann fer upp á mínútu þar sem ljós vantar: á göngustíg í grunnbúðum, á bílastæði, í næturtöku eða á dimmum vetrarmorgni.\n\nHausinn er IP67 vottaður, svo rigning og snjór skipta engu máli. Leigist stakur eða með rafstöðvum og Scangrip ljósum, afhentur hvert á land sem er.',
    },
    highlights: [
      {
        en: '6,000 lumens, dimmable COB LED',
        is: '6.000 lúmen, deyfanlegt COB LED',
      },
      {
        en: 'Battery powered, no cable to run',
        is: 'Batterísknúinn, engin snúra',
      },
      {
        en: 'Tripod from 1.35 to 3 m, IP67 head',
        is: 'Þrífótur 1,35 til 3 m, IP67 haus',
      },
    ],
    images: [
      '/images/equipment/led-nova-6k.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mr754cdu38ba',
    slug: 'oryggisvesti',
    category: 'safety',
    name: {
      en: 'High Visibility Safety Vest',
      is: 'Öryggisvesti',
    },
    tagline: {
      en: 'Hi-vis vest for crew working around traffic, vehicles and machinery.',
      is: 'Endurskinsvesti fyrir tökulið sem vinnur nálægt umferð, ökutækjum og vinnuvélum.',
    },
    description: {
      en: 'A high-visibility reflective vest for anyone working near traffic, vehicles and machinery: crew on a road shoot, traffic marshals, event staff and contractors. Rents in quantity so the whole team is visible.\n\nRents with our traffic cones, signs and hazard beacons. Delivered anywhere in Iceland.',
      is: 'Endurskinsvesti í áberandi lit fyrir alla sem vinna nálægt umferð, ökutækjum og vinnuvélum: tökulið á vegi, umferðarstjórn, starfsfólk viðburða og verktaka. Leigist í magni svo allur hópurinn sé sýnilegur.\n\nLeigist með umferðarkeilum, skiltum og blikkljósum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Hi-vis with reflective strips',
        is: 'Áberandi litur með endurskini',
      },
      {
        en: 'Rents in quantity for the whole crew',
        is: 'Leigist í magni fyrir allt liðið',
      },
      {
        en: 'Pairs with cones and signs',
        is: 'Með keilum og skiltum',
      },
    ],
    images: [
      '/images/equipment/safety-vest.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mr754cj10dbb',
    slug: 'samanbrjotanlegur-stoll',
    category: 'furniture',
    name: {
      en: 'Folding Chair',
      is: 'Samanbrjótanlegur stóll',
    },
    tagline: {
      en: 'Black folding chair for basecamp, catering and video village seating.',
      is: 'Svartur samanbrjótanlegur stóll fyrir grunnbúðir, catering og video village.',
    },
    description: {
      en: 'A black folding chair that stacks and fits in any of our vehicles. For basecamp, the catering tent, video village, holding areas and events; rents in quantity so everyone has a seat.\n\nRents with our folding tables, tents and heaters for a complete basecamp. Delivered anywhere in Iceland.',
      is: 'Svartur samanbrjótanlegur stóll sem staflast og fer í hvaða bíl sem er. Fyrir grunnbúðir, veitingatjald, video village, biðsvæði og viðburði; leigist í magni svo allir fái sæti.\n\nLeigist með samanbrjótanlegum borðum, tjöldum og hitablásurum fyrir fullbúnar grunnbúðir. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Folds flat, stacks for transport',
        is: 'Leggst saman, staflast í flutningi',
      },
      {
        en: 'Rents in quantity',
        is: 'Leigist í magni',
      },
      {
        en: 'Pairs with folding tables and tents',
        is: 'Með samanbrjótanlegum borðum og tjöldum',
      },
    ],
    images: [
      '/images/equipment/folding-chair.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mr754coccab2',
    slug: 'samanbrjotanlegt-bord-183-cm-2-stk',
    category: 'furniture',
    name: {
      en: 'Fold-in-Half Table (2-pack)',
      is: 'Samanbrjótanlegt borð 183 cm (2 stk.)',
    },
    tagline: {
      en: 'Commercial-grade 183 cm tables that fold in half, indoor/outdoor, easy to carry.',
      is: 'Vinnuborð sem klikkar aldrei: 183 cm, brotnar saman í tvennt, hentar úti sem inni og er auðvelt í flutningi.',
    },
    description: {
      en: 'A sturdy 183 cm commercial-grade table that folds in half and carries like a suitcase. Works indoors and out: catering, makeup, the charging table, event registration or a work surface on site. Two tables per pack.\n\nRents with our chairs, tents and heaters. Delivered anywhere in Iceland.',
      is: 'Sterkt 183 cm vinnuborð sem brotnar saman í tvennt og berst eins og taska. Þolir úti sem inni: veitingar, förðun, hleðsluborð, skráning á viðburði eða vinnuborð á verkstað. Tvö borð í pakka.\n\nLeigist með stólum, tjöldum og hitablásurum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '183 cm, folds in half',
        is: '183 cm, brotnar saman í tvennt',
      },
      {
        en: 'Indoor and outdoor',
        is: 'Úti sem inni',
      },
      {
        en: 'Two tables per pack',
        is: 'Tvö borð í pakka',
      },
    ],
    images: [
      '/images/equipment/folding-table-lifetime.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mre0iyjs764f',
    slug: 'rafmagnskefli-25-m',
    category: 'power',
    name: {
      en: 'Cable Reel 25m',
      is: 'Rafmagnskefli 25 m',
    },
    tagline: {
      en: 'Outdoor-rated 25 m extension reel (IP44) with three sockets, oil- and UV-resistant, usable down to −35°C.',
      is: 'Útikefli með 25 m snúru (IP44) og þremur tenglum, olíu- og UV-þolið, nothæft niður í −35°C.',
    },
    description: {
      en: 'An outdoor cable reel with 25 m of cable and three sockets (IP44). Oil- and UV-resistant and usable down to −35°C, so it keeps working through an Icelandic winter on set, on site or at an event.\n\nRents with our stingers, multiplugs and generators. Delivered anywhere in Iceland.',
      is: 'Útikefli með 25 m snúru og þremur tenglum (IP44). Olíu- og UV-þolið og nothæft niður í −35°C, svo það gengur í íslenskum vetri á tökustað, vinnusvæði eða viðburði.\n\nLeigist með stingerum, fjöltengjum og rafstöðvum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '25 m, three sockets, IP44',
        is: '25 m, þrír tenglar, IP44',
      },
      {
        en: 'Rated to −35°C',
        is: 'Nothæft niður í −35°C',
      },
      {
        en: 'Oil- and UV-resistant',
        is: 'Olíu- og UV-þolið',
      },
    ],
    images: [
      '/images/equipment/cable-reel-25m.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-016',
    slug: 'drattartog-15-m-24-mm',
    category: 'tools',
    name: {
      en: 'Tow Rope 15 m × 24 mm',
      is: 'Dráttartóg 15 m × 24 mm',
    },
    tagline: {
      en: 'Elastic nylon recovery rope with a spliced loop, for towing and recovering vehicles on location.',
      is: 'Teygjanlegt nælontóg með splæstri lykkju, til að draga og losa ökutæki á tökustað.',
    },
    description: {
      en: 'A 15 m elastic nylon recovery rope, 24 mm, with a spliced loop. The stretch takes the shock out of a pull, so a vehicle stuck in snow, sand or mud comes free without wrenching the mounting points.\n\nRents with our pickup and six-wheeler or on its own. Delivered anywhere in Iceland.',
      is: '15 m teygjanlegt nælontóg, 24 mm, með splæstri lykkju. Teygjan tekur höggið úr rykknum, svo bíll sem situr fastur í snjó, sandi eða drullu losnar án þess að rífa í festingarnar.\n\nLeigist með pallbílnum og sexhjólinu eða eitt og sér. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '15 m × 24 mm elastic nylon',
        is: '15 m × 24 mm teygjanlegt nælon',
      },
      {
        en: 'Spliced loop',
        is: 'Splæst lykkja',
      },
      {
        en: 'For snow, sand and mud recoveries',
        is: 'Til að losa úr snjó, sandi og drullu',
      },
    ],
    images: [
      '/images/equipment/tow-rope-15m.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-017',
    slug: 'yfirbreidsla-3-6-4-8-m-2-stk',
    category: 'shelter',
    name: {
      en: 'Heavy-Duty Tarp 3.6×4.8 m (2-pack)',
      is: 'Yfirbreiðsla 3,6×4,8 m (2 stk.)',
    },
    tagline: {
      en: 'Waterproof tarps with reinforced corners and grommets, cover gear and vehicles or rig quick weather protection on set.',
      is: 'Vatnsheldar yfirbreiðslur með styrktum hornum og festingaraugum, verja búnað og ökutæki eða veita skjól á tökustað.',
    },
    description: {
      en: 'Waterproof tarps, 3.6 × 4.8 m, with reinforced corners and grommets all round. Cover gear, vehicles and materials, or rig them as a rain shelter over a work area, catering or the tent entrance. Two per pack.\n\nRents with our lashing straps, clamps and sandbags. Delivered anywhere in Iceland.',
      is: 'Vatnsheldar yfirbreiðslur, 3,6 × 4,8 m, með styrktum hornum og festingaraugum allan hringinn. Breiða yfir búnað, bíla og efni, eða strekkja upp sem regnskjól yfir vinnusvæði, veitingar eða við tjaldið. Tvær í pakka.\n\nLeigjast með strekkiböndum, klemmum og sandpokum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '3.6 × 4.8 m, waterproof',
        is: '3,6 × 4,8 m, vatnsheldar',
      },
      {
        en: 'Reinforced corners, grommets',
        is: 'Styrkt horn, festingaraugu',
      },
      {
        en: 'Two per pack',
        is: 'Tvær í pakka',
      },
    ],
    images: [
      '/images/equipment/tarp-heavy-duty.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-018',
    slug: 'starttaeki-fyrir-vorubila-24v',
    category: 'tools',
    name: {
      en: 'Jump Starter for Trucks 24V (NOCO GB251+)',
      is: 'Starttæki fyrir vörubíla 24V (NOCO GB251+)',
    },
    tagline: {
      en: '3000 A lithium jump starter for 24V diesel and petrol engines up to 32 L trucks, buses and heavy machinery, with USB charging and LED work light.',
      is: '3000 A starttæki fyrir 24V dísil- og bensínvélar allt að 32 L vörubíla, rútur og vinnuvélar, með USB-hleðslu og LED-vinnuljósi.',
    },
    description: {
      en: 'The NOCO GB251+ is a 3000 A lithium jump starter for 24 V diesel and petrol engines up to 32 litres: trucks, buses, heavy machinery and generators. Starts a dead vehicle on the spot with no second vehicle needed. USB charging and an LED work light built in.\n\nFor 12 V cars and vans see the NOCO GBX155. Rents with our vehicles or on its own. Delivered anywhere in Iceland.',
      is: 'NOCO GB251+ er 3000 A litíum-starttæki fyrir 24 V dísil- og bensínvélar allt að 32 lítra: vörubíla, rútur, vinnuvélar og rafstöðvar. Kemur dauðum bíl í gang á staðnum án þess að þurfa annað ökutæki. Með USB-hleðslu og LED-vinnuljósi.\n\nFyrir 12 V bíla og sendibíla er NOCO GBX155. Leigist með bílunum okkar eða eitt og sér. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '3000 A, 24 V engines up to 32 L',
        is: '3000 A, 24 V vélar allt að 32 l',
      },
      {
        en: 'No second vehicle needed',
        is: 'Þarf ekki annað ökutæki',
      },
      {
        en: 'USB charging, LED work light',
        is: 'USB-hleðsla, LED-vinnuljós',
      },
    ],
    images: [
      '/images/equipment/jump-starter-noco-gb251.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-019',
    slug: 'bensin-og-disilbrusi-ur-stali-20-l',
    category: 'power',
    name: {
      en: 'Steel Fuel Can 20 L (Petrol & Diesel)',
      is: 'Bensín- og dísilbrúsi úr stáli 20 l',
    },
    tagline: {
      en: 'Classic 20-litre steel jerry can for petrol or diesel, keeps generators and heaters fuelled on location.',
      is: 'Klassískur 20 lítra stálbrúsi fyrir bensín eða dísil, heldur rafstöðvum og miðstöðvum gangandi á tökustað.',
    },
    description: {
      en: 'A classic 20-litre steel jerry can for petrol or diesel. Keeps generators, heaters and vehicles running where the nearest fuel station is far away.\n\nRents with our generators and diesel heaters. Delivered anywhere in Iceland.',
      is: 'Klassískur 20 lítra stálbrúsi fyrir bensín eða dísil. Heldur rafstöðvum, hitablásurum og bílum gangandi þar sem næsta bensínstöð er langt í burtu.\n\nLeigist með rafstöðvunum og olíuhitablásurunum okkar. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '20 L steel, petrol or diesel',
        is: '20 l stál, bensín eða dísil',
      },
      {
        en: 'Pairs with generators and heaters',
        is: 'Með rafstöðvum og hitablásurum',
      },
    ],
    images: [
      '/images/equipment/fuel-can-20l.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-020',
    slug: 'starttaeki-12v-noco-gbx155',
    category: 'tools',
    name: {
      en: 'Jump Starter 12V (NOCO GBX155)',
      is: 'Starttæki 12V (NOCO GBX155)',
    },
    tagline: {
      en: '4250 A lithium jump starter for 12V petrol engines up to 10 L and diesels up to 8 L cars, vans and machinery, with USB-C charging and a 500-lumen LED light.',
      is: '4250 A starttæki fyrir 12V bensínvélar allt að 10 L og dísilvélar allt að 8 L bíla, sendibíla og vinnuvélar, með USB-C hleðslu og 500 lúmena LED-ljósi.',
    },
    description: {
      en: 'The NOCO GBX155 is a 4250 A lithium jump starter for 12 V petrol engines up to 10 litres and diesels up to 8 litres: cars, SUVs, vans and machinery. Small enough for the glovebox, strong enough for a frozen morning start. USB-C charging and a 500-lumen LED light built in.\n\nFor 24 V trucks see the NOCO GB251+. Rents with our vehicles or on its own. Delivered anywhere in Iceland.',
      is: 'NOCO GBX155 er 4250 A litíum-starttæki fyrir 12 V bensínvélar allt að 10 lítra og dísilvélar allt að 8 lítra: fólksbíla, jeppa, sendibíla og vinnuvélar. Nógu lítið í hanskahólfið, nógu öflugt í frosið morgunræs. Með USB-C hleðslu og 500 lúmena LED-ljósi.\n\nFyrir 24 V vörubíla er NOCO GB251+. Leigist með bílunum okkar eða eitt og sér. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '4250 A, 12 V petrol to 10 L, diesel to 8 L',
        is: '4250 A, 12 V bensín að 10 l, dísil að 8 l',
      },
      {
        en: 'Fits in the glovebox',
        is: 'Kemst í hanskahólfið',
      },
      {
        en: 'USB-C charging, 500 lm light',
        is: 'USB-C hleðsla, 500 lm ljós',
      },
    ],
    images: [
      '/images/equipment/noco-gbx155.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-021',
    slug: 'eskimo-outbreak-450xdp-einangrad-skjoltjald',
    category: 'shelter',
    name: {
      en: 'Insulated Pop-Up Tent (Eskimo Outbreak 450XDP)',
      is: 'Einangrað skjóltjald (Eskimo Outbreak 450XDP)',
    },
    tagline: {
      en: 'Insulated 4–5 person pop-up shelter (~7 m² floor) with StormShield fabric, 7 windows and heater ports, a warm crew refuge.',
      is: 'Einangrað popup tjald rúmar 4–5 manns (~7 m² gólf) með StormShield-dúk, 7 gluggum og hitaraopum, hlýtt skjól fyrir tökuliðið.',
    },
    description: {
      en: 'An insulated pop-up shelter for four to five people with about 7 m² of floor. The Eskimo Outbreak 450XDP uses StormShield fabric, has seven windows and heater ports, and goes up in minutes with no tools. Put a diesel heater on it and you have a warm refuge for talent and crew between takes, a makeup corner or a dry spot for the monitor.\n\nIt rents on its own or with our heaters, tarps and sandbags, and travels in any of our vehicles. Delivered anywhere in Iceland.',
      is: 'Einangrað popup tjald fyrir fjóra til fimm með um 7 m² gólffleti. Eskimo Outbreak 450XDP er úr StormShield-dúk, með sjö gluggum og opum fyrir hitara, og fer upp á nokkrum mínútum án verkfæra. Með olíuhitablásara við það ertu komin með hlýtt skjól fyrir leikara og tökulið milli taka, förðunarhorn eða þurran stað fyrir skjáinn.\n\nÞað leigist stakt eða með hitablásurum, yfirbreiðslum og sandpokum og kemst í hvaða bíl sem er hjá okkur. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Insulated, 4 to 5 people, about 7 m² floor',
        is: 'Einangrað, 4 til 5 manns, um 7 m² gólf',
      },
      {
        en: 'Seven windows and heater ports',
        is: 'Sjö gluggar og op fyrir hitara',
      },
      {
        en: 'Pops up in minutes, no tools',
        is: 'Fer upp á mínútum, engin verkfæri',
      },
      {
        en: 'Pairs with our diesel heaters',
        is: 'Passar með olíuhitablásurunum okkar',
      },
    ],
    images: [
      '/images/equipment/eskimo-outbreak-450xdp.png',
    ],
    featured: true,
  },
  {
    id: 'e-022',
    slug: 'plaststaur-med-hrutshorni',
    category: 'safety',
    name: {
      en: 'Portable Fence Post with Ram\'s Horn',
      is: 'Plaststaur með hrútshorni',
    },
    tagline: {
      en: 'Lightweight 99 cm PVC post with a metal ground spike and ram\'s-horn hook, quick temporary fencing on location.',
      is: 'Léttur 99 cm plaststaur með málmoddi og hrútshorni, fljótleg bráðabirgðagirðing fyrir tökustað.',
    },
    description: {
      en: 'A lightweight 99 cm PVC post with a metal ground spike and a ram\'s-horn hook that holds tape or rope. A few posts and a roll of tape make a temporary fence around a set, an event area, parking or a work site in minutes.\n\nRents in quantity with our cones, Skipper tape barriers and signs. Delivered anywhere in Iceland.',
      is: 'Léttur 99 cm plaststaur með málmoddi sem rekst í jörð og hrútshorni sem heldur borða eða snúru. Nokkrir staurar og borði gera bráðabirgðagirðingu um tökustað, viðburðasvæði, bílastæði eða vinnusvæði á nokkrum mínútum.\n\nLeigist í magni með keilum, Skipper-borðum og skiltum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '99 cm, metal ground spike',
        is: '99 cm, málmoddur í jörð',
      },
      {
        en: 'Ram\'s-horn hook for tape or rope',
        is: 'Hrútshorn fyrir borða eða snúru',
      },
      {
        en: 'Rents in quantity',
        is: 'Leigist í magni',
      },
    ],
    images: [
      '/uploads/mrl0mxcy-b323c800.png',
    ],
    featured: false,
  },
  {
    id: 'e-023',
    slug: 'strekkibordi-0-25-t',
    category: 'shelter',
    name: {
      en: 'Lashing Strap 0.25 t',
      is: 'Strekkiborði 0,25 t',
    },
    tagline: {
      en: '1-3 m lashing strap for securing gear and cargo on trailers and trucks.',
      is: '1-3 m langur strekkiborði sem festir búnað og farm á kerrum og vörubílum.',
    },
    description: {
      en: 'A 1 to 3 m lashing strap rated 0.25 t, for securing lighter gear and cargo on trailers, in vans and on roof racks. Quick to use and no hooks to scratch.\n\nFor heavier loads see the ratchet straps with hooks. Rents with our trailers and vehicles. Delivered anywhere in Iceland.',
      is: 'Strekkiborði, 1 til 3 m, 0,25 tonna, til að festa léttari búnað og farm á kerrum, í bílum og á toppgrindum. Fljótlegur í notkun og engir krókar sem rispa.\n\nFyrir þyngri farm eru strekkjararnir með krók. Leigist með kerrunum og bílunum okkar. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '1 to 3 m, 0.25 t',
        is: '1 til 3 m, 0,25 t',
      },
      {
        en: 'No hooks, no scratches',
        is: 'Engir krókar, engar rispur',
      },
      {
        en: 'For trailers, vans and roof racks',
        is: 'Fyrir kerrur, sendibíla og toppgrindur',
      },
    ],
    images: [
      '/images/equipment/strekkibordi-lashing-belt.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-024',
    slug: 'strekkjari-med-krok-appelsinugulur',
    category: 'shelter',
    name: {
      en: 'Ratchet Strap with Hook (orange)',
      is: 'Strekkjari með krók (appelsínugulur)',
    },
    tagline: {
      en: 'Two-part ratchet strap with hook, lengths up to 10 m, for securing heavy cargo and gear on trailers and trucks.',
      is: 'Tvískiptur strekkjari með borða og krók, lengdir allt að 10 m, til að festa þyngri farm og búnað á kerrum og vörubílum.',
    },
    description: {
      en: 'A two-part ratchet strap with hooks, lengths up to 10 m, for heavier cargo and gear on trailers and trucks. The ratchet pulls the strap tight and the hooks go into the trailer\'s tie-down points.\n\nRents with our trailers and vehicles. Delivered anywhere in Iceland.',
      is: 'Tvískiptur strekkjari með borða og krók, lengdir allt að 10 m, fyrir þyngri farm og búnað á kerrum og vörubílum. Skrallið strekkir borðann fastan og krókarnir ganga í festingaraugu kerrunnar.\n\nLeigist með kerrunum og bílunum okkar. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Lengths up to 10 m',
        is: 'Lengdir allt að 10 m',
      },
      {
        en: 'Ratchet tensioner and hooks',
        is: 'Skrall og krókar',
      },
      {
        en: 'For trailers and trucks',
        is: 'Fyrir kerrur og vörubíla',
      },
    ],
    images: [
      '/images/equipment/ratchet-strap-orange.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mrl0eqb86480',
    slug: 'umferdarkeilur-50-cm',
    category: 'safety',
    name: {
      en: 'Traffic Cones 50 cm',
      is: 'Umferðarkeilur 50 cm',
    },
    tagline: {
      en: '50 cm traffic cones for closing off sets, parking and work areas.',
      is: '50 cm umferðarkeilur til að loka af tökustaði, bílastæði og vinnusvæði.',
    },
    description: {
      en: 'Standard 50 cm traffic cones for closing off a set, reserving parking or marking a work area. Light enough to carry a stack, visible enough that nobody drives into the frame. We rent them in quantity, so a whole street or basecamp can be marked from one delivery.\n\nJust as useful for events, construction sites, housing associations and moving days as for film shoots. Combine with our 75 and 100 cm cones, detour signs, filming signs and cone lights for a complete traffic kit. Delivered anywhere in Iceland.',
      is: 'Venjulegar 50 cm umferðarkeilur til að loka af tökustað, taka frá bílastæði eða merkja vinnusvæði. Nógu léttar til að bera stafla, nógu áberandi til að enginn keyri inn í rammann. Við leigjum þær í magni, svo heil gata eða grunnbúðir merkjast úr einni afhendingu.\n\nJafn gagnlegar fyrir viðburði, framkvæmdir, húsfélög og flutninga og fyrir kvikmyndatökur. Með 75 og 100 cm keilunum, hjáleiðarskiltum, tökuskiltum og keiluljósum verður þetta heill umferðarpakki. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '50 cm, light and stackable',
        is: '50 cm, léttar og staflanlegar',
      },
      {
        en: 'Rented in quantity for streets and basecamp',
        is: 'Leigðar í magni fyrir götur og grunnbúðir',
      },
      {
        en: 'Part of a full traffic kit with signs and lights',
        is: 'Hluti af heilum umferðarpakka með skiltum og ljósum',
      },
    ],
    images: [
      '/uploads/mrl0ekpj-4d0c2ede.png',
    ],
    featured: true,
  },
  {
    id: 'e-025',
    slug: 'umferdarkeilur-75-cm',
    category: 'safety',
    name: {
      en: 'Traffic Cones 75 cm with Reflective Tapes',
      is: 'Umferðarkeilur 75 cm með endurskini',
    },
    tagline: {
      en: '75 cm orange traffic cones with two class 2 reflective tapes and a heavy rubber base, for road work and night shoots.',
      is: '75 cm appelsínugular umferðarkeilur með tveimur endurskinsböndum í flokki 2 og þungum gúmmífæti, fyrir vegavinnu og næturtökur.',
    },
    description: {
      en: 'Fluorescent orange 75 cm traffic cones with two class 2 (RA2) retroreflective tapes that light up in headlights, so they stay visible on a road long after the light goes. The heavy black rubber base keeps them standing in wind and passing traffic, and they stack neatly for transport. Built to EN 13422.\n\nThe middle size between our 50 cm and 100 cm cones: tall enough for road and shoulder work, easy to carry by the stack. For film shoots, road work, events and construction sites alike. Rents in quantity with detour signs, filming signs and LED cone lights. Delivered anywhere in Iceland.',
      is: 'Skær appelsínugular 75 cm umferðarkeilur með tveimur endurskinsböndum í flokki 2 (RA2) sem lýsa upp í bílljósum, svo þær sjást vel við veg löngu eftir að birtan fer. Þungur svartur gúmmífótur heldur þeim uppréttum í vindi og umferð og þær staflast vel í flutningi. Framleiddar samkvæmt EN 13422.\n\nMillistærðin á milli 50 cm og 100 cm keilnanna okkar: nógu háar fyrir vegi og vegaxlir, auðvelt að bera þær í stafla. Jafnt fyrir kvikmyndatökur, vegavinnu, viðburði og framkvæmdir. Leigjast í magni með hjáleiðarskiltum, tökuskiltum og LED keiluljósum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '75 cm, two class 2 (RA2) reflective tapes',
        is: '75 cm, tvö endurskinsbönd í flokki 2 (RA2)',
      },
      {
        en: 'Heavy rubber base, stable in wind',
        is: 'Þungur gúmmífótur, stöðugar í vindi',
      },
      {
        en: 'EN 13422 certified, stackable',
        is: 'Vottaðar samkvæmt EN 13422, staflanlegar',
      },
      {
        en: 'Part of a full traffic kit with signs and lights',
        is: 'Hluti af heilum umferðarpakka með skiltum og ljósum',
      },
    ],
    images: [
      '/images/equipment/traffic-cone-75cm-1.jpg',
      '/images/equipment/traffic-cone-75cm-2.jpg',
      '/images/equipment/traffic-cone-75cm-3.jpg',
      '/images/equipment/traffic-cone-75cm-4.jpg',
      '/images/equipment/traffic-cone-75cm-5.jpg',
      '/images/equipment/traffic-cone-75cm-6.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-026',
    slug: 'skipper-keiluhaus-med-9-m-borda',
    category: 'safety',
    name: {
      en: 'Cone-Top Tape Barrier 9 m (Skipper)',
      is: 'Keiluhaus með 9 m borða (Skipper)',
    },
    tagline: {
      en: 'Cone-top barrier with 9 m of retractable red and white hazard tape, for closing off sets and work areas in seconds.',
      is: 'Keiluhaus með 9 m útdraganlegum rauðum og hvítum hættuborða, til að loka af tökustöðum og vinnusvæðum á augabragði.',
    },
    description: {
      en: 'The Skipper sits on top of a traffic cone and holds 9 metres of red and white hazard tape on a retractor. Pull the tape out, clip it to the next Skipper, and the cones become a proper barrier line around a set, a camera position, a work area or an event entrance. A brake button on the side locks the tape at any length, so it stays taut and the cones stay standing even in strong wind, and at the end of the day it rolls back into the housing, clean and protected for the next job.\n\nNo more knotting barrier tape round cones or cutting it off a roll. Fits our 75 cm traffic cones and rents in quantity, so a whole street, a basecamp or an event site can be taped off from one delivery. Delivered anywhere in Iceland.',
      is: 'Skipper situr ofan á umferðarkeilu og geymir 9 metra af rauðum og hvítum hættuborða á inndraganlegri rúllu. Dragðu borðann út, kræktu hann í næsta Skipper og keilurnar verða að almennilegri lokunarlínu um tökustað, myndavélastöðu, vinnusvæði eða inngang á viðburð. Bremsuhnappur á hliðinni læsir borðanum í hvaða lengd sem er, svo hann helst strekktur og keilurnar standa jafnvel í hvassviðri, og í lok dags rúllast hann aftur inn í húsið, hreinn og varinn fyrir næsta verkefni.\n\nEkkert meira vesen við að hnýta borða um keilur eða klippa hann af rúllu. Passar á 75 cm umferðarkeilurnar okkar og leigist í magni, svo heil gata, grunnbúðir eða viðburðasvæði lokast úr einni afhendingu. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '9 m retractable red/white hazard tape',
        is: '9 m inndraganlegur rauður/hvítur hættuborði',
      },
      {
        en: 'Fits on top of a traffic cone',
        is: 'Situr ofan á umferðarkeilu',
      },
      {
        en: 'Clips cone to cone into a barrier line',
        is: 'Krækist keilu í keilu í lokunarlínu',
      },
      {
        en: 'Brake button keeps the tape taut in wind',
        is: 'Bremsuhnappur heldur borðanum strekktum í vindi',
      },
    ],
    images: [
      '/images/equipment/skipper-barrier-red-white-1.jpg',
      '/images/equipment/skipper-barrier-red-white-2.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-027',
    slug: 'utdraganleg-sla-a-umferdarkeilur-raud-hvit',
    category: 'safety',
    name: {
      en: 'Telescopic Cone Bar (red/white)',
      is: 'Útdraganleg slá á umferðarkeilur',
    },
    tagline: {
      en: 'Reflective red and white telescopic bar that hooks between two traffic cones for a quick, highly visible cordon.',
      is: 'Rauð og hvít útdraganleg slá með endurskini sem krækist á milli tveggja umferðarkeilna og myndar fljótlega og áberandi lokun.',
    },
    description: {
      en: 'A red and white telescopic bar with a loop at each end that drops over the top of a traffic cone. Pull it out to the gap you need, hook it between two cones and you have a solid, reflective barrier in seconds: across a lane, a parking spot, a basecamp entrance, an event gate or a no-go zone around the camera.\n\nIt reads as a proper closure where a row of cones alone gets driven or walked through, and the reflective striping picks up headlights at night. For film shoots, events, car parks and work sites. Rents in quantity with our 50, 75 and 100 cm cones, detour signs and LED cone lights. Delivered anywhere in Iceland.',
      is: 'Rauð og hvít útdraganleg slá með lykkju á hvorum enda sem smellur yfir topp umferðarkeilu. Dragðu hana út í það bil sem þarf, kræktu henni á milli tveggja keilna og þú ert með trausta lokun með endurskini á nokkrum sekúndum: yfir akrein, bílastæði, inngang í grunnbúðir, hlið á viðburði eða bannsvæði í kringum myndavélina.\n\nHún sést sem raunveruleg lokun þar sem fólk og bílar fara annars á milli keilnanna, og endurskinsröndin grípur bílljós í myrkri. Fyrir kvikmyndatökur, viðburði, bílastæði og vinnusvæði. Leigist í magni með 50, 75 og 100 cm keilunum okkar, hjáleiðarskiltum og LED keiluljósum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Telescopic, adjusts to the gap between cones',
        is: 'Útdraganleg, stillist að bilinu á milli keilna',
      },
      {
        en: 'Red/white with reflective striping',
        is: 'Rauð/hvít með endurskinsröndum',
      },
      {
        en: 'Loop ends drop over any standard cone',
        is: 'Lykkjur á endum passa á venjulegar keilur',
      },
      {
        en: 'Part of a full traffic kit with cones, signs and lights',
        is: 'Hluti af heilum umferðarpakka með keilum, skiltum og ljósum',
      },
    ],
    images: [
      '/images/equipment/telescopic-cone-bar-red-white-1.jpg',
      '/images/equipment/telescopic-cone-bar-red-white-2.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-028',
    slug: 'fordunarspegill-thridskiptur-med-led-ljosum',
    category: 'costume',
    name: {
      en: 'LED Makeup Mirror (Nestor Triptych)',
      is: 'Förðunarspegill með LED ljósum (Nestor)',
    },
    tagline: {
      en: 'Portable three-panel makeup mirror with dimmable LED light from 2700 to 6100 K, for makeup stations on location.',
      is: 'Færanlegur þrískiptur förðunarspegill með dimmanlegu LED ljósi frá 2700 til 6100 K, fyrir förðunarstöðvar á tökustað.',
    },
    description: {
      en: 'A professional makeup mirror built for film sets by Nestor in France. LED strips run around the central mirror and down the inside of both doors, lighting the face evenly from every side with no hot spots or shadows. The controller sets brightness from 0 to 100% and colour temperature from 2700 K to 6100 K, so makeup can be matched to tungsten, daylight or anything in between before the actor walks on set.\n\nA power strip, USB charger and clock are built in, so the makeup artist has everything they need at the station. Closed, the aluminium case folds into a 76 × 64 × 9 cm flat box of about 16 kg with a shoulder strap, and draws only 110 W, so it runs happily off a small generator or one of our campers. Rents with folding tables and chairs, clothes rails, tents and heaters for a complete makeup station on location. Delivered anywhere in Iceland.',
      is: 'Faglegur förðunarspegill hannaður fyrir kvikmyndatökur af Nestor í Frakklandi. LED ljósræmur liggja í kringum miðspegilinn og niður innanverðar hurðirnar og lýsa andlitið jafnt frá öllum hliðum, án heitra bletta eða skugga. Með stýringunni er birtan stillt frá 0 til 100% og litahitinn frá 2700 K til 6100 K, svo förðunin passar við glóperuljós, dagsbirtu eða allt þar á milli áður en leikarinn gengur inn á sett.\n\nFjöltengi, USB hleðslutæki og klukka eru innbyggð, svo förðunarfræðingurinn hefur allt við höndina á stöðinni. Lokaður leggst álkassinn saman í 76 × 64 × 9 cm flatan kassa sem vegur um 16 kg og er með axlaról, og hann notar aðeins 110 W, svo lítil rafstöð eða einn af húsbílunum okkar dugar vel. Leigist með samanbrjótanlegum borðum og stólum, fataslám, tjöldum og hiturum fyrir heila förðunarstöð á tökustað. Afhentur hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Dimmable LED light, 2700 to 6100 K',
        is: 'Dimmanlegt LED ljós, 2700 til 6100 K',
      },
      {
        en: 'Three panels light the face evenly from every side',
        is: 'Þrír flekar lýsa andlitið jafnt frá öllum hliðum',
      },
      {
        en: 'Built-in power strip, USB charger and clock',
        is: 'Innbyggt fjöltengi, USB hleðslutæki og klukka',
      },
      {
        en: 'Folds into a flat 16 kg case, only 110 W',
        is: 'Leggst saman í flatan 16 kg kassa, aðeins 110 W',
      },
    ],
    images: [
      '/images/equipment/makeup-mirror-triptych-1.jpg',
      '/images/equipment/makeup-mirror-triptych-2.jpg',
      '/images/equipment/makeup-mirror-triptych-3.jpg',
      '/images/equipment/makeup-mirror-triptych-4.jpg',
      '/images/equipment/makeup-mirror-triptych-5.jpg',
      '/images/equipment/makeup-mirror-triptych-6.jpg',
      '/images/equipment/makeup-mirror-triptych-7.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mw1dznnq20e9',
    slug: 'upplysingaskilti-a-umferdarkeilu',
    category: 'safety',
    name: {
      en: 'Clip-On Cone Sign (white)',
      is: 'Upplýsingaskilti á umferðarkeilu',
    },
    tagline: {
      en: 'White sign board that slides onto the top of a traffic cone, for parking, directions and set notices at eye level.',
      is: 'Hvítt skilti sem rennt er ofan á topp umferðarkeilu, fyrir bílastæði, leiðbeiningar og tilkynningar í augnhæð.',
    },
    description: {
      en: 'A white sign board with a slot that slides straight down over the top of a traffic cone. No tape, cable ties or stands: the cone holds it up and the sign sits high and level where drivers and pedestrians actually look.\n\nUse it for whatever the day needs: reserved parking, "filming in progress", directions to basecamp, catering or the toilets, an event entrance or a closed lane at a work site. Write on it or put a printed notice on it. Rents in quantity with our 50, 75 and 100 cm cones, detour signs and LED cone lights. Delivered anywhere in Iceland.',
      is: 'Hvítt skilti með rauf sem rennt er beint niður yfir topp umferðarkeilu. Ekkert límband, bensli eða standar: keilan heldur því uppi og skiltið situr hátt og beint þar sem ökumenn og gangandi horfa í raun.\n\nNotaðu það í það sem dagurinn kallar á: frátekin bílastæði, „tökur í gangi“, leiðbeiningar að grunnbúðum, veitingum eða salernum, inngang á viðburð eða lokaða akrein á vinnusvæði. Skrifaðu á það eða settu á það prentaða tilkynningu. Leigist í magni með 50, 75 og 100 cm keilunum okkar, hjáleiðarskiltum og LED keiluljósum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Slides onto the top of a standard traffic cone',
        is: 'Rennt ofan á topp venjulegrar umferðarkeilu',
      },
      {
        en: 'White board for parking, directions and set notices',
        is: 'Hvítt skilti fyrir bílastæði, leiðbeiningar og tilkynningar',
      },
      {
        en: 'No tape, ties or extra stands needed',
        is: 'Ekkert límband, bensli eða aukastandar',
      },
      {
        en: 'Part of a full traffic kit with cones and lights',
        is: 'Hluti af heilum umferðarpakka með keilum og ljósum',
      },
    ],
    images: [
      '/images/equipment/traffic-cone-sign-white-1.jpg',
      '/images/equipment/traffic-cone-sign-white-2.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mrl0gz0p4b08',
    slug: 'umferdarkeilur-bannad-ad-leggja',
    category: 'safety',
    name: {
      en: 'Traffic Cones: No Parking',
      is: 'Umferðarkeilur: Bannað að leggja',
    },
    tagline: {
      en: 'Yellow traffic cones with a no-parking sign, keep the unit parking clear.',
      is: 'Gular umferðarkeilur með Bannað að leggja skilti, halda tökusvæðinu lausu við bíla.',
    },
    description: {
      en: 'Yellow traffic cones with a “No Parking” sign that keep parking clear for unit vehicles, an event, construction work or a moving day. The sign makes the point before anyone parks.\n\nRents in quantity with our 50, 75 and 100 cm cones, detour signs and filming signs. Delivered anywhere in Iceland.',
      is: 'Gular umferðarkeilur með „Bannað að leggja“ skilti sem halda bílastæðum lausum fyrir tökubíla, viðburð, framkvæmdir eða flutningsdag. Skiltið segir sitt áður en nokkur leggur í stæðið.\n\nLeigjast í magni með 50, 75 og 100 cm keilunum okkar, hjáleiðarskiltum og tökuskiltum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Cone and No Parking sign in one',
        is: 'Keila og Bannað að leggja skilti í einu',
      },
      {
        en: 'Keeps unit parking and loading zones clear',
        is: 'Heldur stæðum og hleðslusvæðum lausum',
      },
      {
        en: 'Rents in quantity with the traffic kit',
        is: 'Leigjast í magni með umferðarpakkanum',
      },
    ],
    images: [
      '/uploads/mrl0guif-8721d6f5.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrl0vha3a57a',
    slug: 'oryggisljos-a-keilur-led',
    category: 'safety',
    name: {
      en: 'LED Cone Lights, Set of 8',
      is: 'LED keiluljós, 8 stk. í tösku',
    },
    tagline: {
      en: 'Orange LED lights that sit on top of traffic cones and flash in sequence, set of 8 in a carrying case.',
      is: 'Appelsínugul LED ljós sem smella ofan á umferðarkeilur og blikka í röð, 8 stykki í tösku.',
    },
    description: {
      en: 'Orange LED lights that sit on top of traffic cones and flash in sequence, so a closure is visible from far away in the dark. The flash pattern is adjustable and the eight lights travel in one carrying case.\n\nFor night shoots, road work, events and the winter dark. Rents with our cones, detour signs and filming signs. Delivered anywhere in Iceland.',
      is: 'Appelsínugul LED ljós sem smella ofan á umferðarkeilur og blikka í röð, svo lokun sést langt að í myrkri. Blikkið er stillanlegt og ljósin átta ferðast í einni tösku.\n\nFyrir næturtökur, vegavinnu, viðburði og vetrarmyrkur. Leigjast með keilum, hjáleiðarskiltum og tökuskiltum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Sequential flashing, adjustable',
        is: 'Blikka í röð, stillanlegt',
      },
      {
        en: 'Eight lights in one carrying case',
        is: 'Átta ljós í einni tösku',
      },
      {
        en: 'Fits on top of any traffic cone',
        is: 'Passa ofan á allar umferðarkeilur',
      },
    ],
    images: [
      '/uploads/mrl0vfdh-7a1330ce.png',
      '/uploads/mrl3jkw6-ecc38660.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpjovke1eda',
    slug: '32-amp-3-fasa-framlengingarsnura-10m',
    category: 'power',
    name: {
      en: '32 A 3-Phase Extension Cable 10 m',
      is: '32 A þriggja fasa framlengingarsnúra 10 m',
    },
    tagline: {
      en: '10 m rubber cable 5G4.0, IP44, 400 V/32 A, plug and socket.',
      is: '10 m gúmmísnúra 5G4.0, IP44, 400 V/32 A, með kló og hulsu.',
    },
    description: {
      en: 'A 10 m three-phase extension cable, 32 A, in rubber (5G4.0, IP44) with plug and socket. Connects a big generator or a building supply to the 32 A distribution board, and on to heaters and lights.\n\nRents with our 32 A distribution board, 16 A cables and generators. Delivered anywhere in Iceland.',
      is: '10 m þriggja fasa framlengingarsnúra, 32 A, úr gúmmíi (5G4.0, IP44) með kló og hulsu. Tengir stóra rafstöð eða húsrafmagn við 32 A rafmagnstöfluna og þaðan áfram í hitablásara og ljós.\n\nLeigist með 32 A rafmagnstöflunni, 16 A snúrum og rafstöðvum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '32 A, 400 V, 10 m',
        is: '32 A, 400 V, 10 m',
      },
      {
        en: 'Rubber 5G4.0, IP44',
        is: 'Gúmmí 5G4.0, IP44',
      },
      {
        en: 'Pairs with the 32 A board',
        is: 'Með 32 A töflunni',
      },
    ],
    images: [
      '/uploads/mrpjluce-b39c22a8.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpk2yn45a70',
    slug: '16-amp-3-fasa-framlengingarsnura-25m',
    category: 'power',
    name: {
      en: '16 A 3-Phase Extension Cable 25 m',
      is: '16 A þriggja fasa framlengingarsnúra 25 m',
    },
    tagline: {
      en: '25 m rubber cable 5G2.5, IP44, 400 V/16 A, plug and socket.',
      is: '25 m gúmmísnúra 5G2.5, IP44, 400 V/16 A, með kló og hulsu.',
    },
    description: {
      en: 'A 25 m three-phase extension cable, 16 A, in rubber (5G2.5, IP44) with plug and socket. Takes three-phase power from the distribution board out to the big diesel heater, a lighting rig or a second board at the far end of a tent.\n\nRents with our 16 A distribution board, the 32 A cable and generators. Delivered anywhere in Iceland.',
      is: '25 m þriggja fasa framlengingarsnúra, 16 A, úr gúmmíi (5G2.5, IP44) með kló og hulsu. Flytur þriggja fasa rafmagn frá rafmagnstöflunni út í stóra olíuhitablásarann, ljósabúnað eða aðra töflu í hinum enda tjaldsins.\n\nLeigist með 16 A rafmagnstöflunni, 32 A snúrunni og rafstöðvum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '16 A, 400 V, 25 m',
        is: '16 A, 400 V, 25 m',
      },
      {
        en: 'Rubber 5G2.5, IP44',
        is: 'Gúmmí 5G2.5, IP44',
      },
      {
        en: 'Pairs with the 16 A board',
        is: 'Með 16 A töflunni',
      },
    ],
    images: [
      '/uploads/mrpk2e52-42ef77e1.png',
      '/uploads/mrpk2ebk-43ffb4db.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpkv0o93613',
    slug: 'stunguskofla-fiskars-ergonomic',
    category: 'cleaning',
    name: {
      en: 'Fiskars Ergonomic Digging Shovel',
      is: 'Stunguskófla Fiskars Ergonomic',
    },
    tagline: {
      en: 'Light, strong Fiskars digging shovel for groundwork, snow and cleanup on location.',
      is: 'Létt og sterk stunguskófla frá Fiskars fyrir jarðvinnu, snjó og frágang á tökustað.',
    },
    description: {
      en: 'A light, strong Fiskars Ergonomic digging shovel for groundwork, snow and cleanup: levelling a tent site, digging a stand into a slope or clearing a path at basecamp.\n\nRents with the long-handled shovel, the broom and the Makita blower. Delivered anywhere in Iceland.',
      is: 'Létt og sterk Fiskars Ergonomic stunguskófla fyrir jarðvinnu, snjó og frágang: jafna tjaldstæði, grafa stand í halla eða moka slóð í grunnbúðum.\n\nLeigist með löngu skóflunni, kústinum og Makita blásaranum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Fiskars Ergonomic, light and strong',
        is: 'Fiskars Ergonomic, létt og sterk',
      },
      {
        en: 'For groundwork, snow and cleanup',
        is: 'Fyrir jarðvinnu, snjó og frágang',
      },
    ],
    images: [
      '/uploads/mrpkupwu-e8abc619.png',
      '/uploads/mrpkuq66-102ea37a.png',
      '/uploads/mrpkuqfd-c1e26c8d.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpkwla84949',
    slug: 'skofla-132cm-fiskars-ergonomic',
    category: 'cleaning',
    name: {
      en: 'Fiskars Ergonomic Shovel 132 cm',
      is: 'Skófla Fiskars Ergonomic 132 cm',
    },
    tagline: {
      en: 'Light 132 cm Fiskars shovel for snow, gravel and general cleanup.',
      is: 'Létt 132 cm Fiskars skófla fyrir snjó, möl og almennan frágang.',
    },
    description: {
      en: 'A light 132 cm Fiskars Ergonomic shovel for snow, gravel and general cleanup. The long handle saves backs on a morning of clearing a parking area or a path to set.\n\nRents with the digging shovel, the broom and the Makita blower. Delivered anywhere in Iceland.',
      is: 'Létt 132 cm Fiskars Ergonomic skófla fyrir snjó, möl og almennan frágang. Langa skaftið hlífir bakinu þegar moka þarf bílastæði eða slóð að setti.\n\nLeigist með stunguskóflunni, kústinum og Makita blásaranum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '132 cm, light',
        is: '132 cm, létt',
      },
      {
        en: 'For snow, gravel and cleanup',
        is: 'Fyrir snjó, möl og frágang',
      },
    ],
    images: [
      '/uploads/mrpkwhtp-ee3e6ee7.png',
      '/uploads/mrpkwi0n-10d256a1.png',
      '/uploads/mrpkwi7c-1525eff5.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpkxz90eec4',
    slug: 'kustur-40x150cm-freund',
    category: 'cleaning',
    name: {
      en: 'Freund Broom 40 cm',
      is: 'Kústur Freund 40 × 150 cm',
    },
    tagline: {
      en: 'Wide 40 cm Freund broom on a 150 cm handle for sweeping sets and work areas.',
      is: 'Breiður 40 cm Freund kústur á 150 cm skafti fyrir þrif á setti og vinnusvæðum.',
    },
    description: {
      en: 'A wide 40 cm Freund broom on a 150 cm handle for sweeping sets, pavements and work areas. Leaves a street or a hall the way it was found.\n\nRents with our shovels, the Makita blower and trash cans. Delivered anywhere in Iceland.',
      is: 'Breiður 40 cm Freund kústur á 150 cm skafti fyrir þrif á settum, gangstéttum og vinnusvæðum. Skilur götu eða sal eftir eins og hann var.\n\nLeigist með skóflunum, Makita blásaranum og ruslatunnum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '40 cm wide, 150 cm handle',
        is: '40 cm breiður, 150 cm skaft',
      },
      {
        en: 'For sets, pavements and work areas',
        is: 'Fyrir sett, gangstéttar og vinnusvæði',
      },
    ],
    images: [
      '/uploads/mrpkxv25-5aabec90.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpl7l4td85e',
    slug: 'fjoltengi-uti-4-innstungur',
    category: 'power',
    name: {
      en: 'Outdoor Multiplug, 4 Sockets',
      is: 'Fjöltengi úti, 4 innstungur',
    },
    tagline: {
      en: 'Outdoor multiplug with 4 sockets, 2 m cable and protective lids. IP44.',
      is: 'Fjöltengi til að vera úti, 4 innstungur, 2 m snúra og lok yfir tenglum. IP44.',
    },
    description: {
      en: 'An outdoor multiplug with four Schuko sockets, a 2 m cable and lids over the sockets (IP44). The last metre of the power run: the charging table, the monitor, the heater controller.\n\nRents with our stingers, cable reels and generators. Delivered anywhere in Iceland.',
      is: 'Fjöltengi fyrir útinotkun með fjórum Schuko innstungum, 2 m snúru og loki yfir tenglum (IP44). Síðasti metrinn í rafmagninu: hleðsluborðið, skjárinn, stýringin á hitaranum.\n\nLeigist með stingerum, rafmagnskeflum og rafstöðvum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Four sockets, 2 m cable',
        is: 'Fjórar innstungur, 2 m snúra',
      },
      {
        en: 'IP44 with socket lids',
        is: 'IP44 með loki yfir tenglum',
      },
    ],
    images: [
      '/uploads/mrpl7g8u-cdc13a8c.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrpl9cphbc39',
    slug: 'fjoltengi-til-ad-vera-uti-3-innstungur-og-rofi',
    category: 'power',
    name: {
      en: 'Outdoor Multiplug, 3 Sockets with Switch',
      is: 'Fjöltengi úti, 3 innstungur með rofa',
    },
    tagline: {
      en: 'Outdoor multiplug with 3 sockets and a power switch, 3 m cable and protective lids. IP44.',
      is: 'Fjöltengi til að vera úti, 3 innstungur og rofi, 3 m snúra og lok yfir tenglum. IP44.',
    },
    description: {
      en: 'An outdoor multiplug with three Schuko sockets, a power switch, a 3 m cable and lids over the sockets (IP44). The switch turns a whole bank of lights or chargers off at once without pulling plugs in the wet.\n\nRents with our stingers, cable reels and generators. Delivered anywhere in Iceland.',
      is: 'Fjöltengi fyrir útinotkun með þremur Schuko innstungum, rofa, 3 m snúru og loki yfir tenglum (IP44). Rofinn slekkur á heilli röð af ljósum eða hleðslutækjum í einu án þess að toga úr sambandi í bleytu.\n\nLeigist með stingerum, rafmagnskeflum og rafstöðvum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Three sockets, power switch, 3 m cable',
        is: 'Þrjár innstungur, rofi, 3 m snúra',
      },
      {
        en: 'IP44 with socket lids',
        is: 'IP44 með loki yfir tenglum',
      },
    ],
    images: [
      '/uploads/mrpl931c-456a3bca.png',
      '/uploads/mrpl938h-f136b489.png',
      '/uploads/mrpl93hf-7b063f44.png',
    ],
    featured: true,
  },
  {
    id: 'e-mrw8w5pqb2c8',
    slug: 'nox-kjalkahjalmar',
    category: 'safety',
    name: {
      en: 'Modular Motorcycle Helmet (NOX)',
      is: 'Kjálkahjálmur (NOX)',
    },
    tagline: {
      en: 'Modular helmet with built-in sun visor and intercom space, ECE 22.06 certified, for the six-wheeler and motorcycle shoots.',
      is: 'Kjálkahjálmur með innbyggðum sólgleraugum og plássi fyrir talkerfi, ECE 22.06 vottaður, fyrir sexhjólið og mótorhjólatökur.',
    },
    description: {
      en: 'A polycarbonate and thermoplastic modular helmet with a built-in sun visor, a chin wind deflector, good ventilation and a visor ready for a Pinlock 30 anti-fog insert. Well sound-insulated, with a removable lining, a quick-release buckle and space for an intercom. Helmet bag included. Certified to ECE 22.06 and Double P/J.\n\nRents with our Can-Am six-wheeler, or on its own for motorcycle and ATV scenes and for private riders. Delivered anywhere in Iceland.',
      is: 'Kjálkahjálmur úr polycarbonate og thermoplastic með innbyggðum sólgleraugum, vindhlíf við hökuna, góðri öndun og gleri fyrir Pinlock 30 móðuvörn. Vel hljóðeinangraður, með fóðri sem tekst úr, hraðsmellu og plássi fyrir talkerfi. Hjálmapoki fylgir. Vottaður samkvæmt ECE 22.06 og Double P/J.\n\nLeigist með Can-Am sexhjólinu okkar, eða stakur fyrir mótorhjóla- og fjórhjólasenur og einstaklinga. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'ECE 22.06 and Double P/J certified',
        is: 'ECE 22.06 og Double P/J vottaður',
      },
      {
        en: 'Built-in sun visor, Pinlock-ready',
        is: 'Innbyggð sólgleraugu, tilbúinn fyrir Pinlock',
      },
      {
        en: 'Removable lining, intercom space',
        is: 'Fóður sem tekst úr, pláss fyrir talkerfi',
      },
      {
        en: 'Helmet bag included',
        is: 'Hjálmapoki fylgir',
      },
    ],
    images: [
      '/uploads/mrw8vnah-22bab71e.png',
      '/uploads/mrw8vmp7-79368a60.png',
      '/uploads/mrw8vlxm-f40bf942.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrwb9v1v7ef1',
    slug: '16-amp-3-fasa-rafmagnstafla',
    category: 'power',
    name: {
      en: '16 amp 3-phase distribution board',
      is: '16 amp 3 fasa rafmagnstafla',
    },
    tagline: {
      en: 'Mini U16 distribution board with RCD, 2x 16 A three-phase outlets and 4 Schuko sockets.',
      is: 'Mini U16 rafmagnstafla með lekaliða, 2x 16 A þriggja fasa út og 4 Schuko tenglar.',
    },
    description: {
      en: 'A compact Mini U16 distribution board with a residual-current device, two 16 A three-phase outlets and four Schuko sockets. It takes three-phase power from a generator or a building and splits it safely into what lights, heaters and the charging table need.\n\nRents with our 16 A three-phase extension cables, stingers and cable reels. Delivered anywhere in Iceland.',
      is: 'Nett Mini U16 rafmagnstafla með lekaliða, tveimur 16 A þriggja fasa tenglum og fjórum Schuko tenglum. Hún tekur þriggja fasa rafmagn frá rafstöð eða húsi og skiptir því örugglega niður í það sem ljós, hitarar og hleðsluborðið þurfa.\n\nLeigist með 16 A þriggja fasa framlengingarsnúrum, stingerum og rafmagnskeflum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'RCD protected',
        is: 'Með lekaliða',
      },
      {
        en: '2x 16 A three-phase outlets, 4x Schuko',
        is: '2x 16 A þriggja fasa út, 4x Schuko',
      },
      {
        en: 'Rents with 16 A three-phase cables',
        is: 'Leigist með 16 A þriggja fasa snúrum',
      },
    ],
    images: [
      '/uploads/mrwb9tdt-e0b8e6ac.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrzktoe5d0c9',
    slug: 'umferdarkeilur-100-cm',
    category: 'safety',
    name: {
      en: 'Traffic Cones 100 cm',
      is: 'Umferðarkeilur 100 cm',
    },
    tagline: {
      en: 'Large, stable 100 cm heavy-duty cones for road closures and highly visible marking.',
      is: 'Stórar og stöðugar 100 cm umferðarkeilur fyrir vegalokanir og áberandi merkingar.',
    },
    description: {
      en: 'Heavy-duty 100 cm traffic cones: tall, stable in wind and visible from far away. These are the ones for road closures, highway shoulders and anywhere a 50 cm cone would be missed or blown over, on a film shoot, a road work site or a large event.\n\nRents in quantity together with our detour signs, filming signs and LED cone lights for night work. Delivered anywhere in Iceland.',
      is: 'Stórar 100 cm umferðarkeilur: háar, stöðugar í vindi og sjást langt að. Þetta eru keilurnar fyrir vegalokanir, vegaxlir og alls staðar þar sem 50 cm keila sæist ekki eða fyki, hvort sem er við kvikmyndatökur, vegavinnu eða stóra viðburði.\n\nLeigjast í magni með hjáleiðarskiltum, tökuskiltum og LED keiluljósum fyrir næturvinnu. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '100 cm, stable in Icelandic wind',
        is: '100 cm, stöðugar í íslenskum vindi',
      },
      {
        en: 'For road closures and highway shoulders',
        is: 'Fyrir vegalokanir og vegaxlir',
      },
      {
        en: 'Take LED cone lights for night work',
        is: 'Taka LED keiluljós fyrir næturvinnu',
      },
    ],
    images: [
      '/uploads/mrzktm1l-ba921b94.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrzl0c5k7565',
    slug: 'ecoflow-delta-3-pro-batteri-banki',
    category: 'power',
    name: {
      en: 'EcoFlow Delta 3 Pro Power Station',
      is: 'EcoFlow Delta 3 Pro rafhlöðustöð',
    },
    tagline: {
      en: 'Silent 4,000 W battery power station, about 30 dB, charges to 80% in an hour.',
      is: 'Hljóðlát 4.000 W rafhlöðustöð, um 30 dB, hleðst í 80% á klukkustund.',
    },
    description: {
      en: 'The EcoFlow Delta 3 Pro is a silent power station: 4,000 W of continuous output, enough for heavy appliances, from a unit that makes about 30 dB of noise. On set that means power for monitors, chargers, a heater or catering gear right next to the action, with no generator in the sound recording. Just as handy at an event, a market stall or a cabin without mains power.\n\nIt fast-charges from empty to 80% in about an hour, so it can be topped up from a generator or shore power during a break. Rents on its own or alongside our generators as the quiet half of the power kit. Delivered anywhere in Iceland.',
      is: 'EcoFlow Delta 3 Pro er hljóðlaus rafhlöðustöð: 4.000 W samfellt afl, nóg fyrir stærri tæki, úr einingu sem gefur frá sér um 30 dB. Á setti þýðir það rafmagn fyrir skjái, hleðslutæki, hitara eða veitingabúnað alveg við tökuna, án þess að rafstöð heyrist í hljóðupptökunni. Jafn hentug á viðburði, markaðsbás eða í bústað án rafmagns.\n\nHún hraðhleðst úr tómu í 80% á um einni klukkustund, svo hægt er að fylla á hana frá rafstöð eða landrafmagni í pásu. Leigist stök eða með rafstöðvunum okkar sem hljóðláti hluti rafmagnsbúnaðarins. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '4,000 W continuous output',
        is: '4.000 W samfellt afl',
      },
      {
        en: 'About 30 dB: silent next to set',
        is: 'Um 30 dB: hljóðlaus við settið',
      },
      {
        en: '0 to 80% charge in about an hour',
        is: '0 í 80% hleðslu á um klukkustund',
      },
    ],
    images: [
      '/uploads/mrzkxll3-1349ad1f.png',
    ],
    featured: false,
  },
  {
    id: 'e-mrzl66ydd657',
    slug: 'hjaleidarskilti',
    category: 'safety',
    name: {
      en: 'Detour Signs',
      is: 'Hjáleiðarskilti',
    },
    tagline: {
      en: 'Detour signs pointing right or left, route traffic smoothly around a closed set.',
      is: 'Hjáleiðarskilti til hægri eða vinstri sem stýra umferð fram hjá lokuðum tökustað.',
    },
    description: {
      en: 'Detour signs pointing left or right, used to route traffic smoothly around a closed set, a blocked street, road work or an event. Clear signage keeps drivers calm and the location manager out of the road.\n\nRents with our cones, filming-in-progress signs and basecamp signs. Delivered anywhere in Iceland.',
      is: 'Hjáleiðarskilti til hægri eða vinstri sem stýra umferð snurðulaust fram hjá lokuðum tökustað, lokaðri götu, vegavinnu eða viðburði. Skýrar merkingar halda ökumönnum rólegum og tökustaðastjóranum af götunni.\n\nLeigjast með keilum, tökuskiltum og grunnbúðaskiltum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Left and right arrows',
        is: 'Örvar til hægri og vinstri',
      },
      {
        en: 'Routes traffic around a closed set',
        is: 'Stýra umferð fram hjá lokuðum tökustað',
      },
      {
        en: 'Rents with cones and filming signs',
        is: 'Leigjast með keilum og tökuskiltum',
      },
    ],
    images: [
      '/uploads/mrzl656a-94b0ba66.png',
    ],
    featured: false,
  },
  {
    id: 'e-mseixxnp32fb',
    slug: 'kvikmyndatokur-i-gangi-skilti',
    category: 'safety',
    name: {
      en: 'Filming in Progress Sign',
      is: 'Kvikmyndatökur í gangi skilti',
    },
    tagline: {
      en: 'Sign letting passers-by know that filming is in progress in the area.',
      is: 'Skilti sem lætur vegfarendur vita að kvikmyndatökur séu í gangi á svæðinu.',
    },
    description: {
      en: 'A sign that tells passers-by filming is in progress in the area. It answers the question before anyone asks it, keeps people from walking into a take and is the polite first contact between a production and a neighbourhood.\n\nRents with our detour signs, cones and basecamp signage. Delivered anywhere in Iceland.',
      is: 'Skilti sem lætur vegfarendur vita að kvikmyndatökur séu í gangi á svæðinu. Það svarar spurningunni áður en nokkur spyr, heldur fólki frá því að ganga inn í töku og er kurteis fyrsta snerting framleiðslu við hverfið.\n\nLeigist með hjáleiðarskiltum, keilum og grunnbúðaskiltum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Informs the public before they reach set',
        is: 'Upplýsir almenning áður en hann kemur að setti',
      },
      {
        en: 'Keeps passers-by out of the take',
        is: 'Heldur vegfarendum utan tökunnar',
      },
      {
        en: 'Rents with detour and basecamp signs',
        is: 'Leigist með hjáleiðar- og grunnbúðaskiltum',
      },
    ],
    images: [
      '/uploads/msfcduxx-3e147154.png',
    ],
    featured: false,
  },
  {
    id: 'e-msejvh5a659c',
    slug: 'loftdaela',
    category: 'tools',
    name: {
      en: 'Air Pump',
      is: 'Loftdæla',
    },
    tagline: {
      en: 'Air pump for tyres and air mattresses, light and simple to use.',
      is: 'Loftdæla fyrir dekk og loftdýnur, létt og einföld í notkun.',
    },
    description: {
      en: 'A light air pump for tyres and air mattresses. Tops up a trailer tyre at the roadside or blows up the mattresses in the crew tent.\n\nRents with our vehicles and shelters. Delivered anywhere in Iceland.',
      is: 'Létt loftdæla fyrir dekk og loftdýnur. Fyllir á kerrudekk við vegkantinn eða blæs upp dýnurnar í tjaldi tökuliðsins.\n\nLeigist með bílunum og tjöldunum okkar. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/msejve7a-d0e06939.png',
    ],
    featured: false,
  },
  {
    id: 'e-msoi1sx7148c',
    slug: '32-amp-3-fasa-rafmagnstafla',
    category: 'power',
    name: {
      en: '32 amp 3-phase distribution board',
      is: '32 amp 3 fasa rafmagnstafla',
    },
    tagline: {
      en: 'Compact 32 A distribution board for three-phase power on set.',
      is: 'Nett 32 amp rafmagnstafla fyrir þriggja fasa rafmagn á tökustað.',
    },
    description: {
      en: 'A compact 32 A distribution board for three-phase power on set: the step between a big generator or building supply and the heaters, lights and boards further down the line.\n\nRents with our 32 A three-phase extension cable, the 16 A board and the rest of the power kit. Delivered anywhere in Iceland.',
      is: 'Nett 32 A rafmagnstafla fyrir þriggja fasa rafmagn á tökustað: skrefið milli stórrar rafstöðvar eða húsrafmagns og hitaranna, ljósanna og taflnanna sem koma á eftir.\n\nLeigist með 32 A þriggja fasa framlengingarsnúrunni, 16 A töflunni og öðrum rafmagnsbúnaði. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '32 A three-phase input',
        is: '32 A þriggja fasa inntak',
      },
      {
        en: 'Feeds heaters, lights and smaller boards',
        is: 'Fæðir hitara, ljós og minni töflur',
      },
      {
        en: 'Rents with the 32 A three-phase cable',
        is: 'Leigist með 32 A þriggja fasa snúrunni',
      },
    ],
    images: [
      '/uploads/msoi1qvu-02483ca3.png',
    ],
    featured: false,
  },
  {
    id: 'e-mu77oa2z8637',
    slug: 'oryggis-blikkljos',
    category: 'safety',
    name: {
      en: 'Magnetic Hazard Beacon',
      is: 'Öryggisblikkljós með segli',
    },
    tagline: {
      en: 'Rubber-cased LED hazard beacon with a magnet that sticks to a car roof or a steel surface.',
      is: 'Öryggisblikkljós í gúmmíhúsi með segli sem festist á bílþak eða stálflöt.',
    },
    description: {
      en: 'A flashing LED hazard beacon in a rubber housing with a magnet in the base, so it sticks to a car roof, a trailer or any steel surface. Marks a unit vehicle on the road shoulder, a lead car on a convoy or a hazard on a work site.\n\nRents with our hi-vis vests, cones and signs. Delivered anywhere in Iceland.',
      is: 'Blikkandi LED öryggisljós í gúmmíhúsi með segli í botninum, svo það festist á bílþak, kerru eða hvaða stálflöt sem er. Merkir tökubíl á vegöxl, fararbíl í bílalest eða hættu á vinnusvæði.\n\nLeigist með öryggisvestum, keilum og skiltum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Magnetic base, no mounting needed',
        is: 'Segull í botni, engin festing',
      },
      {
        en: 'Rubber housing',
        is: 'Gúmmíhús',
      },
      {
        en: 'For vehicles, trailers and work sites',
        is: 'Fyrir bíla, kerrur og vinnusvæði',
      },
    ],
    images: [
      '/uploads/mu77o8hy-cce77c23.png',
    ],
    featured: false,
  },
  {
    id: 'e-muk5i5vm92bc',
    slug: 'rafmagnskassi',
    category: 'power',
    name: {
      en: 'Power Distribution Box',
      is: 'Rafmagnskassi',
    },
    tagline: {
      en: 'Distribution box for splitting power safely across a set or work site.',
      is: 'Rafmagnskassi til að dreifa rafmagni örugglega um tökustað eða vinnusvæði.',
    },
    description: {
      en: 'A distribution box that takes one supply in and hands out several outlets, so a set, basecamp or work site runs from one feed instead of a tangle of extension cables.\n\nRents with our stingers, cable reels and generators. Delivered anywhere in Iceland.',
      is: 'Rafmagnskassi sem tekur eina inntaug og skilar nokkrum tenglum, svo tökustaður, grunnbúðir eða vinnusvæði ganga frá einni taug í stað flækju af framlengingarsnúrum.\n\nLeigist með stingerum, rafmagnskeflum og rafstöðvum. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/muk5hqyu-6f9ecbdb.png',
    ],
    featured: false,
  },
  {
    id: 'e-mur4li283b3a',
    slug: 'gashitari-samanfellanlegur',
    category: 'heating',
    name: {
      en: 'Foldable Gas Heater 4.2 kW',
      is: 'Samanfellanlegur gashitari 4,2 kW',
    },
    tagline: {
      en: 'Foldable gas heater on wheels with three heat settings up to 4.2 kW, flame failure and tip-over protection.',
      is: 'Samanfellanlegur gashitari á hjólum með þremur hitastillingum upp í 4,2 kW, logavörn og hallavörn.',
    },
    description: {
      en: 'A foldable gas heater on wheels: three ceramic plates with heat settings of 1.5, 2.8 and 4.2 kW, piezo ignition, a flame failure device, an oxygen depletion sensor and tip-over protection. It takes a gas bottle of up to 10 litres and weighs 8.3 kg, so it moves wherever the cold is. Gas use is 110 to 305 g/h depending on the setting.\n\nGood for a tent, a garage set, a holding area or a workshop where a diesel heater is overkill. Rents on its own or with our shelters. Delivered anywhere in Iceland.',
      is: 'Samanfellanlegur gashitari á hjólum: þrjár keramikplötur með hitastillingum 1,5, 2,8 og 4,2 kW, piezo kveikja, logavörn, súrefnisskynjari og hallavörn. Hann tekur allt að 10 lítra gaskút og vegur 8,3 kg, svo hann færist þangað sem kuldinn er. Gasnotkun er 110 til 305 g/klst. eftir stillingu.\n\nHentar í tjald, bílskúrssett, biðsvæði eða verkstæði þar sem olíuhitablásari væri of mikið. Leigist stakur eða með tjöldunum okkar. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '1.5 / 2.8 / 4.2 kW heat settings',
        is: '1,5 / 2,8 / 4,2 kW hitastillingar',
      },
      {
        en: 'Flame failure, ODS and tip-over protection',
        is: 'Logavörn, súrefnisskynjari og hallavörn',
      },
      {
        en: 'Folds, 8.3 kg, on wheels',
        is: 'Fellanlegur, 8,3 kg, á hjólum',
      },
      {
        en: 'Takes up to a 10 L gas bottle, 42 × 38 × 73 cm',
        is: 'Tekur allt að 10 l gaskút, 42 × 38 × 73 cm',
      },
    ],
    images: [
      '/uploads/mur4k96e-52a06422.png',
    ],
    featured: false,
  },
  {
    id: 'e-mur5wgvi73e2',
    slug: 'sandpokar-10kg',
    category: 'shelter',
    name: {
      en: 'Sandbags 10 kg',
      is: 'Sandpokar 10 kg',
    },
    tagline: {
      en: 'Yellow 10 kg sandbags that hold tents, tripods, signs and tarps down in the wind.',
      is: 'Gulir 10 kg sandpokar sem halda tjöldum, þrífótum, skiltum og yfirbreiðslum niðri í vindi.',
    },
    description: {
      en: 'Yellow 10 kg sandbags for holding things down in Icelandic wind: tent legs, light stands, sign bases, tarp edges and cable runs. Rents in quantity.\n\nRents with our shelters, tarps and work lights. Delivered anywhere in Iceland.',
      is: 'Gulir 10 kg sandpokar til að halda hlutum niðri í íslenskum vindi: tjaldfótum, ljósastöndum, skiltafótum, yfirbreiðslum og snúrum. Leigjast í magni.\n\nLeigjast með tjöldum, yfirbreiðslum og vinnuljósum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '10 kg each, yellow',
        is: '10 kg hver, gulir',
      },
      {
        en: 'Rents in quantity',
        is: 'Leigjast í magni',
      },
    ],
    images: [
      '/uploads/mur5wdt5-8b33eabe.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mur645nn404b',
    slug: 'mini-scangrip-ljos-9-ljos-i-tosku',
    category: 'lighting',
    name: {
      en: 'Scangrip Mini Work Lights, Set of 9',
      is: 'Scangrip Mini vinnuljós, 9 stk. í tösku',
    },
    tagline: {
      en: 'Nine pocket-sized rechargeable 1,000 lm LED floodlights in a Pelicase, corded or cordless, IP67.',
      is: 'Níu endurhlaðanleg 1.000 lm LED vasaljós í Pelicase tösku, með eða án snúru, IP67.',
    },
    description: {
      en: 'Nine Scangrip Mini floodlights in one Pelicase. Each one is a 278 g rechargeable LED work light with 26 LEDs giving up to 1,000 lumens at 5700 K (CRI over 80), runs corded or cordless and is IP67 waterproof and IK07 impact rated. The OPTILight setting balances brightness and run time.\n\nHand them out to the crew for load-ins, cable runs and dark corners of a location, or stand a few on a work bench. Rents with our NOVA 6K floodlight and generators. Delivered anywhere in Iceland.',
      is: 'Níu Scangrip Mini ljós í einni Pelicase tösku. Hvert um sig er 278 g endurhlaðanlegt LED vinnuljós með 26 LED perum sem gefa allt að 1.000 lúmen við 5700 K (CRI yfir 80), gengur með eða án snúru og er IP67 vatnshelt og IK07 höggþolið. OPTILight stillingin jafnar birtu og endingartíma.\n\nDeildu þeim á tökuliðið í hleðslu, snúrulagnir og dimm horn á tökustað, eða stilltu nokkrum á vinnuborð. Leigist með NOVA 6K kastaranum og rafstöðvum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Nine lights in a Pelicase',
        is: 'Níu ljós í Pelicase tösku',
      },
      {
        en: 'Up to 1,000 lm each, 5700 K, CRI > 80',
        is: 'Allt að 1.000 lm hvert, 5700 K, CRI > 80',
      },
      {
        en: 'Corded or cordless, IP67 / IK07',
        is: 'Með eða án snúru, IP67 / IK07',
      },
      {
        en: '278 g, 102 × 39 × 94 mm',
        is: '278 g, 102 × 39 × 94 mm',
      },
    ],
    images: [
      '/uploads/mur63zpv-f31f92ef.png',
      '/uploads/mur6412b-f420fdbf.png',
      '/uploads/mur642lx-78ae452d.png',
      '/uploads/mur643ui-48b1053a.png',
    ],
    featured: false,
  },
  {
    id: 'e-mur67h7t57f2',
    slug: 'midlungs-scangrip-ljos-battery',
    category: 'lighting',
    name: {
      en: 'Scangrip NOVA R Work Light 2000 lm',
      is: 'Scangrip NOVA R vinnuljós 2000 lm',
    },
    tagline: {
      en: 'Rechargeable Scangrip COB LED work light, upgraded from 1,500 to 2,000 lumens.',
      is: 'Endurhlaðanlegt Scangrip COB LED vinnuljós, uppfært úr 1.500 í 2.000 lúmen.',
    },
    description: {
      en: 'The medium light in our Scangrip set: a rechargeable NOVA R with the latest COB LED, now putting out 2,000 lumens instead of 1,500. Battery powered, so it stands or hangs wherever light is needed with no cable to run: a makeup corner, a tent, a truck bed at load-out.\n\nRents with the Mini set, the NOVA 6K floodlight and generators. Delivered anywhere in Iceland.',
      is: 'Miðlungsljósið í Scangrip settinu okkar: endurhlaðanlegt NOVA R með nýjustu COB LED tækni, nú 2.000 lúmen í stað 1.500. Batterísknúið, svo það stendur eða hangir þar sem ljós vantar án þess að leggja snúru: í förðunarhorni, tjaldi eða á vörubílspalli við frágang.\n\nLeigist með Mini settinu, NOVA 6K kastaranum og rafstöðvum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '2,000 lumens COB LED',
        is: '2.000 lúmen COB LED',
      },
      {
        en: 'Rechargeable, no cable to run',
        is: 'Endurhlaðanlegt, engin snúra',
      },
      {
        en: 'Pairs with the Mini set and NOVA 6K',
        is: 'Með Mini settinu og NOVA 6K',
      },
    ],
    images: [
      '/uploads/mur67dtm-51996a64.png',
      '/uploads/mur67e7q-a9a1c66f.png',
      '/uploads/mur67fd1-c8470f25.png',
    ],
    featured: false,
  },
  {
    id: 'e-murcnlula6b1',
    slug: 'trashcan',
    category: 'cleaning',
    name: {
      en: 'Trash Cans',
      is: 'Ruslatunnur',
    },
    tagline: {
      en: 'Trash cans for basecamp, catering and events, so the waste ends up in one place.',
      is: 'Ruslatunnur fyrir grunnbúðir, veitingar og viðburði, svo ruslið lendi á einum stað.',
    },
    description: {
      en: 'Trash cans for basecamp, the catering area and events. A few at the right spots and the location is left the way it was found. Rents in quantity.\n\nRents with our brooms, shovels and tables. Delivered anywhere in Iceland.',
      is: 'Ruslatunnur fyrir grunnbúðir, veitingasvæði og viðburði. Nokkrar á réttum stöðum og tökustaðurinn skilast eins og hann var. Leigjast í magni.\n\nLeigjast með kústum, skóflum og borðum. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/murcnas3-75a70f80.png',
    ],
    featured: false,
  },
  {
    id: 'e-murd25ab187f',
    slug: 'location-basecamp-techbase-crew-parking-skilti',
    category: 'safety',
    name: {
      en: 'Basecamp Direction Signs (aluminium)',
      is: 'Grunnbúðaskilti úr áli',
    },
    tagline: {
      en: 'Aluminium signs reading Location, Basecamp, Techbase and Crew Parking, so the unit finds its way.',
      is: 'Álskilti merkt Location, Basecamp, Techbase og Crew Parking, svo tökuliðið rati.',
    },
    description: {
      en: 'A set of aluminium direction signs reading Location, Basecamp, Techbase and Crew Parking. Put them up at the turn-offs and the whole unit finds its way on the first morning without a single phone call. Aluminium stands up to rain and wind and wipes clean between jobs.\n\nRents with our cones, clip-on cone signs and filming signs. Delivered anywhere in Iceland.',
      is: 'Álskilti merkt Location, Basecamp, Techbase og Crew Parking. Settu þau upp við afleggjarana og allt tökuliðið ratar fyrsta morguninn án þess að hringja. Álið þolir rigningu og rok og þurrkast af milli verkefna.\n\nLeigjast með keilum, upplýsingaskiltum á keilur og tökuskiltum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Location, Basecamp, Techbase, Crew Parking',
        is: 'Location, Basecamp, Techbase, Crew Parking',
      },
      {
        en: 'Aluminium, weatherproof',
        is: 'Ál, veðurþolin',
      },
      {
        en: 'Pairs with cones and cone signs',
        is: 'Með keilum og keiluskiltum',
      },
    ],
    images: [
      '/uploads/murd2159-86105b37.png',
      '/uploads/murd20wg-9f903cbc.png',
      '/uploads/murd21ck-84ae4c31.png',
      '/uploads/murd21n6-cc245c89.png',
    ],
    featured: false,
  },
  {
    id: 'e-murd47u51b0d',
    slug: 'klemmur',
    category: 'shelter',
    name: {
      en: 'Clamps',
      is: 'Klemmur',
    },
    tagline: {
      en: 'Spring clamps for fixing tarps, fabric and signs to poles and frames.',
      is: 'Klemmur til að festa yfirbreiðslur, dúka og skilti á stangir og grindur.',
    },
    description: {
      en: 'Spring clamps for fixing tarps, fabric, signs and cables to poles, frames and tent edges. Rents in quantity.\n\nRents with our tarps, sandbags and shelters. Delivered anywhere in Iceland.',
      is: 'Klemmur til að festa yfirbreiðslur, dúka, skilti og snúrur á stangir, grindur og tjaldkanta. Leigjast í magni.\n\nLeigjast með yfirbreiðslum, sandpokum og tjöldum. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/murd46g0-e9e8b319.png',
    ],
    featured: false,
  },
  {
    id: 'e-muub65yha82a',
    slug: 'rafmagnshitablasari-2000w',
    category: 'heating',
    name: {
      en: 'Electric Fan Heater 2000 W',
      is: 'Rafmagnshitablásari 2000 W',
    },
    tagline: {
      en: 'EnsoNordic 2000 W electric fan heater, black, for small rooms with mains power.',
      is: 'EnsoNordic 2000 W rafmagnshitablásari, svartur, fyrir lítil rými með landrafmagni.',
    },
    description: {
      en: 'A 2000 W EnsoNordic electric fan heater in black. Plugs into an ordinary socket and warms a small room, a caravan, a makeup corner or an office container quickly, with no fuel and no exhaust.\n\nFor tents and larger spaces see our diesel and gas heaters. Rents on its own or with our caravans and shelters. Delivered anywhere in Iceland.',
      is: '2000 W EnsoNordic rafmagnshitablásari, svartur. Fer í venjulega innstungu og hitar lítið herbergi, hjólhýsi, förðunarhorn eða skrifstofugám hratt, án eldsneytis og útblásturs.\n\nFyrir tjöld og stærri rými eru olíu- og gashitararnir okkar. Leigist stakur eða með hjólhýsunum og tjöldunum okkar. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '2000 W, plugs into a standard socket',
        is: '2000 W, fer í venjulega innstungu',
      },
      {
        en: 'No fuel, no exhaust',
        is: 'Ekkert eldsneyti, enginn útblástur',
      },
      {
        en: 'For small rooms, caravans and containers',
        is: 'Fyrir lítil rými, hjólhýsi og gáma',
      },
    ],
    images: [
      '/uploads/muub64hr-1c0b13a4.png',
    ],
    featured: false,
  },
  {
    id: 'e-muuatqyc5071',
    slug: 'ecoflow-delta-3',
    category: 'power',
    name: {
      en: 'EcoFlow Delta 3 Power Station',
      is: 'EcoFlow Delta 3 rafhlöðustöð',
    },
    tagline: {
      en: 'Silent 1,800 W battery power station, 1,024 Wh, charges from empty in about an hour.',
      is: 'Hljóðlát 1.800 W rafhlöðustöð, 1.024 Wh, hleðst úr tómu á um klukkustund.',
    },
    description: {
      en: 'The EcoFlow Delta 3 is a silent 1,024 Wh power station with 1,800 W of pure sine wave output, so it runs LED lights, chargers, a DIT station or a monitor right next to set with nothing in the sound recording and no exhaust in an interior. It charges from empty to full in about 56 minutes from a wall socket, and also from solar or a 12 V car socket. LiFePO4 cells handle cold and heat, and the built-in UPS switches over in under 10 ms if the mains drops.\n\nPorts: 230 V AC sockets, USB-C at up to 100 W for laptops, USB-A and 12 V DC. Runs a 300 to 600 W LED fixture for 1.5 to 3 hours at full power and charges camera, drone and gimbal batteries all day. Just as useful at an event, a market stall or a cabin without mains. For more power see the Delta 3 Pro. Delivered anywhere in Iceland.',
      is: 'EcoFlow Delta 3 er hljóðlát 1.024 Wh rafhlöðustöð með 1.800 W hreinu sínusafli, svo hún keyrir LED ljós, hleðslutæki, DIT-stöð eða skjá alveg við settið án þess að heyrast í hljóðupptökunni og án útblásturs innandyra. Hún hleðst úr tómu í fullt á um 56 mínútum úr venjulegri innstungu, og líka með sólarsellu eða úr 12 V bíltengi. LiFePO4 rafhlöður þola kulda og hita og innbyggt varaafl skiptir yfir á undir 10 ms ef rafmagnið dettur út.\n\nTengi: 230 V innstungur, USB-C allt að 100 W fyrir fartölvur, USB-A og 12 V DC. Keyrir 300 til 600 W LED ljós í 1,5 til 3 klukkustundir á fullu afli og hleður myndavéla-, dróna- og gimbal-rafhlöður allan daginn. Jafn gagnleg á viðburði, markaðsbás eða í bústað án rafmagns. Fyrir meira afl er Delta 3 Pro. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '1,800 W pure sine wave, 1,024 Wh',
        is: '1.800 W hreint sínusafl, 1.024 Wh',
      },
      {
        en: 'Empty to full in about 56 minutes',
        is: 'Úr tómu í fullt á um 56 mínútum',
      },
      {
        en: 'Silent, no exhaust: safe next to set and indoors',
        is: 'Hljóðlát, enginn útblástur: við sett og innandyra',
      },
      {
        en: 'USB-C 100 W, USB-A, 12 V DC, UPS under 10 ms',
        is: 'USB-C 100 W, USB-A, 12 V DC, varaafl undir 10 ms',
      },
    ],
    images: [
      '/uploads/muuatp2v-c9f4098a.png',
    ],
    featured: false,
  },
  {
    id: 'e-muubqyjq4e7f',
    slug: 'regnhlifar',
    category: 'shelter',
    name: {
      en: 'Storm Umbrellas',
      is: 'Regnhlífar (stormheldar)',
    },
    tagline: {
      en: 'Black double-canopy umbrellas that let the wind through and invert without damage, room for two.',
      is: 'Svartar tvöfaldar regnhlífar sem hleypa roki í gegn og fjúka upp án þess að skemmast, pláss fyrir tvo.',
    },
    description: {
      en: 'Sturdy black double-canopy umbrellas made for Icelandic weather: the wind passes through the vented canopy and the umbrella can invert without breaking. Lightweight fibreglass shaft, soft-grip handle, opens at the push of a button, and roomy enough to keep two people or an actor and a camera dry.\n\nRents in quantity for crew, cast and events. Rents with our shelters and tarps. Delivered anywhere in Iceland.',
      is: 'Vandaðar svartar tvöfaldar regnhlífar gerðar fyrir íslenskt veður: rokið fer í gegnum loftaða hlífina og regnhlífin getur fokið upp án þess að brotna. Létt fiberglass skaft, mjúkt haldfang, opnast með því að smella á hnapp, og nógu rúmgóð til að halda tveimur manneskjum eða leikara og myndavél þurrum.\n\nLeigjast í magni fyrir tökulið, leikara og viðburði. Leigjast með tjöldum og yfirbreiðslum. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: 'Vented double canopy, inverts without damage',
        is: 'Loftuð tvöföld hlíf, fýkur upp án skemmda',
      },
      {
        en: 'Room for two',
        is: 'Pláss fyrir tvo',
      },
      {
        en: 'Fibreglass shaft, automatic opening',
        is: 'Fiberglass skaft, opnast sjálfkrafa',
      },
    ],
    images: [
      '/uploads/muubqwot-e1adf2b0.png',
    ],
    featured: false,
  },
  {
    id: 'e-muubwpj7e4b1',
    slug: 'gummi-mottur',
    category: 'shelter',
    name: {
      en: 'Rubber Mats',
      is: 'Gúmmímottur',
    },
    tagline: {
      en: 'Rubber mats that protect floors and stop slips in tents, vans and walkways on location.',
      is: 'Gúmmímottur sem verja gólf og draga úr hálku í tjöldum, bílum og á göngustígum á tökustað.',
    },
    description: {
      en: 'Rubber mats for the floor of a tent, a caravan entrance, a truck bed or a muddy walkway at basecamp. They protect the surface underneath, keep feet from slipping and make a cold ground a little warmer to stand on. Rents in quantity.\n\nRents with our shelters, tarps and sandbags. Delivered anywhere in Iceland.',
      is: 'Gúmmímottur á gólf í tjaldi, við inngang hjólhýsis, á vörubílspall eða á drullugan göngustíg í grunnbúðum. Þær verja undirlagið, draga úr hálku og gera kalda jörð aðeins hlýrri að standa á. Leigjast í magni.\n\nLeigjast með tjöldum, yfirbreiðslum og sandpokum. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/muubwh5m-5aa5e033.png',
    ],
    featured: false,
  },
  {
    id: 'e-muvovrfn3da0',
    slug: 'thermal-kanna',
    category: 'catering',
    name: {
      en: 'Thermal Jug 1.9 L',
      is: 'Hitakanna 1,9 l',
    },
    tagline: {
      en: '1.9 litre thermal jug that keeps coffee hot on the catering table for hours.',
      is: '1,9 lítra hitakanna sem heldur kaffinu heitu á veitingaborðinu tímunum saman.',
    },
    description: {
      en: 'A 1.9 litre thermal jug for coffee, tea or hot water on the catering table, in the crew tent or at an event. Keeps drinks hot for hours without a power socket. Rents in quantity.\n\nRents with our folding tables, tents and heaters. Delivered anywhere in Iceland.',
      is: '1,9 lítra hitakanna fyrir kaffi, te eða heitt vatn á veitingaborðinu, í tjaldi tökuliðsins eða á viðburði. Heldur drykkjum heitum tímunum saman án innstungu. Leigist í magni.\n\nLeigist með samanbrjótanlegum borðum, tjöldum og hitablásurum. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/muvovhg2-4ae2b9f1.png',
    ],
    featured: false,
  },
  {
    id: 'e-muuayhik0574',
    slug: 'fellanleg-fatasla-1000mm',
    category: 'costume',
    name: {
      en: 'Collapsible Clothing Rack 100 cm',
      is: 'Fellanleg fataslá 100 cm',
    },
    tagline: {
      en: 'Collapsible steel clothing rack, 100 cm wide, for the costume department on location.',
      is: 'Samanbrjótanleg fataslá úr stáli, 100 cm breið, fyrir búningadeild á tökustað.',
    },
    description: {
      en: 'A collapsible steel clothing rack, 100 cm wide, that folds flat for transport and sets up in seconds. Gets the costumes out of the cases and hanging in the tent, the caravan or the wardrobe truck, and works just as well for an event cloakroom or a pop-up shop.\n\nRents with our hangers, folding tables, tents and the Nestor makeup mirror for a complete costume and makeup station. Delivered anywhere in Iceland.',
      is: 'Samanbrjótanleg fataslá úr stáli, 100 cm breið, sem leggst flöt í flutningi og fer upp á nokkrum sekúndum. Kemur búningunum upp úr töskunum og á herðatré í tjaldi, hjólhýsi eða búningabíl, og nýtist jafn vel í fatahengi á viðburði eða pop-up verslun.\n\nLeigist með herðatrjám, samanbrjótanlegum borðum, tjöldum og Nestor förðunarspeglinum fyrir fullbúna búninga- og förðunarstöð. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '100 cm wide, steel',
        is: '100 cm breið, stál',
      },
      {
        en: 'Folds flat, sets up in seconds',
        is: 'Leggst flöt, upp á sekúndum',
      },
      {
        en: 'Pairs with hangers and the makeup mirror',
        is: 'Með herðatrjám og förðunarspeglinum',
      },
    ],
    images: [
      '/uploads/muuay88l-728375a0.png',
    ],
    featured: false,
  },
  {
    id: 'e-muuawds101e3',
    slug: 'non-slip-herdatre-sett-af-50',
    category: 'costume',
    name: {
      en: 'Non-Slip Hangers, Set of 50',
      is: 'Herðatré með stömu gripi, 50 stk.',
    },
    tagline: {
      en: 'Fifty plastic non-slip hangers that keep costumes on the rail through a bumpy drive.',
      is: 'Fimmtíu stöm plastherðatré sem halda búningunum á slánni í holóttum vegi.',
    },
    description: {
      en: 'A set of fifty plastic non-slip hangers. The grip keeps shirts, dresses and silks from sliding off the rail on the drive to location, and the slim shape fits twice as many costumes on a rack.\n\nRents with our clothing racks and trouser hangers. Delivered anywhere in Iceland.',
      is: 'Sett af fimmtíu stömum plastherðatrjám. Gripið heldur skyrtum, kjólum og silki á slánni á leiðinni á tökustað og þunna lagið kemur helmingi fleiri búningum á hverja slá.\n\nLeigjast með fataslánum og buxnaherðatrjánum okkar. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/muuawa9y-4dcd440f.png',
    ],
    featured: false,
  },
  {
    id: 'e-muubj0xl996d',
    slug: 'buxna-herdatre-set-of-20',
    category: 'costume',
    name: {
      en: 'Trouser Hangers, Set of 20',
      is: 'Buxnaherðatré, 20 stk.',
    },
    tagline: {
      en: 'Twenty clip hangers for trousers and skirts in the costume department.',
      is: 'Tuttugu klemmuherðatré fyrir buxur og pils í búningadeildinni.',
    },
    description: {
      en: 'A set of twenty clip hangers for trousers and skirts, so bottoms hang crease-free next to the tops instead of folded in a case.\n\nRents with our clothing racks and non-slip hangers. Delivered anywhere in Iceland.',
      is: 'Sett af tuttugu klemmuherðatrjám fyrir buxur og pils, svo neðri hlutinn hangi krumpulaus við hlið þess efri í stað þess að liggja samanbrotinn í tösku.\n\nLeigjast með fataslánum og stömu herðatrjánum okkar. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/muubiq09-3b20c9c6.png',
    ],
    featured: false,
  },
  {
    id: 'e-muubfa11444e',
    slug: '4-troppu-stigi',
    category: 'tools',
    name: {
      en: '4-Step Ladder',
      is: 'Fjögurra þrepa stigi',
    },
    tagline: {
      en: 'Four-step folding ladder for reaching lights, signs and tent roofs on location.',
      is: 'Fjögurra þrepa fellistigi til að ná upp í ljós, skilti og tjaldþök á tökustað.',
    },
    description: {
      en: 'A four-step folding ladder that reaches lights, signs, tent roofs and the top shelf of the van. Folds flat and travels in any of our vehicles.\n\nRents with our work lights, shelters and signs. Delivered anywhere in Iceland.',
      is: 'Fjögurra þrepa fellistigi sem nær upp í ljós, skilti, tjaldþök og efstu hilluna í sendibílnum. Leggst flatur og ferðast í hvaða bíl sem er hjá okkur.\n\nLeigist með vinnuljósum, tjöldum og skiltum. Afhent hvert á land sem er.',
    },
    images: [
      '/uploads/muubf83k-e360b0fe.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mutqcluib7f1',
    slug: 'makita-18v-blasari-litill-med-stuttum-og-longum-stut',
    category: 'cleaning',
    name: {
      en: 'Makita DUB186 18V Cordless Blower',
      is: 'Makita DUB186 18 V blásari',
    },
    tagline: {
      en: 'Cordless 18V LXT blower with short and long tubes, three speeds, two batteries and charger included.',
      is: 'Þráðlaus 18 V LXT blásari með stuttum og löngum stút, þremur hraðastillingum, tveimur rafhlöðum og hleðslutæki.',
    },
    description: {
      en: 'The Makita DUB186 is a cordless 18 V LXT blower with a long tube, so you clear the ground without bending over. Three speed settings on the switch match the airflow to the job, from light leaves to wet gravel and sand, and it runs quietly enough for residential streets and housing associations.\n\nComes with a short and a long tube, two batteries and a charger. Rents with our shovels, broom and trash cans for leaving a location the way it was found. Delivered anywhere in Iceland.',
      is: 'Makita DUB186 er þráðlaus 18 V LXT blásari með löngu röri, svo þú hreinsar jörðina án þess að beygja þig. Þrjár hraðastillingar á rofanum stilla loftflæðið eftir verkinu, frá léttum laufblöðum að blautri möl og sandi, og hann er nógu hljóðlátur fyrir íbúðagötur og húsfélög.\n\nKemur með stuttum og löngum stút, tveimur rafhlöðum og hleðslutæki. Leigist með skóflunum, kústinum og ruslatunnunum okkar til að skila tökustaðnum eins og hann var. Afhent hvert á land sem er.',
    },
    highlights: [
      {
        en: '18V LXT, cordless',
        is: '18 V LXT, þráðlaus',
      },
      {
        en: 'Three speeds, short and long tube',
        is: 'Þrír hraðar, stuttur og langur stútur',
      },
      {
        en: 'Two batteries and charger included',
        is: 'Tvær rafhlöður og hleðslutæki fylgja',
      },
      {
        en: 'Quiet enough for residential areas',
        is: 'Nógu hljóðlátur fyrir íbúðahverfi',
      },
    ],
    images: [
      '/uploads/mutqcar4-be010d20.png',
    ],
    featured: false,
  },
]
