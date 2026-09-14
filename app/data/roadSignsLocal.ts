// Hand-made signs that Wikimedia Commons does not carry — currently the
// Vegagerðin-style detour (hjáleið) plates. SVG files live in
// public/signs/is/ next to the generated set. Merged into ROAD_SIGNS by
// app/data/roadSigns.ts; keep that import when regenerating the catalogue.
import type { RoadSignDef } from './roadSigns'

export const LOCAL_SIGN_GROUP = 'Hjáleið'
export const LOCAL_SIGN_GROUP_CLOSURES = 'Lokanir'

export const LOCAL_ROAD_SIGNS: RoadSignDef[] = [
  // Vegagerðin-style detour arrows (white "Hjáleið" inside a black arrow).
  { id: 'hjaleid-h', group: LOCAL_SIGN_GROUP, w: 600, h: 360, placeSize: 96 },
  { id: 'hjaleid-v', group: LOCAL_SIGN_GROUP, w: 600, h: 360, placeSize: 96 },
  // Pedestrian/cyclist detour (pictograms above the arrow).
  { id: 'hjaleid-gangandi-h', group: LOCAL_SIGN_GROUP, w: 600, h: 560, placeSize: 96 },
  { id: 'hjaleid-gangandi-v', group: LOCAL_SIGN_GROUP, w: 600, h: 560, placeSize: 96 },
  { id: 'hjaleid', group: LOCAL_SIGN_GROUP, w: 420, h: 140, placeSize: 84 },
  { id: 'hjaleid-upp', group: LOCAL_SIGN_GROUP, w: 300, h: 200, placeSize: 64 },
  { id: 'hjaleid-or-h', group: LOCAL_SIGN_GROUP, w: 300, h: 150, placeSize: 72 },
  { id: 'hjaleid-or-v', group: LOCAL_SIGN_GROUP, w: 300, h: 150, placeSize: 72 },
  // Closure kit: walking-man plate, red/white closure plank, hazard boards.
  { id: 'lokun-kall', group: LOCAL_SIGN_GROUP_CLOSURES, w: 400, h: 400, placeSize: 48 },
  { id: 'lokunarlina', group: LOCAL_SIGN_GROUP_CLOSURES, w: 900, h: 120, placeSize: 140 },
  { id: 'gatskjoldur-h', group: LOCAL_SIGN_GROUP_CLOSURES, w: 240, h: 720, placeSize: 24 },
  { id: 'gatskjoldur-v', group: LOCAL_SIGN_GROUP_CLOSURES, w: 240, h: 720, placeSize: 24 },
]
