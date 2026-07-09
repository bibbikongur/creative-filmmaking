export type LocaleCode = 'en' | 'is'

/** Per-locale text — English is the required source, Icelandic falls back to it. */
export type LocalizedText = Record<LocaleCode, string>

export type VehicleCategory = 'campers' | 'equipment-cars' | 'support-vehicles' | 'trailers'

export interface VehicleSpecs {
  /** Identical units in the fleet — shown when more than one can be booked at once */
  units?: number
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

// ── Timesheet portal ─────────────────────────────────────────────────────────

export type PortalUserStatus = 'invited' | 'active' | 'disabled'
export type CompanyStatus = 'active' | 'disabled'
export type JobStatus = 'active' | 'closed'
export type JobMemberStatus = 'active' | 'removed'
export type WeekStatus = 'draft' | 'submitted' | 'dept_approved' | 'altered' | 'approved'
export type WeekEventType = 'submitted' | 'altered' | 'confirmed' | 'approved' | 'reopened'

/** Portal account as exposed to the client — never carries credentials. */
export interface PortalUserPublic {
  id: string
  email: string
  name?: string
  status: PortalUserStatus
  locale: LocaleCode
}

/** What the signed-in user can do — drives the portal nav and job picker. */
export interface PortalMemberships {
  adminCompanies: { id: string, name: string }[]
  jobs: { jobId: string, jobName: string, companyName: string, status: JobStatus }[]
  deptAdmin: { jobId: string, jobName: string, departmentId: string, departmentName: string }[]
}

export interface Department {
  id: string
  jobId: string
  name: string
  memberCount: number
}

export interface CompanySummary {
  id: string
  createdAt: string
  name: string
  status: CompanyStatus
  adminEmail?: string
  adminStatus?: PortalUserStatus
  jobCount: number
  employeeCount: number
}

export interface Job {
  id: string
  companyId: string
  createdAt: string
  name: string
  status: JobStatus
}

export interface JobMember {
  userId: string
  email: string
  name?: string
  userStatus: PortalUserStatus
  memberStatus: JobMemberStatus
  locale: LocaleCode
  dayRate: number
  departmentId?: string
  departmentName?: string
  isDeptAdmin: boolean
}

export interface TimeEntry {
  id: number
  date: string
  /** Minutes from midnight of `date`; endMin > 1440 = shift crosses midnight. */
  startMin: number
  endMin: number
  note?: string
}

export interface TimesheetWeek {
  id: number
  jobId: string
  userId: string
  weekStart: string
  status: WeekStatus
  submittedAt?: string
  deptApprovedAt?: string
  approvedAt?: string
  /** Where a confirm lands while status is 'altered'. */
  alteredTarget?: 'dept_approved' | 'approved'
}

/** What the signed-in reviewer may do to a given week — drives the review UI. */
export interface WeekReviewCapabilities {
  canDeptApprove: boolean
  canJobApprove: boolean
  canAlter: boolean
  canReopen: boolean
}

export interface WeekEvent {
  id: number
  createdAt: string
  actorUserId: string
  actorName?: string
  type: WeekEventType
  detail?: {
    note?: string
    /** On 'approved' events: which sign-off — department or final job admin. */
    stage?: 'dept' | 'job'
    changes?: {
      date: string
      before: { startMin: number, endMin: number } | null
      after: { startMin: number, endMin: number } | null
    }[]
  }
}

export interface DayBreakdown {
  date: string
  hours: number
  otHours: number
  restViolationHours: number
  streakIndex: number
  doublePay: boolean
  baseAmount: number
  otAmount: number
  restViolationAmount: number
  total: number
}

export interface WeekPayroll {
  days: DayBreakdown[]
  totals: {
    daysWorked: number
    hours: number
    otHours: number
    restViolationHours: number
    doubleDays: number
    amount: number
  }
  dayRate: number
  hourlyOtRate: number
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
