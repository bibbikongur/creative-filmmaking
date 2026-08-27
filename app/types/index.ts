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
  /** Vehicle weight (kg) */
  weightKg?: number
  /** Max braked towing capacity (kg) — only for vehicles that can tow */
  towingCapacityKg?: number
  /** Max cargo/payload it can carry in the back (kg) */
  payloadKg?: number
  /** Inner dimensions of the cargo box (m) — rendered as one L × W × H row */
  boxLengthM?: number
  boxWidthM?: number
  boxHeightM?: number
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
  /** Featured items appear on the home page (absent on rows saved before the flag existed) */
  featured?: boolean
}

// ── Cart, quote requests & offers ────────────────────────────────────────────

export type CartItemType = 'vehicle' | 'equipment'

/** A line in the visitor's cart — resolved against the catalogue on submit. */
export interface CartEntry {
  type: CartItemType
  id: string
  qty: number
}

/** Editable line in the admin quote builder/editor (name/image for display only). */
export interface QuoteDraftItem {
  type: CartItemType
  id: string
  qty: number
  name: string
  image?: string
}

export type QuoteStatus = 'new' | 'offered' | 'won' | 'lost'

/** 'web' = visitor cart submission; 'admin' = created from the admin panel. */
export type QuoteSource = 'web' | 'admin'

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
  source: QuoteSource
  locale: LocaleCode
  /** May be empty for admin-created quotes where only an email is known. */
  name: string
  email: string
  phone?: string
  company?: string
  /** Icelandic company/person registration number (kennitala). */
  kennitala?: string
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
/** 'flat' = one price per unit; 'day'/'week' = price per unit per rental day/week. */
export type PricingMode = 'flat' | 'day' | 'week'

/** A priced line inside an offer — frozen at send time so PDFs are regenerable. */
export interface OfferItem {
  quoteItemId: number
  name: LocalizedText
  image?: string
  qty: number
  unitPrice: number
  /** Absent on offers created before per-day pricing existed → 'flat'. */
  pricing?: PricingMode
  /** Number of days — only when pricing is 'day'. */
  days?: number
  /** Number of weeks — only when pricing is 'week'. */
  weeks?: number
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
  /** VAT percentage added on the net amount — 0 on offers made before VAT support. */
  vatRate: number
  vatAmount: number
  /** Grand total: subtotal − discount + VAT. */
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
  /** ISK paid per day the member ticks "per diem" on the timesheet; 0 = off. */
  perDiemRate: number
}

/**
 * Per-member purchase-order role. Absent = derived default: department admins
 * may log costs for their department, everyone else has no access.
 */
export type PoRole = 'none' | 'log' | 'log_all' | 'view' | 'approve'

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
  poRole?: PoRole
  /** Departments whose PO budgets this member may work in; absent = own department only. */
  poDepartments?: string[]
  /** Job title on this production (e.g. Gaffer), free text. */
  role?: string
  phone?: string
}

// ── Crew contracts / NDAs ────────────────────────────────────────────────────

export type DocKind = 'contract' | 'nda'
/** sent → delivered (link opened) → completed (signed) / declined. */
export type MemberDocStatus = 'sent' | 'delivered' | 'completed' | 'declined'

export type TemplateFieldType =
  | 'name' | 'role' | 'email' | 'phone' | 'dayRate' | 'date'
  | 'signature' | 'dateSigned'

/** A placed field on a template PDF. Coordinates in PDF points (72dpi), origin top-left of the page. */
export interface TemplateField {
  id: string
  type: TemplateFieldType
  /** 1-based page number. */
  page: number
  x: number
  y: number
  w: number
  h: number
}

export interface DocTemplateMeta {
  kind: DocKind
  originalName: string
  pageCount: number
  uploadedAt: string
  fields: TemplateField[]
}

/** Signing-request status per crew member and document kind. */
export interface MemberDoc {
  userId: string
  kind: DocKind
  status: MemberDocStatus
  sentAt: string
  completedAt?: string
  signedName?: string
  /** True once a stamped, signed PDF is stored and downloadable. */
  hasFile: boolean
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

/** Per-day extras the employee ticks on the timesheet. */
export interface DayFlags {
  date: string
  perDiem: boolean
  runningLunch: boolean
}

export interface DayBreakdown {
  date: string
  hours: number
  otHours: number
  restViolationHours: number
  streakIndex: number
  doublePay: boolean
  /** Under 6 pooled hours: only half the day rate. Optional on old snapshots. */
  halfDay?: boolean
  baseAmount: number
  otAmount: number
  restViolationAmount: number
  /** Optional on payrolls approved before these extras existed. */
  perDiem?: boolean
  runningLunch?: boolean
  perDiemAmount?: number
  runningLunchAmount?: number
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
    /** Optional on payrolls approved before these extras existed. */
    perDiemAmount?: number
    runningLunchAmount?: number
    amount: number
  }
  dayRate: number
  hourlyOtRate: number
}

