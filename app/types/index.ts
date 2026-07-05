export type LocaleCode = 'en' | 'is'

/** Per-locale text — English is the required source, Icelandic falls back to it. */
export type LocalizedText = Record<LocaleCode, string>

export type VehicleCategory = 'campers' | 'equipment-cars' | 'support-vehicles' | 'trailers'

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

export type EquipmentCategory = 'heating' | 'shelter' | 'safety' | 'furniture' | 'power' | 'cleaning'

export interface EquipmentItem {
  /** Stable internal key, e.g. 'e-001' */
  id: string
  category: EquipmentCategory
  name: LocalizedText
  /** One-liner shown under the name on the card */
  tagline: LocalizedText
  /** First image is the card image */
  images: string[]
}

// ── Cart, quote requests & offers ────────────────────────────────────────────

export type CartItemType = 'vehicle' | 'equipment'

/** A line in the visitor's cart — resolved against the catalogue on submit. */
export interface CartEntry {
  type: CartItemType
  id: string
  qty: number
}

export type QuoteStatus = 'new' | 'offered' | 'won' | 'lost'

/** Catalogue snapshot taken when the quote was submitted (survives deletions). */
export interface QuoteItem {
  id: number
  itemType: CartItemType
  itemId: string
  slug?: string
  name: LocalizedText
  image?: string
  qty: number
}

export interface Quote {
  id: string
  createdAt: string
  status: QuoteStatus
  locale: LocaleCode
  name: string
  email: string
  phone?: string
  company?: string
  dates?: string
  message?: string
}

export interface QuoteSummary extends Quote {
  itemCount: number
  lastOfferAt?: string
  lastOfferTotal?: number
  lastOfferCurrency?: string
}

export type OfferCurrency = 'ISK' | 'EUR'
export type DiscountType = 'percent' | 'fixed'

/** A priced line inside an offer — frozen at send time so PDFs are regenerable. */
export interface OfferItem {
  quoteItemId: number
  name: LocalizedText
  image?: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export interface Offer {
  id: number
  quoteId: string
  createdAt: string
  sentAt?: string
  currency: OfferCurrency
  discountType?: DiscountType
  discountValue?: number
  note?: string
  validUntil?: string
  items: OfferItem[]
  subtotal: number
  discountAmount: number
  total: number
}

export interface QuoteDetail extends Quote {
  items: QuoteItem[]
  offers: Offer[]
}

/** Body of POST /api/quotes (public cart submission). */
export interface QuotePayload {
  name: string
  email: string
  phone?: string
  company?: string
  dates?: string
  message?: string
  locale: LocaleCode
  items: CartEntry[]
  /** Honeypot — must come back empty */
  website?: string
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
