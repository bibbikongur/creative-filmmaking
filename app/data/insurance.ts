import type { InsuranceTier } from '~/types'

/**
 * Excess (deductible) the renter pays per incident under each insurance tier.
 * Printed next to the insurance line on offers and shown in the offer form.
 * A tier set to null has no excess on record yet and prints nothing.
 */
export const INSURANCE_EXCESS: Record<InsuranceTier, { isk: number, eur: number } | null> = {
  bronze: null,
  silver: null,
  gold: { isk: 65_000, eur: 480 },
}
