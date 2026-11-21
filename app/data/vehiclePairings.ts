import type { VehicleKind } from '~/types'

/**
 * "Pairs well with" on a vehicle page: the equipment that actually goes out
 * with that type of vehicle (straps and a tarp with a box truck, a helmet with
 * the six-wheeler), by equipment item id, in the order shown.
 *
 * Ids that no longer exist are skipped, and a vehicle whose list comes up
 * short is topped up with the items ticked "featured" in the admin panel, so
 * the section is never empty and never has to be kept in sync by hand.
 */
export const VEHICLE_PAIRINGS: Record<VehicleKind, readonly string[]> = {
  // ratchet strap, lashing strap, tarp
  'box-truck': ['e-024', 'e-023', 'e-017'],
  // lashing strap, 12 V jump starter, 50 cm traffic cones
  'cargo-van': ['e-023', 'e-020', 'e-mrl0eqb86480'],
  // makeup mirror, EcoFlow Delta 3 Pro power station, folding clothes rail
  'caravan': ['e-028', 'e-mrzl0c5k7565', 'e-muuayhik0574'],
  // ratchet strap, lashing strap, tarp
  'trailer': ['e-024', 'e-023', 'e-017'],
  // helmet, tow rope, fuel can
  'atv': ['e-mrw8w5pqb2c8', 'e-016', 'e-019'],
  // tow rope, ratchet strap, 12 V jump starter
  'pickup': ['e-016', 'e-024', 'e-020'],
}