// ── Location maps (portal tool: tökustaðakort) ──────────────────────────────

/** Page background: live map tiles (streets/satellite) or an uploaded image. */
export type LocationMapBase = 'streets' | 'satellite' | 'image'

export type LocationMarkerKind = 'basecamp' | 'set' | 'parking' | 'trucks' | 'catering' | 'wc' | 'custom'

export interface LatLng {
  lat: number
  lng: number
}

/**
 * A placed pin. On map pages lat/lng are real WGS84 coordinates; on image
 * pages they are pixel coordinates in the uploaded image (Leaflet CRS.Simple:
 * lat = y from the bottom, lng = x from the left).
 */
export interface LocationMapMarker extends LatLng {
  id: string
  kind: LocationMarkerKind
  label?: string
  /** Location number ("Location 1, 2, …") — set pins only; shown inside the pin. */
  num?: number
}

/** A drawn route/road: a polyline in the same coordinate space as markers. */
export interface LocationMapRoad {
  id: string
  points: LatLng[]
  color: string
  width: number
  dashed: boolean
}

export interface LocationMapText extends LatLng {
  id: string
  text: string
  /** Font size in screen px at the saved zoom (also used for the PDF). */
  size: number
  /** Text color on the dark chip (absent on texts saved before colors existed). */
  color?: string
}

export type VehicleMarkerKind = 'truck' | 'semi' | 'van'

/**
 * A true-scale vehicle placed on a map page (top view). Dimensions are real
 * meters; the editor and the PDF exporter convert them to pixels from the map
 * scale, so the footprint always matches the map. Map pages only — image
 * pages have no real-world scale. Front points along +rotation 0 = east.
 */
export interface LocationMapVehicle extends LatLng {
  id: string
  kind: VehicleMarkerKind
  lengthM: number
  widthM: number
  /** Degrees clockwise, 0–359. */
  rotation: number
  color: string
  label?: string
}

/**
 * A drawn outline shape. Rect: a and b are opposite corners. Circle: a is the
 * center, b a point on the edge (the radius follows the map projection).
 */
export interface LocationMapShape {
  id: string
  shape: 'rect' | 'circle'
  a: LatLng
  b: LatLng
  color: string
  /** Stroke width in px. */
  width: number
  fill: boolean
  /** Fill opacity 0.05–1 (only used when fill is on). */
  fillOpacity: number
}

export interface LocationMapPage {
  id: string
  title: string
  base: LocationMapBase
  /** Saved viewport (map pages). */
  center: LatLng
  zoom: number
  /** Data URL of the uploaded background (image pages only). */
  image?: string
  imageW?: number
  imageH?: number
  markers: LocationMapMarker[]
  roads: LocationMapRoad[]
  texts: LocationMapText[]
  vehicles: LocationMapVehicle[]
  /** Absent on documents saved before shapes existed. */
  shapes?: LocationMapShape[]
}

export interface LocationMapDoc {
  id: string
  name: string
  /** Job this map is linked to ("Hjálpargögn" on the job page), if any. */
  jobId?: string
  createdAt: string
  updatedAt: string
  pages: LocationMapPage[]
}

/** List row on the tool landing page — no page payload (images can be MBs). */
export interface LocationMapSummary {
  id: string
  name: string
  jobId?: string
  updatedAt: string
  pageCount: number
}

// ── Recce plans (portal tool "recce áætlun") ─────────────────────────────────

export interface ReccePlanStop {
  name: string
  address: string
  notes: string
  link: string
  /** "lat, lng" text as copied from Google Maps (may be empty). */
  coords: string
  /** True when coords were auto-filled from the maps link — they then follow
   * the link when it changes; hand-typed coords are never overwritten. */
  coordsAuto?: boolean
  /** Up to 2 downscaled JPEG data URLs. */
  photos: string[]
  /** Minutes spent at the stop. */
  durationMin: number
  /** Minutes driving to the NEXT stop. */
  travelMin: number
}

export interface ReccePlanContact {
  name: string
  role: string
  phone: string
}

/** The editable payload, stored as one JSON blob per plan. */
export interface ReccePlanData {
  subtitle: string
  date: string
  /** Arrival at the first stop, "HH:MM". */
  startTime: string
  note: string
  stops: ReccePlanStop[]
  contacts: ReccePlanContact[]
}

export interface ReccePlanDoc {
  id: string
  /** Doubles as the project name on the PDF. */
  name: string
  /** Job this plan is linked to ("Hjálpargögn" on the job page), if any. */
  jobId?: string
  createdAt: string
  updatedAt: string
  data: ReccePlanData
}

/** List row on the tool landing page — no photo payload. */
export interface ReccePlanSummary {
  id: string
  name: string
  jobId?: string
  updatedAt: string
  stopCount: number
}

// ── Location photo albums (portal tool "tökustaðamyndir") ────────────────────

