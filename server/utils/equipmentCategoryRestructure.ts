import type Database from 'better-sqlite3'
import type { EquipmentCategoryDef, LocalizedText } from '~~/app/types'

// ─────────────────────────────────────────────────────────────────────────────
// One-shot restructure of the equipment categories (2026-10-17).
//
// The owner asked for a tighter split of the catalogue: heaters alone, power
// without the lights, lighting / costume & makeup / catering / tools as their
// own categories, and clearer names for the shelter and cleaning categories.
// Categories are database rows (see equipmentCategoryStore.ts), so this runs
// once per database (meta flag) from getDb(): it rewrites the copy of the
// existing categories, inserts the new ones, keeps every former slug in
// `previousSlugs` so old addresses 301, and moves the affected items.
//
// After this has run the database is the source of truth again; later edits
// happen in /admin/equipment/categories.
// ─────────────────────────────────────────────────────────────────────────────

const FLAG = 'restructure:equipment-categories:2026-10'

type Spec = Omit<EquipmentCategoryDef, 'sort' | 'status' | 'updatedAt' | 'previousSlugs'>

const t = (is: string, en: string): LocalizedText => ({ is, en })

const CATEGORIES: Spec[] = [
  {
    id: 'heating',
    slug: t('hitablasarar', 'heaters'),
    name: t('Hitablásarar', 'Heaters'),
    title: t('Hitablásarar til leigu', 'Heaters for rent'),
    metaTitle: t('Hitablásarar til leigu', 'Heater Rental for Film Shoots'),
    metaDescription: t(
      'Olíuhitablásarar (21 og 81 kW), gashitari og rafmagnshitablásari til leigu fyrir kvikmyndatökur, tjöld og vinnusvæði. Hreint, þurrt loft, barkar og strompar fylgja. Afhending um land allt.',
      'Indirect diesel heaters (21 and 81 kW), a gas heater and an electric fan heater for rent for film shoots, tents and work sites. Clean, dry air, ducts and chimneys included. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Allir hitablásararnir okkar á einum stað: olíuhitablásarar, gashitari og rafmagnshitablásari til leigu fyrir kvikmyndatökur, tjöld, vinnusvæði og viðburði. Master olíuhitablásararnir eru óbeinir: útblásturinn fer út um stromp og aðeins hreint, þurrt og lyktarlaust heitt loft kemur inn í rýmið.',
        'All our heaters in one place: diesel heaters, a gas heater and an electric fan heater for rent for film shoots, tents, work sites and events. The Master diesel heaters are indirect-fired: the exhaust leaves through a chimney and only clean, dry, odourless warm air enters the space.',
      ),
      t(
        'BV 77 E (21 kW) hitar tjald tökuliðs eða biðsvæði og gengur um 19 klukkustundir á tankfylli. BV 290 E (81 kW) hitar stór tjöld, sali og stærri tökustaði hratt. Fyrir minni rými er samanfellanlegur gashitari á hjólum og 2000 W rafmagnshitablásari sem fer í venjulega innstungu.',
        'The BV 77 E (21 kW) heats a crew tent or holding area and runs about 19 hours per tank. The BV 290 E (81 kW) heats large tents, halls and big sets fast. For smaller spaces there is a foldable gas heater on wheels and a 2,000 W electric fan heater that runs off a normal socket.',
      ),
      t(
        'Hitablásararnir leigjast stakir eða með tjöldum, rafstöðvum og rafmagnstöflum, afhentir hvert á land sem er. Óskaðu eftir tilboði.',
        'Heaters rent on their own or with tents, generators and distribution boards, delivered anywhere in Iceland. Request an offer.',
      ),
    ],
    faq: [
      {
        q: t('Hver er munurinn á beinum og óbeinum hitablásara?', 'What is the difference between a direct and an indirect heater?'),
        a: t(
          'Óbeinn hitablásari leiðir útblásturinn út um stromp og blæs aðeins hreinu, þurru lofti inn. Þess vegna má nota Master BV blásarana okkar við tjöld og rými þar sem fólk dvelur.',
          'An indirect heater sends its exhaust out through a chimney and blows only clean, dry air inside. That is why our Master BV heaters can be used for tents and spaces where people stay.',
        ),
      },
      {
        q: t('Hversu lengi gengur hitablásarinn á tankfylli?', 'How long does the heater run on a tank?'),
        a: t('BV 77 E gengur um 19 klukkustundir á fullum tanki.', 'The BV 77 E runs about 19 hours on a full tank.'),
      },
      {
        q: t('Þarf rafmagn fyrir olíuhitablásarann?', 'Does the diesel heater need electricity?'),
        a: t(
          'Já, blásarinn þarf rafmagn fyrir viftu og brennara. Við leigjum rafstöðvar og rafmagnstöflur með.',
          'Yes, for the fan and burner. We rent generators and distribution boards alongside.',
        ),
      },
    ],
  },
  {
    id: 'power',
    slug: t('rafmagn', 'power'),
    name: t('Rafmagn', 'Power'),
    title: t('Rafstöðvar og rafmagn til leigu', 'Generators and power for rent'),
    metaTitle: t('Rafstöð til leigu', 'Generator Rental for Film Shoots'),
    metaDescription: t(
      'Rafstöðvar, EcoFlow rafhlöðustöðvar, rafmagnstöflur, framlengingarsnúrur, kefli og fjöltengi til leigu fyrir kvikmyndatökur og vinnusvæði. Hljóðlátar inverter-stöðvar. Afhending um land allt.',
      'Generators, EcoFlow power stations, distribution boards, extension cables, reels and multiplugs for rent for film shoots and work sites. Quiet inverter units. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Rafstöðvar til leigu ásamt öllu sem þarf til að koma rafmagninu þangað sem það á að fara: inverter-rafstöðvar 2,2 og 3,3 kVA, EcoFlow Delta 3 og Delta 3 Pro rafhlöðustöðvar með allt að 4.000 W afli, 16 og 32 amp þriggja fasa rafmagnstöflur, rafmagnskassi, framlengingarsnúrur, rafmagnskefli, stingerar og fjöltengi fyrir útinotkun.',
        'Generators for rent along with everything needed to get the power where it has to go: 2.2 and 3.3 kVA inverter generators, EcoFlow Delta 3 and Delta 3 Pro power stations with up to 4,000 W of output, 16 and 32 amp three-phase distribution boards, a power box, extension cables, cable reels, stingers and outdoor multiplugs.',
      ),
      t(
        'Inverter-straumur er öruggur fyrir myndavélar, tölvur og hljóðbúnað, og hljóðlátu stöðvarnar mega ganga nálægt setti. Rafhlöðustöðvarnar eru alveg hljóðlausar og henta þar sem engin vél má heyrast. Stálbrúsar fyrir bensín og dísil fylgja með svo rafstöðin gangi allan tökudaginn.',
        'Inverter output is safe for cameras, computers and sound gear, and the quiet units can run near set. The power stations are completely silent for places where no engine may be heard. Steel fuel cans for petrol and diesel keep the generator running all day.',
      ),
      t(
        'Allt leigist stakt eða sem heill rafmagnspakki með hitablásurum, ljósum og tjöldum, afhent hvert á land sem er. Óskaðu eftir tilboði.',
        'Everything rents on its own or as a complete power package with heaters, lights and tents, delivered anywhere in Iceland. Request an offer.',
      ),
    ],
    faq: [
      {
        q: t('Hvaða rafstöð hentar fyrir myndavélar og tölvur?', 'Which generator is right for cameras and computers?'),
        a: t(
          'Inverter-rafstöðvarnar okkar gefa hreinan straum sem er öruggur fyrir rafeindatæki. Fyrir alveg hljóðlausa notkun við settið er EcoFlow Delta 3 Pro rafhlöðustöðin með 4.000 W afl.',
          'Our inverter generators deliver clean power that is safe for electronics. For completely silent use next to set, the EcoFlow Delta 3 Pro power station gives 4,000 W of output.',
        ),
      },
      {
        q: t('Eruð þið með þriggja fasa rafmagn?', 'Do you have three-phase power?'),
        a: t(
          'Já, 16 og 32 amp þriggja fasa rafmagnstöflur og framlengingarsnúrur, fyrir stærri hitablásara og ljós.',
          'Yes, 16 and 32 amp three-phase distribution boards and extension cables, for the bigger heaters and lights.',
        ),
      },
    ],
  },
  {
    id: 'lighting',
    slug: t('lysing', 'lighting'),
    name: t('Lýsing', 'Lighting'),
    title: t('Lýsing til leigu', 'Lighting for rent'),
    metaTitle: t('Vinnuljós og kastarar til leigu', 'Work Light and Floodlight Rental'),
    metaDescription: t(
      'LED Nova 6K kastari á þrífæti og Scangrip batterísvinnuljós til leigu fyrir tökustaði, grunnbúðir og vinnusvæði. Engin snúra, fara upp á mínútu. Afhending um land allt.',
      'LED Nova 6K floodlight on a tripod and Scangrip battery work lights for rent for locations, basecamp and work sites. No cable, up in a minute. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Vinnulýsing til leigu fyrir tökustaði, grunnbúðir og vinnusvæði. LED Nova 6K kastarinn gefur 6.000 lúmen frá deyfanlegri COB-plötu á þrífæti og lýsir upp heilt vinnusvæði eða tækjabækistöð. Scangrip ljósin eru minni og handhæg: taska með níu litlum ljósum og miðlungsstórt batterísljós.',
        'Work lighting for rent for locations, basecamp and work sites. The LED Nova 6K floodlight gives 6,000 lumens from a dimmable COB panel on a tripod and lights a whole work area or techbase. The Scangrip lights are smaller and handy: a case of nine small lights and a medium battery light.',
      ),
      t(
        'Öll ljósin eru batterísknúin og fara upp án snúru, svo þau nýtast þar sem ekkert rafmagn er. Hleðslutæki fylgja og rafstöðvar og rafhlöðustöðvar eru í flokknum Rafmagn. Afhent hvert á land sem er. Óskaðu eftir tilboði.',
        'All the lights are battery powered and go up without a cable, so they work where there is no mains power. Chargers are included and generators and power stations are in the Power category. Delivered anywhere in Iceland. Request an offer.',
      ),
    ],
    faq: [
      {
        q: t('Þarf rafmagn fyrir ljósin?', 'Do the lights need mains power?'),
        a: t(
          'Nei, LED Nova kastarinn og Scangrip ljósin ganga á innbyggðum rafhlöðum. Þau eru hlaðin við afhendingu og hleðslutæki fylgja.',
          'No, the LED Nova floodlight and the Scangrip lights run on built-in batteries. They arrive charged and chargers are included.',
        ),
      },
    ],
  },
  {
    id: 'shelter',
    slug: t('tjold-regnvarnir-og-festingar', 'tents-rain-cover-and-rigging'),
    name: t('Tjöld, regnvarnir og festingar', 'Tents, Rain Cover & Rigging'),
    title: t('Tjöld, regnvarnir og festingar til leigu', 'Tents, rain cover and rigging for rent'),
    metaTitle: t('Skjóltjöld og yfirbreiðslur til leigu', 'Shelter Tent and Tarp Rental for Locations'),
    metaDescription: t(
      'Einangrað popup skjóltjald, yfirbreiðslur, regnhlífar, gúmmímottur, sandpokar, klemmur og strekkibönd til leigu fyrir kvikmyndatökur og grunnbúðir. Afhending um land allt.',
      'Insulated pop-up shelter, tarps, umbrellas, rubber mats, sandbags, clamps and ratchet straps for rent for film shoots and basecamp. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Skjól fyrir fólk og búnað á tökustað. Eskimo Outbreak 450XDP er einangrað popup tjald fyrir fjóra til fimm sem fer upp á mínútum og tekur hitablásara, hlýtt skjól fyrir leikara og tökulið milli taka.',
        'Shelter for people and gear on location. The Eskimo Outbreak 450XDP is an insulated pop-up tent for four to five people that goes up in minutes and takes a heater, a warm refuge for talent and crew between takes.',
      ),
      t(
        'Regnvarnirnar eru vatnsheldar yfirbreiðslur 3,6×4,8 m fyrir búnað og bíla, stórar regnhlífar fyrir myndavél og fólk og gúmmímottur sem halda gólfinu þurru og stömu. Festingarnar halda öllu á sínum stað í íslenskum vindi: 10 kg sandpokar, klemmur, strekkibönd og strekkjarar með krók.',
        'The rain cover is waterproof 3.6×4.8 m tarps for gear and vehicles, large umbrellas for camera and people, and rubber mats that keep the floor dry and grippy. The rigging keeps everything in place in Icelandic wind: 10 kg sandbags, clamps, ratchet straps and hook straps.',
      ),
      t(
        'Tjöldin leigjast stök eða með hitablásurum, rafstöðvum og húsgögnum, afhent hvert á land sem er. Óskaðu eftir tilboði.',
        'Tents rent on their own or with heaters, generators and furniture, delivered anywhere in Iceland. Request an offer.',
      ),
    ],
    faq: [],
  },
  {
    id: 'safety',
    slug: t('umferdaroryggi', 'safety-and-traffic'),
    name: t('Öryggi og umferð', 'Safety & Traffic'),
    title: t('Öryggis- og umferðarbúnaður til leigu', 'Safety and traffic equipment for rent'),
    metaTitle: t('Umferðarkeilur og skilti til leigu', 'Traffic Cone and Sign Rental'),
    metaDescription: t(
      'Umferðarkeilur 50 og 100 cm, hjáleiðarskilti, tökuskilti, grunnbúðaskilti, keiluljós, blikkljós, öryggisvesti og hjálmar til leigu fyrir kvikmyndatökur og vegalokanir. Afhending um land allt.',
      'Traffic cones 50 and 100 cm, detour signs, filming signs, basecamp signs, cone lights, warning beacons, safety vests and helmets for rent for film shoots and road closures. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Umferðarkeilur, skilti og öryggisbúnaður til leigu fyrir kvikmyndatökur, vegalokanir og vinnusvæði. Keilur í 50 og 100 cm, bannað-að-leggja keilur, LED keiluljós, öryggisblikkljós, hjáleiðarskilti og skilti sem segja vegfarendum að tökur séu í gangi.',
        'Traffic cones, signs and safety kit for rent for film shoots, road closures and work sites. Cones in 50 and 100 cm, no-parking cones, LED cone lights, warning beacons, detour signs and signs telling passers-by that filming is in progress.',
      ),
      t(
        'Skilti fyrir tökustað, grunnbúðir, tækjabækistöð og bílastæði tökuliðs vísa fólki rétta leið. Fyrir tökuliðið eru öryggisvesti, NOX hjálmar og plaststaurar til að girða af svæði. Allt leigist í magni, svo heil gata eða grunnbúðir merkjast úr einni afhendingu.',
        'Signs for location, basecamp, techbase and crew parking point everyone the right way. For the crew there are safety vests, NOX helmets and fence posts for closing off an area. Everything rents in quantity, so a whole street or basecamp can be marked from one delivery.',
      ),
      t(
        'Við afhendum hvert á land sem er og setjum saman umferðarpakka fyrir tökuna þína. Óskaðu eftir tilboði.',
        'We deliver anywhere in Iceland and put together a traffic package for your shoot. Request an offer.',
      ),
    ],
    faq: [],
  },
  {
    id: 'furniture',
    slug: t('husgogn', 'furniture'),
    name: t('Húsgögn', 'Furniture'),
    title: t('Húsgögn til leigu fyrir grunnbúðir', 'Basecamp furniture for rent'),
    metaTitle: t('Borð og stólar til leigu fyrir tökustaði', 'Table and Chair Rental for Locations'),
    metaDescription: t(
      'Samanbrjótanleg borð og stólar til leigu fyrir grunnbúðir og tökustaði. Leigjast með tjöldum og hitablásurum. Afhending um land allt. Óskaðu eftir tilboði.',
      'Folding tables and chairs for rent for basecamp and locations. Rent with tents and heaters. Delivery anywhere in Iceland. Request an offer.',
    ),
    intro: [
      t(
        'Samanbrjótanleg borð og stólar til leigu fyrir grunnbúðir, veitingatjöld, förðun og biðsvæði á tökustað. Létt, fljótleg að setja upp og komast í hvaða bíl sem er hjá okkur.',
        'Folding tables and chairs for rent for basecamp, catering tents, makeup and holding areas on location. Light, quick to set up and they fit in any of our vehicles.',
      ),
      t(
        'Húsgögnin leigjast stök eða með tjöldum og hitablásurum, svo grunnbúðirnar koma tilbúnar í einni afhendingu, hvert á land sem er.',
        'Furniture rents on its own or with tents and heaters, so basecamp arrives ready in one delivery, anywhere in Iceland.',
      ),
    ],
    faq: [],
  },
  {
    id: 'catering',
    slug: t('catering', 'catering'),
    name: t('Catering', 'Catering'),
    title: t('Catering búnaður til leigu', 'Catering equipment for rent'),
    metaTitle: t('Catering búnaður til leigu fyrir tökustaði', 'Catering Equipment Rental for Locations'),
    metaDescription: t(
      'Hitakönnur og annar búnaður fyrir kaffi og veitingar á tökustað til leigu. Leigist með borðum, stólum og tjöldum fyrir grunnbúðir. Afhending um land allt.',
      'Thermal jugs and other kit for coffee and catering on location for rent. Rents with tables, chairs and tents for basecamp. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Búnaður fyrir kaffi og veitingar á tökustað. Hitakönnurnar halda kaffi og heitu vatni heitu allan tökudaginn, hvort sem er í grunnbúðum eða úti á tökustað.',
        'Kit for coffee and catering on location. The thermal jugs keep coffee and hot water hot through the whole shooting day, in basecamp or out on set.',
      ),
      t(
        'Catering búnaðurinn leigist með samanbrjótanlegum borðum og stólum, tjöldum og hitablásurum, svo veitingasvæðið kemur tilbúið í einni afhendingu, hvert á land sem er. Vanti þig eitthvað sem er ekki á listanum, hafðu samband.',
        'The catering kit rents with folding tables and chairs, tents and heaters, so the catering area arrives ready in one delivery, anywhere in Iceland. If you need something that is not on the list, get in touch.',
      ),
    ],
    faq: [],
  },
  {
    id: 'costume',
    slug: t('buningar-og-makeup', 'costume-and-makeup'),
    name: t('Búningar og makeup', 'Costume & Makeup'),
    title: t('Búnaður fyrir búninga og förðun til leigu', 'Costume and makeup equipment for rent'),
    metaTitle: t('Fataslár og herðatré til leigu', 'Clothes Rail and Hanger Rental for Film Shoots'),
    metaDescription: t(
      'Fellanlegar fataslár, non slip herðatré og buxnaherðatré til leigu fyrir búningadeild og förðun á tökustað. Leigist með borðum, stólum og tjöldum. Afhending um land allt.',
      'Folding clothes rails, non-slip hangers and trouser hangers for rent for the costume and makeup departments on location. Rents with tables, chairs and tents. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Búnaður fyrir búningadeild og förðun á tökustað. Fellanleg fataslá, 1000 mm breið, kemur búningunum upp úr töskunum og non slip herðatré í settum af 50 og buxnaherðatré í settum af 20 halda þeim hreinum og krumpulausum milli taka.',
        'Kit for the costume and makeup departments on location. A folding 1,000 mm clothes rail gets the costumes out of the bags, and non-slip hangers in sets of 50 and trouser hangers in sets of 20 keep them clean and uncreased between takes.',
      ),
      t(
        'Leigist með samanbrjótanlegum borðum og stólum, tjöldum og hitablásurum, svo búninga- og förðunaraðstaðan kemur tilbúin í einni afhendingu, hvert á land sem er. Óskaðu eftir tilboði.',
        'Rents with folding tables and chairs, tents and heaters, so the costume and makeup station arrives ready in one delivery, anywhere in Iceland. Request an offer.',
      ),
    ],
    faq: [],
  },
  {
    id: 'tools',
    slug: t('verkfaeri', 'tools'),
    name: t('Verkfæri', 'Tools'),
    title: t('Verkfæri til leigu', 'Tools for rent'),
    metaTitle: t('Verkfæri til leigu fyrir tökustaði', 'Tool Rental for Film Shoots'),
    metaDescription: t(
      'Starttæki 12 V og 24 V, loftdæla, stigi og dráttartóg til leigu fyrir kvikmyndatökur og vinnusvæði. Leigist með bílum og öðrum búnaði. Afhending um land allt.',
      '12 V and 24 V jump starters, an air pump, a step ladder and a tow rope for rent for film shoots and work sites. Rents with our vehicles and the rest of the kit. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Verkfærin sem bjarga tökudeginum. NOCO GBX155 starttæki fyrir 12 V fólksbíla og jeppa og 24 V starttæki fyrir vörubíla koma dauðum bíl í gang á staðnum. Loftdælan sér um dekk og loftdýnur, fjögurra þrepa stiginn nær upp í ljós og skilti og 15 m dráttartógið losar bíl sem situr fastur.',
        'The tools that save the shooting day. A NOCO GBX155 jump starter for 12 V cars and SUVs and a 24 V starter for trucks get a dead vehicle going on the spot. The air pump handles tyres and air mattresses, the four-step ladder reaches lights and signs, and the 15 m tow rope frees a vehicle that is stuck.',
      ),
      t(
        'Verkfærin leigjast stök eða með bílunum okkar og öðrum búnaði, afhent hvert á land sem er. Óskaðu eftir tilboði.',
        'Tools rent on their own or with our vehicles and the rest of the kit, delivered anywhere in Iceland. Request an offer.',
      ),
    ],
    faq: [],
  },
  {
    id: 'cleaning',
    slug: t('thrif-og-rusl', 'cleaning-and-waste'),
    name: t('Þrif og rusl', 'Cleaning & Waste'),
    title: t('Þrif og rusl á tökustað', 'Cleaning and waste on location'),
    metaTitle: t('Skóflur, kústar og ruslatunnur til leigu', 'Shovel, Broom and Bin Rental'),
    metaDescription: t(
      'Skóflur, kústar, Makita laufblásari og ruslatunnur til leigu fyrir tökustaði og grunnbúðir. Skilaðu tökustaðnum eins og hann var. Afhending um land allt.',
      'Shovels, brooms, a Makita blower and bins for rent for locations and basecamp. Leave the location the way it was. Delivery anywhere in Iceland.',
    ),
    intro: [
      t(
        'Allt sem þarf til að halda tökustaðnum hreinum og skila honum eins og hann var. Fiskars stunguskófla og skófla, breiður 40 cm kústur og Makita 18 V blásari með stuttum og löngum stút fyrir möl, snjó og laufblöð. Ruslatunnur fyrir grunnbúðir og veitingasvæði halda ruslinu á einum stað.',
        'Everything needed to keep the location clean and hand it back the way it was. A Fiskars digging shovel and shovel, a wide 40 cm broom and a Makita 18 V blower with short and long nozzles for gravel, snow and leaves. Bins for basecamp and the catering area keep the waste in one place.',
      ),
      t(
        'Leigist með öðrum búnaði og bílunum okkar, afhent hvert á land sem er. Óskaðu eftir tilboði.',
        'Rents with the rest of the equipment and our vehicles, delivered anywhere in Iceland. Request an offer.',
      ),
    ],
    faq: [],
  },
]

