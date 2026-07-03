export type LocaleCode = 'en' | 'is'

/** Per-locale text — English is the required source, Icelandic falls back to it. */
export type LocalizedText = Record<LocaleCode, string>

export type VehicleCategory = 'campers' | 'crew-trucks' | 'support-vehicles' | 'trailers'

export interface VehicleSpecs {
  seats?: number
  sleeps?: number
  lengthM?: number
  heightM?: number
  drivetrain?: '4x4' | '2wd' | '6x6'
  transmission?: 'automatic' | 'manual'
  fuel?: 'diesel' | 'petrol' | 'hybrid'
  /** e.g. "230V / 3 kW generator" */
  powerOutput?: string
  generator?: boolean
  /** Diesel heater / standing heat — usable as a warm base on location */
  heating?: boolean
  /** Blackout curtains — talent rest between takes, night-shoot ready */
  blackoutReady?: boolean
  /** Studded winter tires, engine heater */
  winterEquipped?: boolean
  towHitch?: boolean
  wifi?: boolean
  /** Free-form per-locale note rendered at the bottom of the spec table */
  extra?: LocalizedText
}

export interface Vehicle {
  /** Stable internal key, e.g. 'v-001' */
  id: string
  /** URL segment — never localized */
  slug: string
  category: VehicleCategory
  name: LocalizedText
  /** One-liner shown on cards and as the detail-page subhead */
  tagline: LocalizedText
  /** 2–3 paragraphs separated by \n\n */
  description: LocalizedText
  /** 3–5 film-relevant bullets */
  highlights: LocalizedText[]
  specs: VehicleSpecs
  /** First image is the card/OG image */
  images: string[]
  /** Featured vehicles appear on the home page */
  featured: boolean
}

export interface ContactPayload {
  name: string
  email: string
  phone?: string
  company?: string
  dates?: string
  vehicle?: string
  message: string
  /** Honeypot — must come back empty */
  website?: string
}
