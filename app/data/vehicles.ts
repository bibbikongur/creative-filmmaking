import type { Vehicle } from '~/types'

// ─────────────────────────────────────────────────────────────────────────────
// THE FLEET — this is the only file to edit when adding/changing vehicles.
//
// Every text field has English + Icelandic side by side. Images are Unsplash
// placeholders; to use real photos, drop files in /public/images and change
// the URLs to '/images/your-photo.jpg'. `featured: true` puts a vehicle on
// the home page. The slug is the URL — keep it lowercase-with-dashes and
// don't change it after the site is live (it would break shared links).
// ─────────────────────────────────────────────────────────────────────────────

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`

export const vehicles: Vehicle[] = [
  {
    id: 'v-001',
    slug: 'arctic-base-4x4-camper',
    category: 'campers',
    featured: true,
    name: {
      en: 'Arctic Base 4x4 Camper',
      is: 'Arctic Base 4x4 húsbíll',
    },
    tagline: {
      en: 'A warm, self-sufficient base camp that follows the shoot anywhere.',
      is: 'Hlýjar, sjálfbærar grunnbúðir sem fylgja tökunum hvert sem er.',
    },
    description: {
      en: 'A 4x4 Sprinter-class camper built to be the production\'s warm heart on location. Diesel standing heat keeps it comfortable through highland nights, and the onboard power system runs monitors, chargers and coffee without idling the engine.\n\nThe rear converts from a production-office table for four into two full-length berths, so it works equally well as a mobile office, a talent rest area or overnight accommodation for a small unit.',
      is: 'Fjórhjóladrifinn húsbíll af Sprinter-gerð, hannaður til að vera hlýi kjarninn á tökustað. Dísilmiðstöð heldur honum notalegum í gegnum hálendisnætur og rafkerfið keyrir skjái, hleðslutæki og kaffivél án þess að láta vélina ganga.\n\nAfturrýmið breytist úr vinnuborði fyrir fjóra í tvö svefnpláss í fullri lengd, þannig að hann nýtist jafnt sem færanleg skrifstofa, hvíldarrými fyrir leikara eða gisting fyrir lítinn hóp.',
    },
    highlights: [
      { en: 'True 4x4 with raised suspension for highland tracks and river crossings', is: 'Alvöru fjórhjóladrif með hækkaðri fjöðrun fyrir hálendisslóða og vöð' },
      { en: 'Diesel standing heat rated for winter shoots', is: 'Dísilmiðstöð sem ræður við vetrartökur' },
      { en: '230V power for monitors, chargers and small appliances', is: '230V rafmagn fyrir skjái, hleðslutæki og smátæki' },
      { en: 'Converts between production office and two berths', is: 'Breytist úr skrifstofu í tvö svefnpláss' },
    ],
    specs: {
      seats: 4,
      sleeps: 2,
      lengthM: 6.9,
      heightM: 2.9,
      drivetrain: '4x4',
      transmission: 'automatic',
      fuel: 'diesel',
      powerOutput: '230V / 2 kW inverter + shore power',
      heating: true,
      winterEquipped: true,
      towHitch: true,
      wifi: true,
    },
    images: [
      img('photo-1523987355523-c7b5b0dd90a7'),
      img('photo-1532339142463-fd0a8979791a'),
      img('photo-1504280390367-361c6d9f38f4'),
      img('photo-1519681393784-d120267933ba'),
    ],
  },
  {
    id: 'v-002',
    slug: 'highland-crew-camper',
    category: 'campers',
    featured: false,
    name: {
      en: 'Highland Crew Camper',
      is: 'Hálendis-tökuliðshúsbíll',
    },
    tagline: {
      en: 'Sleeps four and keeps a small unit on location overnight.',
      is: 'Svefnpláss fyrir fjóra og heldur litlu tökuliði á staðnum yfir nótt.',
    },
    description: {
      en: 'When the location is three hours from the nearest hotel, this camper keeps a small crew shooting instead of commuting. Four proper berths, a galley kitchen and a wet room mean early calls happen where the camera is.\n\nIt tows well, carries a generous gear load and its diesel heater runs all night on a fraction of a tank.',
      is: 'Þegar tökustaðurinn er í þriggja tíma fjarlægð frá næsta hóteli heldur þessi húsbíll litlu tökuliði við tökur í stað þess að keyra fram og til baka. Fjögur alvöru svefnpláss, eldhúskrókur og votrými þýða að morgunköllin gerast þar sem myndavélin er.\n\nHann dregur vel, ber drjúgan búnað og dísilmiðstöðin gengur alla nóttina á broti af tanki.',
    },
    highlights: [
      { en: 'Four full-length berths + galley kitchen', is: 'Fjögur svefnpláss í fullri lengd + eldhúskrókur' },
      { en: 'Wet room with hot shower', is: 'Votrými með heitri sturtu' },
      { en: 'All-night diesel heating', is: 'Dísilmiðstöð sem gengur alla nóttina' },
      { en: 'Tow hitch for equipment trailers', is: 'Dráttarkrókur fyrir búnaðarvagna' },
    ],
    specs: {
      seats: 4,
      sleeps: 4,
      lengthM: 7.4,
      heightM: 3.1,
      drivetrain: '2wd',
      transmission: 'manual',
      fuel: 'diesel',
      heating: true,
      winterEquipped: true,
      towHitch: true,
    },
    images: [
      img('photo-1527018601619-a508a2be00cd'),
      img('photo-1471479917193-f00955256257'),
      img('photo-1506905925346-21bda4d32df4'),
    ],
  },
  {
    id: 'v-003',
    slug: 'production-crew-truck',
    category: 'equipment-cars',
    featured: true,
    name: {
      en: 'Production Crew Truck',
      is: 'Framleiðslutrukkur',
    },
    tagline: {
      en: 'A box truck with tail lift: grip, lighting and camera in one move.',
      is: 'Kassabíll með lyftu: grip, ljós og myndavélar í einni ferð.',
    },
    description: {
      en: 'The workhorse. A 3.5t box truck with a full-width tail lift, interior tie-down rails and shelving configured for grip and lighting packages. E-track walls take carts, stands and pelis without improvising.\n\nDrivable on a standard car licence, so any crew member can move it between company moves.',
      is: 'Vinnuhesturinn. 3,5 tonna kassabíll með lyftu í fullri breidd, festingarbrautum og hillum sem eru stilltar fyrir grip- og ljósapakka. E-track veggir taka vagna, statíf og pelicase-töskur án þess að þurfa að redda neinu.\n\nMá keyra á venjulegum bílprófum þannig að hver sem er í tökuliðinu getur fært hann á milli tökustaða.',
    },
    highlights: [
      { en: 'Full-width tail lift (750 kg)', is: 'Lyfta í fullri breidd (750 kg)' },
      { en: 'E-track walls + tie-down rails for carts and stands', is: 'E-track veggir + festingarbrautir fyrir vagna og statíf' },
      { en: 'Interior lighting and 230V sockets in the box', is: 'Lýsing og 230V tenglar í kassanum' },
      { en: 'Drives on a standard car licence', is: 'Ekið á venjulegum bílprófum' },
    ],
    specs: {
      seats: 3,
      lengthM: 7.2,
      heightM: 3.4,
      drivetrain: '2wd',
      transmission: 'automatic',
      fuel: 'diesel',
      powerOutput: '230V sockets in cargo box',
      winterEquipped: true,
      towHitch: true,
    },
    images: [
      img('photo-1601584115197-04ecc0da31d7'),
      img('photo-1486262715619-67b85e0b08d3'),
      img('photo-1512428559087-560fa5ceab42'),
    ],
  },
  {
    id: 'v-004',
    slug: 'crew-shuttle-minibus',
    category: 'equipment-cars',
    featured: false,
    name: {
      en: 'Crew Shuttle Minibus',
      is: 'Tökuliðsrúta',
    },
    tagline: {
      en: '17 seats, moves the whole unit between basecamp and set.',
      is: '17 sæti, flytur allt tökuliðið milli grunnbúða og setts.',
    },
    description: {
      en: 'A 17-seat minibus for unit moves, airport pickups and daily crew shuttles. Big luggage bay for kit bags, USB power at every row and a PA mic up front for location managers who like a captive audience.\n\nWinter tires and a pre-heater come standard, so the 06:00 pickup is warm before anyone boards.',
      is: '17 sæta rúta fyrir hópflutninga, flugvallarsóttir og daglegan akstur tökuliðs. Stórt farangursrými fyrir töskur, USB-hleðsla í hverri sætaröð og hljóðkerfi frammí fyrir staðarstjóra sem kunna að meta fanginn áheyrendahóp.\n\nVetrardekk og forhitari fylgja, svo bíllinn er orðinn hlýr fyrir sóttina klukkan 06:00.',
    },
    highlights: [
      { en: '17 comfortable seats + large luggage bay', is: '17 þægileg sæti + stórt farangursrými' },
      { en: 'USB power at every row', is: 'USB-hleðsla í hverri sætaröð' },
      { en: 'Engine pre-heater, warm at early calls', is: 'Forhitari, hlýr fyrir snemmköll' },
      { en: 'Experienced local drivers available on request', is: 'Reyndir bílstjórar í boði sé þess óskað' },
    ],
    specs: {
      seats: 17,
      lengthM: 7.7,
      heightM: 2.8,
      drivetrain: '2wd',
      transmission: 'automatic',
      fuel: 'diesel',
      heating: true,
      winterEquipped: true,
      wifi: true,
    },
    images: [
      img('photo-1544620347-c4fd4a3d5957'),
      img('photo-1524985069026-dd778a71c7b4'),
      img('photo-1441974231531-c6227db76b6e'),
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
      is: 'Sendibíll með hillum og toppgrind fyrir búnaðarferðir og daglega flutninga.',
    },
    description: {
      en: 'The everyday workhorse for gear runs, pickups and deliveries between warehouse, basecamp and set. A full-height bulkhead separates the cab from the cargo bay, where a plywood shelving unit keeps cases, consumables and smalls organized instead of sliding around loose. Interior lighting and a rubber-matted floor make dark load-ins easier on people and equipment.\n\nUp top, a full-length roof rack with a rear access ladder carries ladders, poles and lengths of timber. A side sliding door gives kerbside access, and the tow hitch adds one of our trailers when a run outgrows the cargo bay.',
      is: 'Hversdagsvinnuhesturinn í búnaðarferðir, sóttir og sendingar milli lagers, grunnbúða og tökustaðar. Heilt skilrúm skilur ökumannshúsið frá flutningsrýminu, þar sem krossviðarhillur halda töskum, rekstrarvörum og smáhlutum skipulögðum í stað þess að renna til lausar. Innilýsing og gúmmímotta á gólfi gera dimmar hleðslur þægilegri fyrir fólk og búnað.\n\nUppi á þaki tekur toppgrind í fullri lengd með stiga að aftan stiga, rör og timbur. Rennihurð á hlið gefur aðgengi frá gangstétt og dráttarkrókurinn bætir einum af vögnunum okkar við þegar ferðin sprengir flutningsrýmið.',
    },
    highlights: [
      { en: 'Plywood shelving unit keeps cases and smalls organized', is: 'Krossviðarhillur halda töskum og smáhlutum skipulögðum' },
      { en: 'Full-length roof rack with rear access ladder', is: 'Toppgrind í fullri lengd með stiga að aftan' },
      { en: 'Full-height bulkhead between cab and cargo bay', is: 'Heilt skilrúm milli ökumannshúss og flutningsrýmis' },
      { en: 'Interior cargo lighting and rubber-matted floor', is: 'Innilýsing í flutningsrými og gúmmímotta á gólfi' },
      { en: 'Tow hitch for our equipment trailers', is: 'Dráttarkrókur fyrir búnaðarvagnana okkar' },
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
    id: 'v-005',
    slug: 'land-cruiser-location-scout',
    category: 'support-vehicles',
    featured: true,
    name: {
      en: 'Land Cruiser Location Scout',
      is: 'Land Cruiser leitarbíll',
    },
    tagline: {
      en: 'Goes where the recce goes: 33" tires, snorkel, full recovery kit.',
      is: 'Kemst þangað sem leitin fer: 33" dekk, snorkel og full björgunartaska.',
    },
    description: {
      en: 'A properly built Land Cruiser for location scouting, tech recces and producer transport into the rough parts of the map. 33-inch tires, raised suspension and a snorkel handle glacial rivers and washboard F-roads.\n\nInside it stays civilised: heated leather seats, dual-zone climate and a 230V outlet for laptops between stops.',
      is: 'Almennilega uppfærður Land Cruiser fyrir tökustaðaleit, tæknilegar skoðunarferðir og flutning framleiðenda inn á grófari hluta kortsins. 33 tommu dekk, hækkuð fjöðrun og snorkel ráða við jökulár og þvottabrettislega fjallvegi.\n\nAð innan er hann samt siðmenntaður: hituð leðursæti, tvískipt miðstöð og 230V tengill fyrir fartölvur á milli stoppa.',
    },
    highlights: [
      { en: '33" tires, raised suspension, snorkel', is: '33" dekk, hækkuð fjöðrun, snorkel' },
      { en: 'Full recovery kit + VHF radio', is: 'Full björgunartaska + VHF-talstöð' },
      { en: 'Heated seats and 230V laptop power', is: 'Sætishiti og 230V fyrir fartölvur' },
      { en: 'Certified for F-road and river-crossing driving', is: 'Löglegur á fjallvegi og yfir vöð' },
    ],
    specs: {
      seats: 5,
      lengthM: 5.0,
      drivetrain: '4x4',
      transmission: 'automatic',
      fuel: 'diesel',
      powerOutput: '230V outlet',
      heating: true,
      winterEquipped: true,
      towHitch: true,
    },
    images: [
      img('photo-1533473359331-0135ef1b58bf'),
      img('photo-1519641471654-76ce0107ad1b'),
      img('photo-1469474968028-56623f02e42e'),
      img('photo-1464822759023-fed622ff2c3b'),
    ],
  },
  {
    id: 'v-006',
    slug: 'camera-support-defender',
    category: 'support-vehicles',
    featured: false,
    name: {
      en: 'Camera Support Defender',
      is: 'Defender myndavélabíll',
    },
    tagline: {
      en: 'Tracking shots and camera moves on any terrain.',
      is: 'Eltiskot og myndavélahreyfingar á hvaða undirlagi sem er.',
    },
    description: {
      en: 'A Defender configured as a camera support vehicle: roof rails and bumper plates take standard hi-hat and suction mounts, and the load bay is padded for lens cases. The long-travel suspension keeps footage usable on gravel at speed.\n\nA popular pairing with the Location Scout: one carries the crew, the other carries the shot.',
      is: 'Defender útbúinn sem stuðningsbíll fyrir myndavélar: þakbogar og stuðaraplötur taka staðlaðar hi-hat og sogfestingar og skottið er bólstrað fyrir linsutöskur. Löng fjöðrun heldur efninu nothæfu á malarvegi á ferð.\n\nVinsæl samsetning með leitarbílnum: annar ber tökuliðið, hinn ber skotið.',
    },
    highlights: [
      { en: 'Roof rails + bumper plates for camera mounts', is: 'Þakbogar + stuðaraplötur fyrir myndavélafestingar' },
      { en: 'Padded load bay for lens and body cases', is: 'Bólstrað skott fyrir linsu- og vélatöskur' },
      { en: 'Long-travel suspension, stable at speed on gravel', is: 'Löng fjöðrun, stöðugur á ferð á möl' },
      { en: 'Tow hitch for camera trailers', is: 'Dráttarkrókur fyrir myndavélavagna' },
    ],
    specs: {
      seats: 4,
      lengthM: 4.8,
      drivetrain: '4x4',
      transmission: 'manual',
      fuel: 'diesel',
      winterEquipped: true,
      towHitch: true,
    },
    images: [
      img('photo-1494976388531-d1058494cdd8'),
      img('photo-1517524008697-84bbe3c3fd98'),
      img('photo-1478131143081-80f7f84ca84d'),
    ],
  },
  {
    id: 'v-011',
    slug: 'can-am-outlander-max-6x6-850',
    category: 'support-vehicles',
    featured: false,
    name: {
      en: 'Can-Am Outlander MAX 6x6 850',
      is: 'Can-Am Outlander MAX 6x6 850',
    },
    tagline: {
      en: 'A brand-new 2026 six-wheeler that hauls gear and crew beyond the end of the road.',
      is: 'Glænýtt sexhjól árgerð 2026 sem flytur búnað og tökulið út fyrir enda vegarins.',
    },
    description: {
      en: 'The massively upgraded 2026 Outlander MAX 6x6: an 82 hp Rotax 999 cc V-twin, a pDrive primary CVT with work calibration and extra-low gear, and selectable 4WD / 6WD with a Visco-Lok QE auto-locking front differential. Tri-Mode Dynamic Power Steering, selectable engine modes and Intelligent Engine Braking keep it composed hauling camera gear up a moraine or easing it back down a river bank.\n\nIt tows 830 kg, carries 454 kg on the rear cargo bed and swallows 275 litres in built-in storage, including a 30-litre front compartment, riding on 28" XPS Trail King tires on 14" aluminum wheels with 30.5 cm of ground clearance. Road-registered (T3, 65 km/h), so it legally links basecamp and set on public roads, and the removable passenger seat carries a spotter or comes off for more cargo.',
      is: 'Gríðarlega uppfærður 2026 Outlander MAX 6x6: 82 hestafla Rotax 999cc V2-mótor, pDrive kúpling með vinnustillingu og auka lágum gír, og veljanlegt fjór- eða sexhjóladrif með Visco-Lok QE sjálflæsandi framdrifslæsingu. Þrístillanlegt rafmagnsstýri, akstursstillingar og stillanleg mótorbremsa halda honum öruggum með myndavélabúnað upp skriðu eða rólega niður árbakka.\n\nHann dregur 830 kg, ber 454 kg á palli að aftan og rúmar 275 lítra í innbyggðum geymslum, þar af 30 lítra farangurshólf að framan, á 28" XPS Trail King dekkjum á 14" álfelgum með 30,5 cm veghæð. Götuskráður (T3, 65 km/h) svo hann tengir grunnbúðir og sett löglega um þjóðveg, og lausa farþegasætið tekur aðstoðarmann eða fer af fyrir meiri farm.',
    },
    highlights: [
      { en: '82 hp Rotax 999 cc V-twin with selectable 4WD / 6WD and Visco-Lok QE auto-locking front differential', is: '82 hestafla Rotax 999cc V2-mótor með veljanlegu fjór-/sexhjóladrifi og Visco-Lok QE sjálflæsandi framdrifi' },
      { en: '830 kg towing capacity and 454 kg cargo-bed capacity', is: '830 kg dráttargeta og 454 kg burðargeta á palli' },
      { en: '28" XPS Trail King tires on 14" aluminum wheels, 30.5 cm ground clearance', is: '28" XPS Trail King dekk á 14" álfelgum, 30,5 cm veghæð' },
      { en: 'Tri-Mode Dynamic Power Steering, engine modes and Intelligent Engine Braking (iEB)', is: 'Þrístillanlegt rafmagnsstýri, akstursstillingar og stillanleg mótorbremsa (iEB)' },
      { en: 'Road-registered (T3, 65 km/h) with LED lighting, mirrors and a removable passenger seat', is: 'Götuskráður (T3, 65 km/h) með LED-lýsingu, speglum og lausu farþegasæti' },
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
    id: 'v-012',
    slug: 'chevrolet-silverado-ltz',
    category: 'support-vehicles',
    featured: false,
    name: {
      en: 'Chevrolet Silverado LTZ Crew Cab',
      is: 'Chevrolet Silverado LTZ pallbíll',
    },
    tagline: {
      en: 'A lifted V8 crew-cab pickup that tows the trailers and hauls the gear.',
      is: 'Hækkaður V8 pallbíll með tvöföldu húsi sem dregur vagnana og flytur búnaðinn.',
    },
    description: {
      en: 'The fleet\'s tow rig: a lifted Silverado LTZ crew cab on all-terrain tires, with a Rough Country front bumper and LED light bars for the dark half of the Icelandic year. The V8 and tow hitch pull our caravans, talent trailers and equipment trailers without drama, and the flat lockable tonneau cover keeps cases dry and out of sight in the bed.\n\nInside it is all LTZ: leather seating for five, dual-zone climate and a quiet, comfortable ride between basecamp and set. Thule roof bars take ladders, boards and light grip up top.',
      is: 'Dráttarbíll flotans: hækkaður Silverado LTZ með tvöföldu húsi á grófum jeppadekkjum, með Rough Country framstuðara og LED ljósabörum fyrir dimmari helming ársins. V8 vélin og dráttarkrókurinn draga hjólhýsin, leikaravagnana og búnaðarvagnana okkar án vandræða og læsanleg pallhlífin heldur töskum þurrum og úr augsýn á pallinum.\n\nAð innan er hann alvöru LTZ: leðursæti fyrir fimm, tvískipt miðstöð og hljóðlátur, þægilegur akstur milli grunnbúða og tökustaðar. Thule þakbogar taka stiga, planka og léttan gripbúnað upp á þak.',
    },
    highlights: [
      { en: 'Lifted 4x4 on all-terrain tires for gravel and rough location roads', is: 'Hækkaður fjórhjóladrifinn á grófum dekkjum fyrir malarvegi og erfiða tökustaði' },
      { en: 'V8 tow rig for our caravans, talent trailers and equipment trailers', is: 'V8 dráttarbíll fyrir hjólhýsin, leikaravagnana og búnaðarvagnana okkar' },
      { en: 'Lockable, weatherproof bed under a flat tonneau cover', is: 'Læsanlegur, veðurþéttur pallur undir sléttri pallhlíf' },
      { en: 'LED light bars for dark loading areas and winter shoots', is: 'LED ljósabarir fyrir dimm athafnasvæði og vetrartökur' },
      { en: 'Leather LTZ cab seats five in comfort', is: 'LTZ leðurinnrétting með sæti fyrir fimm' },
    ],
    specs: {
      seats: 5,
      lengthM: 5.8,
      drivetrain: '4x4',
      transmission: 'automatic',
      fuel: 'petrol',
      winterEquipped: true,
      towHitch: true,
      extra: {
        en: 'Rough Country front bumper with LED light bars · Thule roof bars · lockable tonneau cover',
        is: 'Rough Country framstuðari með LED ljósabörum · Thule þakbogar · læsanleg pallhlíf',
      },
    },
    images: [
      '/images/vehicles/chevrolet-silverado-ltz-a.jpg',
      '/images/vehicles/chevrolet-silverado-ltz-b.jpg',
      '/images/vehicles/chevrolet-silverado-ltz-c.jpg',
      '/images/vehicles/chevrolet-silverado-ltz-d.jpg',
      '/images/vehicles/chevrolet-silverado-ltz-e.jpg',
      '/images/vehicles/chevrolet-silverado-ltz-f.jpg',
    ],
  },
  {
    id: 'v-007',
    slug: 'talent-trailer',
    category: 'trailers',
    featured: true,
    name: {
      en: 'Talent Trailer',
      is: 'Leikaravagn',
    },
    tagline: {
      en: 'Blackout, heated and quiet, for proper rest between takes.',
      is: 'Myrkvaður, upphitaður og hljóðlátur, fyrir alvöru hvíld milli taka.',
    },
    description: {
      en: 'A dedicated talent trailer with full blackout, thermostat heating and a quiet ventilation system. Inside: a daybed, a make-up-friendly mirror station with daylight-balanced lighting, a kitchenette and a private WC.\n\nBlackout plus heating makes it just as useful as a night-shoot rest area or a dark review room for the DoP.',
      is: 'Sérhæfður leikaravagn með fullri myrkvun, hitastýringu og hljóðlátri loftræstingu. Að innan: hvíldarbekkur, spegilstöð með dagsbirtulýsingu sem hentar förðun, eldhúskrókur og einkasalerni.\n\nMyrkvun og hiti gera hann jafn nothæfan sem hvíldarrými á næturtökum eða dimmt skoðunarherbergi fyrir tökustjórann.',
    },
    highlights: [
      { en: 'Full blackout for night shoots and daytime rest', is: 'Full myrkvun fyrir næturtökur og hvíld að degi' },
      { en: 'Thermostat heating + quiet ventilation', is: 'Hitastýring + hljóðlát loftræsting' },
      { en: 'Mirror station with daylight-balanced lighting', is: 'Spegilstöð með dagsbirtujafnaðri lýsingu' },
      { en: 'Private WC and kitchenette', is: 'Einkasalerni og eldhúskrókur' },
    ],
    specs: {
      sleeps: 1,
      lengthM: 6.2,
      heightM: 2.6,
      powerOutput: 'Shore power / generator feed',
      heating: true,
      blackoutReady: true,
      winterEquipped: true,
      wifi: true,
    },
    images: [
      img('photo-1485846234645-a62644f84728'),
      img('photo-1478720568477-152d9b164e26'),
      img('photo-1516939884455-1445c8652f83'),
    ],
  },
  {
    id: 'v-008',
    slug: 'makeup-costume-trailer',
    category: 'trailers',
    featured: false,
    name: {
      en: 'Makeup & Costume Trailer',
      is: 'Förðunar- og búningavagn',
    },
    tagline: {
      en: 'Three stations, wardrobe rails and daylight mirrors on wheels.',
      is: 'Þrjár stöðvar, fataslár og dagsbirtuspeglar á hjólum.',
    },
    description: {
      en: 'A working trailer for the make-up and costume departments: three mirror stations with daylight-balanced bulbs, hot and cold water, and double wardrobe rails with a steamer point.\n\nHeated and insulated so powders behave and costumes stay dry, whatever the weather is doing outside the door.',
      is: 'Vinnuvagn fyrir förðunar- og búningadeildir: þrjár spegilstöðvar með dagsbirtujöfnuðum perum, heitt og kalt vatn og tvöfaldar fataslár með gufustraujárnstengli.\n\nUpphitaður og einangraður svo púður hagi sér rétt og búningar haldist þurrir, sama hvað veðrið gerir fyrir utan dyrnar.',
    },
    highlights: [
      { en: 'Three daylight-balanced mirror stations', is: 'Þrjár spegilstöðvar með dagsbirtulýsingu' },
      { en: 'Hot & cold running water', is: 'Heitt og kalt rennandi vatn' },
      { en: 'Double wardrobe rails + steamer point', is: 'Tvöfaldar fataslár + tengill fyrir gufustraujárn' },
      { en: 'Insulated and heated for Icelandic weather', is: 'Einangraður og upphitaður fyrir íslenskt veður' },
    ],
    specs: {
      lengthM: 7.0,
      heightM: 2.7,
      powerOutput: 'Shore power / generator feed',
      heating: true,
      winterEquipped: true,
    },
    images: [
      img('photo-1489824904134-891ab64532f1'),
      img('photo-1522199755839-a2bacb67c546'),
      img('photo-1508614589041-895b88991e3e'),
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
      en: 'Four identical 2026 caravans made for actors: runs on electricity and gas, private bathroom with shower.',
      is: 'Fjögur eins hjólhýsi árgerð 2026 fyrir leikara: gengur á rafmagni og gasi, sér baðherbergi með sturtu.',
    },
    description: {
      en: 'Brand-new Hobby Prestige 560 WFU caravans, model year 2026, based in Reykjavík. The perfect setup for actors: they run on both electricity and gas, so you can always keep them warm, and each one has its own bathroom with a beautiful shower. We have four identical units, so no actor ever gets a lesser trailer than another. This is a high-class caravan that suits any cast, and it always doubles as overnight accommodation if it comes to that.\n\nEvery caravan comes fully equipped: solar panel and battery, an adapter (CEE plug to Schuko socket) plus an extra 25 m CEE power cable, gas grill with grilling tools, camping chairs and an outdoor table. Inside there is heating (gas central heating and an electric fan heater), an oven and gas stove, pots and pans, cutlery, plates and bowls, glasses and cups, a fridge with freezer compartment, a coffee maker, a kettle, a toilet and shower, and towels.',
      is: 'Glæný Hobby Prestige 560 WFU hjólhýsi, árgerð 2026, staðsett í Reykjavík. Fullkomin aðstaða fyrir leikara: þau ganga bæði á rafmagni og gasi svo þú getir alltaf haldið þeim heitum, og hvert um sig er með sér baðherbergi með fallegri sturtu. Við erum með fjögur alveg eins stykki svo það verði aldrei mismunað leikurunum. Þetta er háklassa hýsi sem ætti að henta fyrir alla leikara, og það er einnig alltaf hægt að nota það sem gistingu ef út í það er farið.\n\nHverju hýsi fylgir fullur búnaður: sólarsella og rafgeymir, breytistykki (CEE tengi í Schuko innstungu) ásamt auka 25 m CEE rafmagnssnúru, gasgrill með grilláhöldum, tjaldstólar og útileguborð. Að innan er hitari (gasmiðstöð og hitablásari), ofn og gaseldavél, pottar og pönnur, hnífapör, diskar og skálar, glös og bollar, ísskápur með frystihólfi, kaffivél, hraðsuðuketill, klósett og sturta, og handklæði.',
    },
    highlights: [
      { en: 'Runs on both electricity and gas: gas central heating + electric fan heater keep it warm anywhere', is: 'Gengur bæði á rafmagni og gasi: gasmiðstöð + hitablásari halda hita hvar sem er' },
      { en: 'Private bathroom with toilet and a beautiful hot shower', is: 'Sér baðherbergi með klósetti og fallegri heitri sturtu' },
      { en: 'Four identical units, so no actor is ever treated differently', is: 'Fjögur alveg eins stykki svo það verði aldrei mismunað leikurunum' },
      { en: 'Solar panel and battery, plus 25 m CEE cable and Schuko adapter', is: 'Sólarsella og rafgeymir, ásamt 25 m CEE snúru og Schuko breytistykki' },
      { en: 'Full kitchen (oven, gas stove, fridge with freezer, coffee maker) and gas grill with camping furniture', is: 'Fullbúið eldhús (ofn, gaseldavél, ísskápur með frysti, kaffivél) og gasgrill með útilegusetti' },
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
    // Placeholder until the real interior photos are uploaded via the admin panel.
    images: [
      img('photo-1516939884455-1445c8652f83'),
    ],
  },
  {
    id: 'v-009',
    slug: 'generator-equipment-trailer',
    category: 'trailers',
    featured: false,
    name: {
      en: 'Generator & Equipment Trailer',
      is: 'Rafstöðvar- og búnaðarvagn',
    },
    tagline: {
      en: 'Silent 20 kVA power plus dry, lockable gear storage.',
      is: 'Hljóðlát 20 kVA rafstöð ásamt þurri, læsanlegri búnaðargeymslu.',
    },
    description: {
      en: 'Location power without the drone: a sound-attenuated 20 kVA diesel generator in its own compartment, with distribution to standard 63A/32A/16A outlets. The rest of the trailer is dry, lockable storage with tie-down points for gear that has to stay on location overnight.\n\nTows behind any of our 4x4s, so one hook-up brings power and storage to basecamps beyond the grid.',
      is: 'Rafmagn á tökustað án suðsins: hljóðdempuð 20 kVA dísilrafstöð í sérhólfi með dreifingu í staðlaða 63A/32A/16A tengla. Restin af vagninum er þurr, læsanleg geymsla með festipunktum fyrir búnað sem þarf að vera á staðnum yfir nótt.\n\nHengist aftan í hvaða fjórhjóladrifsbíl sem er hjá okkur, svo ein tenging færir rafmagn og geymslu í grunnbúðir utan raforkukerfisins.',
    },
    highlights: [
      { en: 'Sound-attenuated 20 kVA diesel generator', is: 'Hljóðdempuð 20 kVA dísilrafstöð' },
      { en: '63A / 32A / 16A distribution', is: '63A / 32A / 16A dreifing' },
      { en: 'Dry, lockable equipment storage with tie-downs', is: 'Þurr, læsanleg búnaðargeymsla með festipunktum' },
      { en: 'Tows behind our 4x4 support vehicles', is: 'Hengist aftan í fjórhjóladrifsbílana okkar' },
    ],
    specs: {
      lengthM: 5.5,
      heightM: 2.4,
      powerOutput: '20 kVA, 63A/32A/16A outlets',
      generator: true,
      winterEquipped: true,
    },
    images: [
      img('photo-1502920514313-52581002a659'),
      img('photo-1516035069371-29a1b244cc32'),
      img('photo-1517940310602-26535839fe84'),
    ],
  },
]
