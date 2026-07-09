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
      en: 'Hobby 560 WFU Prestige Caravan',
      is: 'Hobby 560 WFU Prestige hjólhýsi',
    },
    tagline: {
      en: 'Four identical 2026 caravans — warm cast & crew accommodation, one unit or a whole basecamp village.',
      is: 'Fjögur eins hjólhýsi árgerð 2026 — hlý gisting fyrir leikara og tökulið, eitt stakt eða heilar grunnbúðir.',
    },
    description: {
      en: 'Brand-new Hobby 560 WFU Prestige caravans, model year 2026 — and we have four of them, so the same booking scales from a single unit for a director to a four-caravan basecamp sleeping up to sixteen. Each sleeps four in a fixed double bed plus a convertible lounge, with a full kitchen, a washroom with hot shower and thermostat heating that holds a comfortable temperature through Icelandic nights.\n\nWe tow them to location behind our own 4x4s, level them and hook them up to shore power or a generator feed, so they are warm and ready before the unit arrives. Between takes they double as green rooms, production offices or a quiet place for an early call to actually sleep.',
      is: 'Glæný Hobby 560 WFU Prestige hjólhýsi, árgerð 2026 — og við eigum fjögur, þannig að sama bókunin skalast frá einu hýsi fyrir leikstjóra upp í fjögurra hýsa grunnbúðir með svefnplássi fyrir allt að sextán. Hvert um sig svæfir fjóra í föstu hjónarúmi auk sætakróks sem breytist í rúm, með fullbúnu eldhúsi, baðherbergi með heitri sturtu og hitastýringu sem heldur notalegum hita í gegnum íslenskar nætur.\n\nVið drögum þau á tökustað með okkar eigin fjórhjóladrifsbílum, stillum þau af og tengjum við landrafmagn eða rafstöð, svo þau eru orðin hlý áður en tökuliðið mætir. Milli taka nýtast þau sem biðrými leikara, framleiðsluskrifstofur eða hljóðlátur staður til að ná alvöru svefni fyrir snemmkall.',
    },
    highlights: [
      { en: 'Four identical units — book one or the whole set, sleeps up to 16 in total', is: 'Fjögur eins hjólhýsi — leigðu eitt eða öll fjögur, svefnpláss fyrir allt að 16 alls' },
      { en: 'Sleeps 4 per caravan: fixed double bed + convertible lounge', is: 'Svefnpláss fyrir 4 í hverju hýsi: fast hjónarúm + sætakrókur sem breytist í rúm' },
      { en: 'Full kitchen, fridge and washroom with hot shower', is: 'Fullbúið eldhús, ísskápur og baðherbergi með heitri sturtu' },
      { en: 'Thermostat heating and insulation rated for Icelandic weather', is: 'Hitastýring og einangrun sem ræður við íslenskt veður' },
      { en: 'Delivered, levelled and hooked up on location by our drivers', is: 'Afhent, stillt af og tengt á tökustað af okkar bílstjórum' },
    ],
    specs: {
      units: 4,
      sleeps: 4,
      lengthM: 7.5,
      powerOutput: 'Shore power / generator feed',
      heating: true,
      winterEquipped: true,
      extra: {
        en: 'Model year 2026 · width 2.50 m · max weight 2,000 kg per unit',
        is: 'Árgerð 2026 · breidd 2,50 m · heildarþyngd 2.000 kg á hýsi',
      },
    },
    images: [
      img('photo-1516939884455-1445c8652f83'),
      img('photo-1504280390367-361c6d9f38f4'),
      img('photo-1478720568477-152d9b164e26'),
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