export interface LocationPhoto {
  id: string
  albumId: string
  createdAt: string
  originalName: string
  caption?: string
  width: number
  height: number
  /** Bytes of the stored full image. */
  size: number
  sort: number
}

export interface LocationAlbum {
  id: string
  name: string
  /** Job the folder is linked to. Set on ROOT folders; a detail resolves it
   * from the root so subfolders inherit it. */
  jobId?: string
  note?: string
  coverPhotoId?: string
  createdAt: string
  updatedAt: string
  /** NULL/absent for a root folder; otherwise the parent folder's id. */
  parentId?: string
  /** Optional map pin — both set together or both absent. */
  lat?: number
  lng?: number
}

/** List row on a folder grid — a cover id plus direct photo/subfolder counts. */
export interface LocationAlbumSummary extends LocationAlbum {
  photoCount: number
  /** Number of direct subfolders. */
  childCount: number
  /** Resolved pin color (own, inherited from the location, or a default). */
  color: string
  /** This folder is a picked (starred) option within its location. */
  chosen: boolean
  /** Quality rating 0–5 (0 = unrated). Options only. */
  rating: number
  /** If this folder is a location whose option was picked: the chosen option. */
  decidedOptionId?: string
  decidedOptionName?: string
}

/** One folder with its photos, subfolders and ancestor trail, for the gallery page. */
export interface LocationAlbumDetail extends LocationAlbum {
  /** The folder's own color (unset = inherits / uses a default). */
  color?: string
  /** Resolved pin color actually used on the map. */
  displayColor: string
  chosen: boolean
  /** Quality rating 0–5 (0 = unrated). */
  rating: number
  photos: LocationPhoto[]
  children: LocationAlbumSummary[]
  /** Ancestors from the root down to the parent (excludes this folder). */
  breadcrumb: { id: string, name: string }[]
}

/** A folder with coordinates, for the overview map. */
export interface LocationAlbumPin {
  id: string
  name: string
  lat: number
  lng: number
  photoCount: number
  /** Folder names from the root down to and including this folder. */
  path: string[]
  /** Resolved pin color (the location's color). */
  color: string
  /** Picked option — drawn with a star; unpicked siblings are hidden when set. */
  chosen: boolean
  /** Quality rating 0–5 (0 = unrated). */
  rating: number
  /** A representative photo (this option's own cover), for the map card. */
  coverPhotoId?: string
}

// ── Purchase orders (portal tool "innkaupabeiðnir", a light DPO) ─────────────

export type PurchaseOrderStatus = 'pending' | 'approved' | 'rejected'

export interface PurchaseOrder {
  id: string
  jobId: string
  /** Per-job sequence, shown as PO-001 etc. */
  poNumber: number
  createdAt: string
  vendor: string
  description?: string
  /** ISK. */
  amount: number
  status: PurchaseOrderStatus
  createdById: string
  createdByName: string
  departmentId?: string
  departmentName?: string
  decidedAt?: string
  decidedByName?: string
  decisionNote?: string
  /** Set once the (approved) order has actually been paid out. */
  paidAt?: string
  paidByName?: string
  /** VAT rate on the invoice (0, 11 or 24); absent on rows logged before VAT support. */
  vatRate?: number
  /** Eligible for the Icelandic production rebate (framleiðsluendurgreiðsla). */
  rebateEligible: boolean
  /** ISK actually invoiced when it differed from the logged amount; paid figures use this, planning figures use amount. */
  actualAmount?: number
  attachmentName?: string
  costCodeId?: string
  /** e.g. "4110" — display only, joined from the code register. */
  costCode?: string
  costCodeName?: string
}

/** Per-job accounting key (bókhaldslykill) that orders are booked against. */
export interface PurchaseOrderCostCode {
  id: string
  code: string
  name: string
  /** Tied to one department; absent = shared by every department. */
  departmentId?: string
  departmentName?: string
  /** Optional spending cap in ISK — the overview shows usage against it. */
  budget?: number
}

/** A job where the signed-in user can use the purchase-order tool. */
export interface PurchaseOrderJob {
  jobId: string
  jobName: string
  companyName: string
  /** Company admin (or approve role): sees and reviews every order. */
  isJobAdmin: boolean
  /** The effective PO role driving the scope hint. */
  poRole: 'admin' | PoRole
  departmentId?: string
  departmentName?: string
}

/** One job's orders, scoped to what the caller may see. */
export interface PurchaseOrderList {
  isJobAdmin: boolean
  /** May log new costs (admins, approve/log roles, dept admins by default). */
  canLog: boolean
  /** Sees every order on the job (admins, approve and view roles). */
  viewAll: boolean
  /** Departments of the job — admins pick one when logging an order. */
  departments: { id: string, name: string }[]
  /** The job's cost codes — everyone picks one when logging an order. */
  costCodes: PurchaseOrderCostCode[]
  orders: PurchaseOrder[]
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