/** Items that change category, by id. Everything else keeps its category. */
const ITEM_MOVES: Record<string, string> = {
  // Lights out of Power into Lighting
  'e-mr754c8n9357': 'lighting', // Kastari LED NOVA 6K með þrífæti
  'e-mur645nn404b': 'lighting', // Mini Scangrip ljós, 9 ljós í tösku
  'e-mur67h7t57f2': 'lighting', // Miðlungs Scangrip ljós
  // Tools
  'e-msejvh5a659c': 'tools', // Loftdæla
  'e-018': 'tools', // Starttæki fyrir vörubíla 24V
  'e-020': 'tools', // Starttæki 12V (NOCO GBX155)
  'e-muubfa11444e': 'tools', // 4 tröppu stigi
  'e-016': 'tools', // Dráttartóg 15 m
  // Safety: the warning beacon and the basecamp signs
  'e-mu77oa2z8637': 'safety', // Öryggis blikkljós
  'e-murd25ab187f': 'safety', // Location & Basecamp & Techbase & Crew parking skilti
  // Rigging into Tents, rain cover & rigging
  'e-023': 'shelter', // Strekkiborði 0,25 t
  'e-024': 'shelter', // Strekkjari með krók
  // Costume & makeup
  'e-muuawds101e3': 'costume', // Non slip herðatré, sett af 50
  'e-muuayhik0574': 'costume', // Fellanleg fataslá 1000 mm
  'e-muubj0xl996d': 'costume', // Buxna herðatré, sett af 20
  // Catering
  'e-muvovrfn3da0': 'catering', // Thermal kanna
}

