// Icelandic road-sign catalogue for the location-map tool. Generated from
// the official sign diagrams on Wikimedia Commons (Icelandic road signs are
// official material per the traffic-sign regulation and exempt from copyright,
// Icelandic Copyright Act art. 9). SVG files live in public/signs/is/<id>.svg.
// Regenerate with the fetch-signs script; do not edit by hand.
//
// NOTE: placeholder — the generator is still downloading; it overwrites this file.

export interface RoadSignDef {
  /** File id: public/signs/is/<id>.svg */
  id: string
  /** Icelandic sign group (picker section). */
  group: string
  /** Intrinsic SVG size, used for aspect-correct rendering. */
  w: number
  h: number
}

export const ROAD_SIGN_GROUPS = ['Viðvörunarmerki', 'Forgangsmerki', 'Bannmerki', 'Boðmerki', 'Sérreglumerki', 'Upplýsingamerki', 'Þjónustumerki', 'Vegvísar', 'Leiðanúmer', 'Akreinamerki', 'Undirmerki', 'Bráðabirgðamerki'] as const

export const ROAD_SIGNS: RoadSignDef[] = []

const byId = new Map(ROAD_SIGNS.map(s => [s.id, s]))
export const roadSignDef = (id: string): RoadSignDef | undefined => byId.get(id)
