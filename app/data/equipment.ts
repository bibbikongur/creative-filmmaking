import type { EquipmentItem } from '~/types'

// The live equipment catalogue, mirrored. Production's SQLite database is the
// source of truth (admin panel edits win); this file seeds fresh installs and
// carries copy pushed to production via SEED_EQUIPMENT_UPDATES in
// server/utils/db.ts. Synced from https://creativefilmmaking.is/api/equipment
// on 2026-10-03, then given a stored `slug` (pins every item's URL) and, for the
// main items, a description + highlights for the detail page.
export const equipment: EquipmentItem[] = [
  {
    id: 'e-mr754bhada10',
    slug: 'master-oliuhitablasari-bv-77-e-21-kw',
    category: 'heating',
    name: {
      en: 'Master BV 77 E Indirect Diesel Heater 21 kW',
      is: 'Master olíuhitablásari BV 77 E – 21 kW',
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
      en: 'Master BV 290 E Indirect Diesel Heater 81 kW',
      is: 'Master olíuhitablásari BV 290 E – 81 kW',
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
    category: 'power',
    name: {
      en: 'LED Work Light NOVA 6K with Tripod',
      is: 'Kastari LED NOVA 6K með þrífæti',
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
    images: [
      '/images/equipment/cable-reel-25m.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-016',
    slug: 'drattartog-15-m-24-mm',
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
    slug: 'yfirbreidsla-3-6-4-8-m-2-stk',
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
    slug: 'starttaeki-fyrir-vorubila-24v',
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
    images: [
      '/images/equipment/fuel-can-20l.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-020',
    slug: 'starttaeki-12v-noco-gbx155',
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
    slug: 'eskimo-outbreak-450xdp-einangrad-skjoltjald',
    category: 'shelter',
    name: {
      en: 'Eskimo Outbreak 450XDP Insulated Pop-Up Shelter',
      is: 'Eskimo Outbreak 450XDP einangrað skjóltjald',
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
    slug: 'strekkibordi-0-25-t',
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
    slug: 'strekkjari-med-krok-appelsinugulur',
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
      en: 'Standard 50 cm traffic cones for closing off a set, reserving parking or marking a work area. Light enough to carry a stack, visible enough that nobody drives into the frame. We rent them in quantity, so a whole street or basecamp can be marked from one delivery.\n\nCombine with our 100 cm cones, detour signs, filming signs and cone lights for a complete traffic kit. Delivered anywhere in Iceland.',
      is: 'Venjulegar 50 cm umferðarkeilur til að loka af tökustað, taka frá bílastæði eða merkja vinnusvæði. Nógu léttar til að bera stafla, nógu áberandi til að enginn keyri inn í rammann. Við leigjum þær í magni, svo heil gata eða grunnbúðir merkjast úr einni afhendingu.\n\nMeð 100 cm keilunum, hjáleiðarskiltum, tökuskiltum og keiluljósum verður þetta heill umferðarpakki. Afhent hvert á land sem er.',
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
    slug: '32-amp-3-fasa-framlengingarsnura-10m',
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
    slug: '16-amp-3-fasa-framlengingarsnura-25m',
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
    slug: 'kustur-40x150cm-freund',
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
    slug: 'fjoltengi-uti-4-innstungur',
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
    slug: 'fjoltengi-til-ad-vera-uti-3-innstungur-og-rofi',
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
    slug: 'nox-kjalkahjalmar',
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
      en: 'Heavy-duty 100 cm traffic cones: tall, stable in wind and visible from far away. These are the ones for road closures, highway shoulders and anywhere a 50 cm cone would be missed or blown over.\n\nRents in quantity together with our detour signs, filming signs and LED cone lights for night work. Delivered anywhere in Iceland.',
      is: 'Stórar 100 cm umferðarkeilur: háar, stöðugar í vindi og sjást langt að. Þetta eru keilurnar fyrir vegalokanir, vegaxlir og alls staðar þar sem 50 cm keila sæist ekki eða fyki.\n\nLeigjast í magni með hjáleiðarskiltum, tökuskiltum og LED keiluljósum fyrir næturvinnu. Afhent hvert á land sem er.',
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
      en: 'Ecoflow Delta 3 Pro - Power bank',
      is: 'Ecoflow Delta 3 Pro - Batterí banki',
    },
    tagline: {
      en: 'Output: 4000W continuous power (handles heavy-duty appliances).\nCharging: Fast charges from 0 to 80% in just 1 hour.\nNoise Level: Whisper-quiet operation at only 30 dB.',
      is: 'Afl: 4000W samfellt afl (ræður við flest stærri tæki).\nHleðsla: Nær 80% hleðslu á aðeins einni klukkustund.\nHljóðstig: Mjög hljóðlát í notkun, eða aðeins um 30 dB.',
    },
    description: {
      en: 'The EcoFlow Delta 3 Pro is a silent power station: 4,000 W of continuous output, enough for heavy appliances, from a unit that makes about 30 dB of noise. On set that means power for monitors, chargers, a heater or catering gear right next to the action, with no generator in the sound recording.\n\nIt fast-charges from empty to 80% in about an hour, so it can be topped up from a generator or shore power during a break. Rents on its own or alongside our generators as the quiet half of the power kit.',
      is: 'EcoFlow Delta 3 Pro er hljóðlaus rafhlöðustöð: 4.000 W samfellt afl, nóg fyrir stærri tæki, úr einingu sem gefur frá sér um 30 dB. Á setti þýðir það rafmagn fyrir skjái, hleðslutæki, hitara eða veitingabúnað alveg við tökuna, án þess að rafstöð heyrist í hljóðupptökunni.\n\nHún hraðhleðst úr tómu í 80% á um einni klukkustund, svo hægt er að fylla á hana frá rafstöð eða landrafmagni í pásu. Leigist stök eða með rafstöðvunum okkar sem hljóðláti hluti rafmagnsbúnaðarins.',
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
      en: 'Detour signs pointing left or right, used to route traffic smoothly around a closed set or a blocked street. Clear signage keeps drivers calm and the location manager out of the road.\n\nRents with our cones, filming-in-progress signs and basecamp signs. Delivered anywhere in Iceland.',
      is: 'Hjáleiðarskilti til hægri eða vinstri sem stýra umferð snurðulaust fram hjá lokuðum tökustað eða lokaðri götu. Skýrar merkingar halda ökumönnum rólegum og tökustaðastjóranum af götunni.\n\nLeigjast með keilum, tökuskiltum og grunnbúðaskiltum. Afhent hvert á land sem er.',
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
    category: 'heating',
    name: {
      en: 'Blinking light',
      is: 'Öryggis blikkljós',
    },
    tagline: {
      en: 'Safety hazard light with rubber and magnet to fasten on cars',
      is: 'Öryggis blikkljós með gúmmí og segli til að festa á bil',
    },
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
      en: 'Electric box',
      is: 'Rafmagnskassi',
    },
    tagline: {
      en: 'Electric box',
      is: 'Rafmagnskassi',
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
      en: 'Gasheater foldable',
      is: 'Gashitari samanfellanlegur',
    },
    tagline: {
      en: 'Foldable gas heater with wheels for easy moving.\nPiezo electric ignition\n3 ceramic heating plates\nFlame failure device and ODS (Oxygen Depletion Sensor) safety system\nHeat settings: 1.5 kW (low), 2.8 kW (medium), 4.2 kW (high)\nGas consumption: 110 g/h (low), 200 g/h (medium), 305 g/h (high)\nFits up to a 10 L gas bottle / cylinder\nWheels for easy transport\nTip-over protection (tilt switch)\nDimensions: 42 × 38/15 × 73 cm\nWeight: 8.3 kg',
      is: 'Samanfellanlegur gashitari með hjólum sem auðveldar að færa hann til.\n\nPiezo rafkveikja\n3 stk keramik plötur\nLogavörn og ODS öryggi\nHitastillir (1,5kw lágmark, 2,8kw mið, 4,2kw mesta)\nGasnotkun 110g/klst á lágmarki, 200g/klst á mið, 305g/klst á hámarki\nPassar fyrir 10L gaskút\nHjól til að auðvelda flutning\nHallavörn\nStærð 42×38/15×73 cm\nÞyngd 8,3kg',
    },
    description: {
      en: 'A foldable gas heater on wheels: three ceramic plates with heat settings of 1.5, 2.8 and 4.2 kW, piezo ignition, a flame failure device, an oxygen depletion sensor and tip-over protection. It takes a gas bottle of up to 10 litres and weighs 8.3 kg, so it moves wherever the cold is.\n\nGood for a tent, a garage set or a holding area where running a diesel heater is overkill. Rents on its own or with our shelters. Delivered anywhere in Iceland.',
      is: 'Samanfellanlegur gashitari á hjólum: þrjár keramikplötur með hitastillingum 1,5, 2,8 og 4,2 kW, piezo kveikja, logavörn, súrefnisskynjari og hallavörn. Hann tekur allt að 10 lítra gaskút og vegur 8,3 kg, svo hann færist þangað sem kuldinn er.\n\nHentar í tjald, bílskúrssett eða biðsvæði þar sem olíuhitablásari væri of mikið. Leigist stakur eða með tjöldunum okkar. Afhentur hvert á land sem er.',
    },
    highlights: [
      {
        en: '1.5 / 2.8 / 4.2 kW heat settings',
        is: '1,5 / 2,8 / 4,2 kW hitastillingar',
      },
      {
        en: 'Flame failure, ODS and tip-over protection',
        is: 'Logavörn, ODS og hallavörn',
      },
      {
        en: 'Folds, 8.3 kg, on wheels',
        is: 'Fellur saman, 8,3 kg, á hjólum',
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
      en: 'Sandbags 10kg',
      is: 'Sandpokar 10kg',
    },
    tagline: {
      en: 'Sandbags 10kg - Yellow',
      is: 'Sandpokar 10kg - Gulir',
    },
    images: [
      '/uploads/mur5wdt5-8b33eabe.jpg',
    ],
    featured: false,
  },
  {
    id: 'e-mur645nn404b',
    slug: 'mini-scangrip-ljos-9-ljos-i-tosku',
    category: 'power',
    name: {
      en: 'Mini Scangrip lights Set of 9 in Pelicase',
      is: 'Mini Scangrip ljós - 9 ljós í tösku',
    },
    tagline: {
      en: 'Portable rechargeable LED floodlight / work light that can be used corded or cordless\nHigh-performance floodlight with 26 LEDs providing up to 1,000 lm of brightness\nOPTILight setting that optimizes brightness and runtime\nIP67 / IK07 (dust-tight, waterproof, and impact-resistant)\nCCT (Kelvin): 5700 K\nCRI: Ra > 80\nLength: 102 mm\nWidth: 39 mm\nHeight: 94 mm\nWeight: 278 g',
      is: 'Meðfærilegur endurhlaðanlegur LED kastari sem er unnt að nota með eða án snúru\nAfkastamikil kastari með 26 LED ljósum sem veita allt að 1000 lm birtu  \nOPTILight stilling sem hámarkar birtustig og endingartíma\nIP67/IK07 \nCCT (Kelvin): 5700\nCRI: Ra > 80\nLengd: 102 mm\nBreidd: 39 mm\nHæð: 94 mm\nÞyngd: 278g',
    },
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
    category: 'power',
    name: {
      en: 'Medium Scangrip lights - Battery',
      is: 'Miðlungs Scangrip ljós - Battery',
    },
    tagline: {
      en: 'Rechargeable LED light from Scangrip. Features the latest COB LED technology. NOVA R has been upgraded from 1,500 lumens to 2,000 lumens.',
      is: 'Endurhlaðanlegt LED ljós frá Scangrip. Innihledur nýjustu tækni COB LED. NOVA R hefur verið uppfærður úr 1500 lumen í 2000 lumen.',
    },
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
      en: 'Ruslatunnur',
      is: 'Trashcan',
    },
    tagline: {
      en: '',
      is: '',
    },
    images: [
      '/uploads/murcnas3-75a70f80.png',
    ],
    featured: false,
  },
  {
    id: 'e-murd25ab187f',
    slug: 'location-basecamp-techbase-crew-parking-skilti',
    category: 'shelter',
    name: {
      en: 'Location & Basecamp & Techbase & Crew parking Signs',
      is: 'Location & Basecamp & Techbase & Crew parking Skilti',
    },
    tagline: {
      en: 'Aluminum Location & Basecamp & Techbase & Crew parking Signs',
      is: 'Ál Location & Basecamp & Techbase & Crew parking Skilti',
    },
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
      en: '',
      is: '',
    },
    images: [
      '/uploads/murd46g0-e9e8b319.png',
    ],
    featured: false,
  },
]