type Row = { id: string, sort: number, status: string, data: string }

export function restructureEquipmentCategories(db: Database.Database) {
  if (db.prepare('SELECT value FROM meta WHERE key = ?').get(FLAG)) return

  const now = new Date().toISOString()
  const getRow = db.prepare('SELECT id, sort, status, data FROM equipment_categories WHERE id = ?')
  const upsert = db.prepare(`
    INSERT INTO equipment_categories (id, sort, status, data, updated_at) VALUES (?, ?, 'active', ?, ?)
    ON CONFLICT(id) DO UPDATE SET sort = excluded.sort, status = 'active', data = excluded.data, updated_at = excluded.updated_at
  `)
  const items = db.prepare('SELECT id, data FROM equipment').all() as { id: string, data: string }[]
  const updateItem = db.prepare('UPDATE equipment SET data = ?, updated_at = ? WHERE id = ?')

  db.transaction(() => {
    CATEGORIES.forEach((spec, i) => {
      const existing = getRow.get(spec.id) as Row | undefined
      const prev = existing ? JSON.parse(existing.data) as Partial<EquipmentCategoryDef> : undefined

      // Every slug the category ever had, minus the current ones, so old
      // addresses keep redirecting after the rename.
      const history = new Set<string>(prev?.previousSlugs ?? [])
      for (const s of [prev?.slug?.is, prev?.slug?.en]) if (s) history.add(s)
      history.delete(spec.slug.is)
      history.delete(spec.slug.en)

      const data = {
        slug: spec.slug,
        name: spec.name,
        title: spec.title,
        metaTitle: spec.metaTitle,
        metaDescription: spec.metaDescription,
        intro: spec.intro,
        faq: spec.faq,
        previousSlugs: [...history],
      }
      upsert.run(spec.id, i, JSON.stringify(data), now)
    })

    // Any category this list does not know about (added in the admin since)
    // is pushed below the known ones so the ordering stays unambiguous.
    const known = new Set(CATEGORIES.map(c => c.id))
    const others = (db.prepare('SELECT id FROM equipment_categories ORDER BY sort').all() as { id: string }[])
      .filter(r => !known.has(r.id))
    const bump = db.prepare('UPDATE equipment_categories SET sort = ? WHERE id = ?')
    others.forEach((r, i) => bump.run(CATEGORIES.length + i, r.id))

    let moved = 0
    for (const row of items) {
      const target = ITEM_MOVES[row.id]
      if (!target) continue
      const item = JSON.parse(row.data) as { category?: string }
      if (item.category === target) continue
      item.category = target
      updateItem.run(JSON.stringify(item), now, row.id)
      moved++
    }

    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(FLAG, '1')
    console.log(`[db] equipment_categories: restructured into ${CATEGORIES.length} categories, moved ${moved} items`)
  })()
}
