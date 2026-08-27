import type { Vehicle } from '~/types'

// The live catalogue, mirrored. Production's SQLite database is the source of
// truth (admin panel edits win); this file seeds fresh installs and carries
// SEO copy pushed to production via SEED_UPDATES in server/utils/db.ts.
// Synced from https://creativefilmmaking.is/api/vehicles on 2026-08-27.
export const vehicles: Vehicle[] = [
  {
    id: 'v-mr6s6va62bc8',
    slug: '4x4-silverado-location-pickup',
    category: 'support-vehicles',
    featured: false,
    name: {
      en: '4x4 Silverado Location Pickup',
      is: '4x4 Silverado location pallbíll',
    },
    tagline: {
      en: 'A 4x4 pickup for rent: 33" tires, tow hitch and room for the whole location kit.',
      is: 'Fjórhjóladrifinn pallbíll til leigu: 33" dekk, dráttarkrókur og pláss fyrir allt location-dótið.',
    },
    description: {
      en: 'A 4x4 Silverado pickup, the essential vehicle for any location work. It rides on 33" mud-terrain tires and switches to studded tires through the winter, so it keeps going when the road turns to gravel, snow or worse.\n\nThe tow hitch pulls our trailers and caravans, and the bed hauls gear, timber and everything in between, which also makes it a solid rental for hauling jobs outside film work.',
      is: 'Fjórhjóladrifinn Silverado pallbíll, ómissandi í alla location-vinnu. Hann er á 33" grófum dekkjum og fer á negld dekk yfir veturinn, svo hann heldur áfram þegar vegurinn breytist í möl, snjó eða eitthvað verra.\n\nDráttarkrókurinn dregur kerrurnar og hjólhýsin okkar og pallurinn tekur búnað, timbur og allt þar á milli, sem gerir hann líka að góðum leigubíl í flutningsverkefni utan kvikmyndavinnu.',
    },
    highlights: [
      {
        en: '4x4 on 33" mud-terrain tires, studded in winter',
        is: '4x4 á 33" grófum dekkjum, negldum á veturna',
      },
      {
        en: 'Drives on a standard car licence',
        is: 'Þarfnast ekki meiraprófs til að keyra',
      },
      {
        en: 'Tow hitch for trailers and caravans',
        is: 'Dráttarkrókur fyrir kerrur og hjólhýsi',
      },
    ],
    specs: {
      seats: 5,
      drivetrain: '4x4',
      transmission: 'automatic',
      fuel: 'petrol',
      winterEquipped: true,
      towHitch: true,
    },
    images: [
      '/uploads/mr6s63ci-b77c33ad.jpeg',
      '/uploads/mr6s65w7-0da608d8.jpeg',
      '/uploads/mr6s66ol-5b612489.jpeg',
      '/uploads/mr6s68ip-efd7c0c3.jpeg',
      '/uploads/mr6s6a68-580f4b8f.jpeg',
      '/uploads/mr6s6bes-fad419b7.jpeg',
      '/uploads/mr6s6bvn-4e5e798c.jpeg',
      '/uploads/mr6s6f6v-9a1f6e91.jpeg',
      '/uploads/mr6s6i3o-7900883c.jpeg',
      '/uploads/mr6s6mlk-42133447.jpeg',
    ],
  },
  {
    id: 'v-mre1v2ud010c',
    slug: 'ford-transit-kassabill-minnaprofs',
    category: 'equipment-cars',
    featured: true,
    name: {
      en: 'Ford Transit Box Truck (No Special Licence)',
      is: 'Ford Transit - Kassabíll (Minnaprófs)',
    },
    tagline: {
      en: 'A box truck with electric tail lift for rent; drives on a standard car licence.',
      is: 'Kassabíll með rafmagnslyftu til leigu; þarf ekki meirapróf.',
    },
    description: {
      en: 'Our Ford Transit box truck is perfect for gear and equipment, whether for the camera, art or location department. It is a comfortable size to drive, needs no special licence, and comes on brand-new summer tires with studded tires in winter.\n\nThe box truck is also for rent to private and business customers: the electric tail lift makes moving days, furniture hauls and warehouse runs easy, and the closed box keeps everything dry in any weather.',
      is: 'Ford Transit kassabíllinn okkar er tilvalinn fyrir tæki og búnað, hvort sem það er fyrir myndavéladeild, leikmyndadeild eða locationdeild. Hann er þægileg stærð, þarfnast ekki meiraprófs og kemur á glænýjum sumardekkjum og negldum dekkjum á veturna.\n\nKassabíllinn er líka til leigu fyrir einstaklinga og fyrirtæki: rafmagnslyftan gerir búslóðaflutninga, húsgagnaflutninga og lagerflutninga létta og lokaður kassinn heldur öllu þurru í öllum veðrum.',
    },
    highlights: [
      {
        en: 'Electric tail lift and side door into the box',
        is: 'Með rafmagnslyftu og hliðarhurð til að komast í kassann',
      },
      {
        en: 'No special licence needed',
        is: 'Þarf ekki meirapróf',
      },
      {
        en: 'Shelving available on request',
        is: 'Getur komið með hillu',
      },
      {
        en: 'Perfect splinter-unit vehicle',
        is: 'Fullkominn splinter unit bíll',
      },
      {
        en: 'Also rented to private and business customers, e.g. for moving days',
        is: 'Leigist líka einstaklingum og fyrirtækjum, t.d. í búslóðaflutninga',
      },
    ],
    specs: {
      units: 1,
      seats: 2,
      drivetrain: '2wd',
      transmission: 'automatic',
      fuel: 'diesel',
      winterEquipped: true,
    },
    images: [
      '/uploads/mre1dbo6-84a487e3.png',
      '/uploads/mre1daou-23831af7.png',
      '/uploads/mre1dazm-40560b13.png',
    ],
  },
  {
    id: 'v-mre45ytvabcb',
    slug: 'vw-transporter-kassabill-minnaprofs',
    category: 'equipment-cars',
    featured: true,
    name: {
      en: 'VW Transporter Box Truck (No Special Licence)',
      is: 'VW Transporter - Kassabíll (Minnaprófs)',
    },
    tagline: {
      en: 'A box truck with electric tail lift for rent; drives on a standard car licence.',
      is: 'Kassabíll með rafmagnslyftu til leigu; þarf ekki meirapróf.',
    },
    description: {
      en: 'Our VW Transporter box truck is perfect for gear and equipment, whether for the camera, art or location department. It is a comfortable size to drive, needs no special licence, and comes on brand-new summer tires with studded tires in winter.\n\nThe box truck is also for rent to private and business customers: the electric tail lift makes moving days, furniture hauls and warehouse runs easy, and the closed box keeps everything dry in any weather.',
      is: 'VW Transporter kassabíllinn okkar er tilvalinn fyrir tæki og búnað, hvort sem það er fyrir myndavéladeild, leikmyndadeild eða locationdeild. Hann er þægileg stærð, þarfnast ekki meiraprófs og kemur á glænýjum sumardekkjum og negldum dekkjum á veturna.\n\nKassabíllinn er líka til leigu fyrir einstaklinga og fyrirtæki: rafmagnslyftan gerir búslóðaflutninga, húsgagnaflutninga og lagerflutninga létta og lokaður kassinn heldur öllu þurru í öllum veðrum.',
    },
    highlights: [
      {
        en: 'Electric tail lift and side door into the box',
        is: 'Með rafmagnslyftu og hliðarhurð til að komast í kassann',
      },
      {
        en: 'No special licence needed',
        is: 'Þarf ekki meirapróf',
      },
      {
        en: 'Shelving available on request',
        is: 'Getur komið með hillu',
      },
      {
        en: 'Perfect splinter-unit vehicle',
        is: 'Fullkominn splinter unit bíll',
      },
      {
        en: 'Also rented to private and business customers, e.g. for moving days',
        is: 'Leigist líka einstaklingum og fyrirtækjum, t.d. í búslóðaflutninga',
      },
    ],
    specs: {
      units: 1,
      seats: 2,
      drivetrain: '2wd',
      transmission: 'automatic',
      fuel: 'diesel',
      winterEquipped: true,
      towHitch: true,
    },
    images: [
      '/uploads/mre44m0r-7307bd5e.jpeg',
      '/uploads/mre44mb6-784ea628.jpeg',
      '/uploads/mre44mnw-b9785cb9.jpeg',
      '/uploads/mre44mz7-d3c22863.jpeg',
      '/uploads/mre44n73-36ec73e8.jpeg',
      '/uploads/mseir7mx-9e91017e.png',
    ],
  },
  {
    id: 'v-011',
    slug: 'can-am-outlander-max-6x6-850',
    category: 'support-vehicles',
    featured: true,
    name: {
      en: 'Can-Am Outlander MAX 6x6 850',
      is: 'Can-Am Outlander MAX 6x6 850',
    },
    tagline: {
      en: 'A six-wheeler for rent: a brand-new 2026 Can-Am that hauls gear and crew beyond the end of the road.',
      is: 'Sexhjól til leigu: glænýtt Can-Am árgerð 2026 sem flytur búnað og fólk út fyrir enda vegarins.',
    },
    description: {
      en: 'The massively upgraded 2026 Outlander MAX 6x6: an 82 hp Rotax 999 cc V-twin, a pDrive primary CVT with work calibration and extra-low gear, and selectable 4WD / 6WD with a Visco-Lok QE auto-locking front differential. Tri-Mode Dynamic Power Steering, selectable engine modes and Intelligent Engine Braking keep it composed hauling camera gear up a moraine or easing it back down a river bank.\n\nIt tows 830 kg, carries 454 kg on the rear cargo bed and swallows 275 litres in built-in storage, including a 30-litre front compartment, riding on 28" XPS Trail King tires on 14" aluminum wheels with 30.5 cm of ground clearance. Road-registered (T3, 65 km/h), so it legally links basecamp and set on public roads, and the removable passenger seat carries a spotter or comes off for more cargo.\n\nThe six-wheeler is also for rent to private and business renters outside film: round-ups, hunting trips, estate work or backcountry adventures. Road registration means you can ride it between areas without a trailer.',
      is: 'Gríðarlega uppfærður 2026 Outlander MAX 6x6: 82 hestafla Rotax 999cc V2-mótor, pDrive kúpling með vinnustillingu og auka lágum gír, og veljanlegt fjór- eða sexhjóladrif með Visco-Lok QE sjálflæsandi framdrifslæsingu. Þrístillanlegt rafmagnsstýri, akstursstillingar og stillanleg mótorbremsa halda honum öruggum með myndavélabúnað upp skriðu eða rólega niður árbakka.\n\nHann dregur 830 kg, ber 454 kg á palli að aftan og rúmar 275 lítra í innbyggðum geymslum, þar af 30 lítra farangurshólf að framan, á 28" XPS Trail King dekkjum á 14" álfelgum með 30,5 cm veghæð. Götuskráður (T3, 65 km/h) svo hann tengir grunnbúðir og sett löglega um þjóðveg, og lausa farþegasætið tekur aðstoðarmann eða fer af fyrir meiri farm.\n\nSexhjólið er líka til leigu fyrir einstaklinga og fyrirtæki utan kvikmyndageirans: smalamennsku, veiðiferðir, vinnu á landareign eða ævintýraferðir. Götuskráningin þýðir að þú mátt keyra það á milli svæða án kerru.',
    },
    highlights: [
      {
        en: '82 hp Rotax 999 cc V-twin with selectable 4WD / 6WD and Visco-Lok QE auto-locking front differential',
        is: '82 hestafla Rotax 999cc V2-mótor með veljanlegu fjór-/sexhjóladrifi og Visco-Lok QE sjálflæsandi framdrifi',
      },
      {
        en: '830 kg towing capacity and 454 kg cargo-bed capacity',
        is: '830 kg dráttargeta og 454 kg burðargeta á palli',
      },
      {
        en: '28" XPS Trail King tires on 14" aluminum wheels, 30.5 cm ground clearance',
        is: '28" XPS Trail King dekk á 14" álfelgum, 30,5 cm veghæð',
      },
      {
        en: 'Tri-Mode Dynamic Power Steering, engine modes and Intelligent Engine Braking (iEB)',
        is: 'Þrístillanlegt rafmagnsstýri, akstursstillingar og stillanleg mótorbremsa (iEB)',
      },
      {
        en: 'Road-registered (T3, 65 km/h) with LED lighting, mirrors and a removable passenger seat',
        is: 'Götuskráður (T3, 65 km/h) með LED-lýsingu, speglum og lausu farþegasæti',
      },
    ],
    specs: {
      seats: 2,
      lengthM: 3.2,
      heightM: 1.4,
      weightKg: 631,
      towingCapacityKg: 830,
      payloadKg: 454,
      drivetrain: '6x6',
      transmission: 'automatic',
      fuel: 'petrol',
      winterEquipped: true,
      towHitch: true,
      extra: {
        en: 'Model year 2026 · 275 L built-in storage · 19.5 L fuel tank · full skid plate · 2 in. rear hitch and tow ball',
        is: 'Árgerð 2026 · 275 l innbyggð geymsla · 19,5 l tankur · heil botnplata · 2" dráttarkúla að aftan',
      },
    },
    images: [
      '/images/vehicles/can-am-outlander-max-6x6-a.jpg',
      '/images/vehicles/can-am-outlander-max-6x6-b.jpg',
      '/images/vehicles/can-am-outlander-max-6x6-c.jpg',
    ],
  },
  {
    id: 'v-010',
    slug: 'hobby-560-wfu-prestige-caravan',
    category: 'trailers',
    featured: true,
    name: {
      en: 'Hobby Prestige 560 WFU Caravan',
      is: 'Hobby Prestige 560 WFU hjólhýsi',
    },
    tagline: {
      en: 'Caravans for rent: four identical 2026 units, run on electricity and gas, private bathroom with shower.',
      is: 'Hjólhýsi til leigu: fjögur eins, árgerð 2026, ganga á rafmagni og gasi, sér baðherbergi með sturtu.',
    },
    description: {
      en: 'Brand-new Hobby Prestige 560 WFU caravans, model year 2026, based in Reykjavík. The perfect setup for actors: they run on both electricity and gas, so you can always keep them warm, and each one has its own bathroom with a beautiful shower. We have four identical units, so no actor ever gets a lesser trailer than another. This is a high-class caravan that suits any cast, and it always doubles as overnight accommodation if it comes to that.\n\nEvery caravan comes fully equipped: solar panel and battery, an adapter (CEE plug to Schuko socket) plus an extra 25 m CEE power cable, gas grill with grilling tools, camping chairs and an outdoor table. Inside there is heating (gas central heating and an electric fan heater), an oven and gas stove, pots and pans, cutlery, plates and bowls, glasses and cups, a fridge with freezer compartment, a coffee maker, a kettle, a toilet and shower, and towels.\n\nThe caravans are also for rent to private renters: a fully equipped caravan for the summer holiday, a camping weekend, a family reunion or as guest accommodation. Everything is included, from the gas grill to the towels, so you just hook up and go.',
      is: 'Glæný Hobby Prestige 560 WFU hjólhýsi, árgerð 2026, staðsett í Reykjavík. Fullkomin aðstaða fyrir leikara: þau ganga bæði á rafmagni og gasi svo þú getir alltaf haldið þeim heitum, og hvert um sig er með sér baðherbergi með fallegri sturtu. Við erum með fjögur alveg eins stykki svo það verði aldrei mismunað leikurunum. Þetta er háklassa hýsi sem ætti að henta fyrir alla leikara, og það er einnig alltaf hægt að nota það sem gistingu ef út í það er farið.\n\nHverju hýsi fylgir fullur búnaður: sólarsella og rafgeymir, breytistykki (CEE tengi í Schuko innstungu) ásamt auka 25 m CEE rafmagnssnúru, gasgrill með grilláhöldum, tjaldstólar og útileguborð. Að innan er hitari (gasmiðstöð og hitablásari), ofn og gaseldavél, pottar og pönnur, hnífapör, diskar og skálar, glös og bollar, ísskápur með frystihólfi, kaffivél, hraðsuðuketill, klósett og sturta, og handklæði.\n\nHjólhýsin eru líka til leigu fyrir einstaklinga: fullbúinn ferðavagn í sumarfríið, útileguna, ættarmótið eða sem gistiaðstaða fyrir gesti. Allt fylgir, frá gasgrilli til handklæða, svo þú tengir bara við krókinn og leggur af stað.',
    },
    highlights: [
      {
        en: 'Runs on both electricity and gas: gas central heating + electric fan heater keep it warm anywhere',
        is: 'Gengur bæði á rafmagni og gasi: gasmiðstöð + hitablásari halda hita hvar sem er',
      },
      {
        en: 'Private bathroom with toilet and a beautiful hot shower',
        is: 'Sér baðherbergi með klósetti og fallegri heitri sturtu',
      },
      {
        en: 'Four identical units, so no actor is ever treated differently',
        is: 'Fjögur alveg eins stykki svo það verði aldrei mismunað leikurunum',
      },
      {
        en: 'Solar panel and battery, plus 25 m CEE cable and Schuko adapter',
        is: 'Sólarsella og rafgeymir, ásamt 25 m CEE snúru og Schuko breytistykki',
      },
      {
        en: 'Full kitchen (oven, gas stove, fridge with freezer, coffee maker) and gas grill with camping furniture',
        is: 'Fullbúið eldhús (ofn, gaseldavél, ísskápur með frysti, kaffivél) og gasgrill með útilegusetti',
      },
      {
        en: 'Also rented to private renters, e.g. for holidays and camping trips',
        is: 'Leigist líka einstaklingum, t.d. í sumarfrí og útilegur',
      },
    ],
    specs: {
      units: 4,
      sleeps: 4,
      lengthM: 7.5,
      powerOutput: 'Shore power (CEE) / solar panel + battery',
      heating: true,
      winterEquipped: true,
      extra: {
        en: 'Model year 2026 · based in Reykjavík · width 2.50 m · max weight 2,000 kg per unit',
        is: 'Árgerð 2026 · staðsett í Reykjavík · breidd 2,50 m · heildarþyngd 2.000 kg á hýsi',
      },
    },
    images: [
      '/uploads/mszxi32y-716e9e86.jpeg',
      '/uploads/mrl4p9yq-e983546b.jpg',
      '/uploads/mrl4p8wp-c588c8a8.jpg',
      '/uploads/mrl4p8ev-b5647040.jpg',
      '/uploads/mrl4p9py-a4cf468e.jpg',
      '/uploads/mrl4pa6r-e49dddde.jpg',
      '/uploads/mrl4p7tc-3a903667.jpg',
      '/uploads/mrl4p7ko-3270b87b.jpg',
      '/uploads/mrl4pahi-fa451d56.jpg',
      '/uploads/mszxi3e4-ca250abc.jpeg',
      '/uploads/mszxi3ko-b361a3b5.jpeg',
      '/uploads/mszxih2h-25db8ae8.jpg',
      '/uploads/mszxii9a-337bb35f.jpg',
      '/uploads/mszxijih-de8d22bb.jpg',
      '/uploads/mszxiknv-84a50f4c.jpg',
      '/uploads/mszxilyo-62304b9e.jpg',
    ],
  },
  {
    id: 'v-013',
    slug: 'ford-transit-cargo-van',
    category: 'equipment-cars',
    featured: false,
    name: {
      en: 'Ford Transit Cargo Van',
      is: 'Ford Transit sendibíll',
    },
    tagline: {
      en: 'A shelved panel van with roof rack for gear runs and daily hauls.',
      is: 'Sendibíll til leigu með hillum og toppgrind; jafn góður í búnaðarferðir og búslóðaflutninga.',
    },
    description: {
      en: 'The everyday workhorse for gear runs, pickups and deliveries between warehouse, basecamp and set. A full-height bulkhead separates the cab from the cargo bay, where a plywood shelving unit keeps cases, consumables and smalls organized instead of sliding around loose. Interior lighting and a rubber-matted floor make dark load-ins easier on people and equipment.\n\nUp top, a full-length roof rack with a rear access ladder carries ladders, poles and lengths of timber. A side sliding door gives kerbside access, and the tow hitch adds one of our trailers when a run outgrows the cargo bay.\n\nIt suits private and business renters just as well: moving days, furniture pickups, building materials and around-town deliveries. The sliding door and shelving make loading quick, and the roof rack takes whatever won\'t fit inside.',
      is: 'Hversdagsvinnuhesturinn í búnaðarferðir, sóttir og sendingar milli lagers, grunnbúða og tökustaðar. Heilt skilrúm skilur ökumannshúsið frá flutningsrýminu, þar sem krossviðarhillur halda töskum, rekstrarvörum og smáhlutum skipulögðum í stað þess að renna til lausar. Innilýsing og gúmmímotta á gólfi gera dimmar hleðslur þægilegri fyrir fólk og búnað.\n\nUppi á þaki tekur toppgrind í fullri lengd með stiga að aftan stiga, rör og timbur. Rennihurð á hlið gefur aðgengi frá gangstétt og dráttarkrókurinn bætir einum af vögnunum okkar við þegar ferðin sprengir flutningsrýmið.\n\nSendibíllinn hentar einstaklingum og fyrirtækjum alveg jafn vel: búslóðaflutningar, húsgagnasóttir, byggingarefni og sendingar innanbæjar. Rennihurðin og hillurnar gera hleðslu fljótlega og toppgrindin tekur það sem ekki kemst inn.',
    },
    highlights: [
      {
        en: 'Plywood shelving unit keeps cases and smalls organized',
        is: 'Krossviðarhillur halda töskum og smáhlutum skipulögðum',
      },
      {
        en: 'Full-length roof rack with rear access ladder',
        is: 'Toppgrind í fullri lengd með stiga að aftan',
      },
      {
        en: 'Full-height bulkhead between cab and cargo bay',
        is: 'Heilt skilrúm milli ökumannshúss og flutningsrýmis',
      },
      {
        en: 'Interior cargo lighting and rubber-matted floor',
        is: 'Innilýsing í flutningsrými og gúmmímotta á gólfi',
      },
      {
        en: 'Tow hitch for our equipment trailers',
        is: 'Dráttarkrókur fyrir búnaðarvagnana okkar',
      },
      {
        en: 'Also rented to private and business customers, e.g. for moving days',
        is: 'Leigist líka einstaklingum og fyrirtækjum, t.d. í búslóðaflutninga',
      },
    ],
    specs: {
      fuel: 'diesel',
      towHitch: true,
    },
    images: [
      '/images/vehicles/ford-transit-a.jpg',
      '/images/vehicles/ford-transit-b.jpg',
      '/images/vehicles/ford-transit-c.jpg',
      '/images/vehicles/ford-transit-d.jpg',
      '/images/vehicles/ford-transit-e.jpg',
      '/images/vehicles/ford-transit-f.jpg',
    ],
  },
  {
    id: 'v-mszu795f21be',
    slug: 'kerra-med-sturtu',
    category: 'trailers',
    featured: false,
    name: {
      en: 'Tipping Trailer',
      is: 'Kerra með sturtu',
    },
    tagline: {
      en: 'A trailer for rent: Bilxtra Tractus Multi with tipping function, gates front and rear, cover included.',
      is: 'Kerra til leigu: Bilxtra Tractus Multi með sturtu, opnanlegum hlerum að framan og aftan, segl fylgir.',
    },
    description: {
      en: 'A Bilxtra Tractus Multi trailer, safe and exceptionally smooth to tow. The gates drop down both front and rear, recessed tie-down points keep loads secured, and the tipping function makes unloading gravel, soil or garden waste easy. Side extensions with a cover can be added, and a tarpaulin and jockey wheel are included.\n\nIt suits film-unit runs and private renters alike: building materials, garden work, furniture moves or a trip to the recycling centre.\n\nGross vehicle weight rating: 750 kg\nCurb weight: 220 kg\nInternal dimensions: 300 x 150 x 35 cm\nExternal dimensions: 435 x 195 cm\nTire size: 155/70 R13',
      is: 'Bilxtra Tractus Multi kerra, örugg og einstaklega góð í drætti. Hlerarnir opnast bæði að framan og aftan, innfelld augu halda festingum á sínum stað og sturtumöguleikinn léttir affermingu á möl, mold eða garðaúrgangi. Hægt er að bæta við hækkun á hliðum ásamt ábreiðu, og segl og nefhjól fylgja.\n\nKerran hentar jafnt tökuliðum sem einstaklingum: efniskaup, garðvinna, húsgagnaflutningar eða ferð á endurvinnslustöðina.\n\nLeyfð heildarþyngd: 750 kg\nEiginþyngd: 220 kg\nInnanmál: 300 x 150 x 35 cm\nYtra mál: 435 x 195 cm\nDekkjastærð: 155/70 R13',
    },
    highlights: [
      {
        en: 'Tipping function for easy unloading',
        is: 'Sturta til að létta affermingu',
      },
      {
        en: 'Gates open both front and rear',
        is: 'Hlerar opnast bæði að framan og aftan',
      },
      {
        en: 'Tarpaulin and jockey wheel included',
        is: 'Segl og nefhjól fylgja',
      },
      {
        en: '750 kg GVWR, only 220 kg curb weight',
        is: '750 kg heildarþyngd, aðeins 220 kg eiginþyngd',
      },
    ],
    specs: {},
    images: [
      '/uploads/mszu6h3t-f9b316fa.png',
      '/uploads/mszu6hen-787aa4df.png',
      '/uploads/mszu6hts-1a106562.png',
      '/uploads/mszu6jcc-57f656cb.png',
      '/uploads/mszu6jqs-dbc8329d.png',
    ],
  },
]
