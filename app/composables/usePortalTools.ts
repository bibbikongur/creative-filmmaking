// Central registry for the portal helper tools ("Hjálpargögn"). The tools live
// on the job pages now — add a new tool here and it shows up on every job's
// tools grid automatically, opened job-scoped via ?job=.
// Each tool is a client-side page under app/pages/portal/tools/<slug>.vue.

export type PortalToolCategory = 'locations' | 'production' | 'files'

export interface PortalTool {
  /** URL slug and page filename (app/pages/portal/tools/<slug>.vue). */
  slug: string
  /** i18n key for the tool title. */
  titleKey: string
  /** i18n key for the short description shown on the card. */
  descKey: string
  /** Inline SVG path data (24x24 viewBox) for the card icon. */
  icon: string
  /** Group the tool belongs to on the job page (and the access page). */
  category: PortalToolCategory
}

/** Display order of the tool groups + their heading i18n keys. */
export const toolCategories: { key: PortalToolCategory, labelKey: string }[] = [
  { key: 'locations', labelKey: 'portal.tools.categories.locations' },
  { key: 'production', labelKey: 'portal.tools.categories.production' },
  { key: 'files', labelKey: 'portal.tools.categories.files' },
]

export const portalTools: PortalTool[] = [
  {
    slug: 'pdf-merge',
    category: 'files',
    titleKey: 'portal.tools.pdfMerge.title',
    descKey: 'portal.tools.pdfMerge.desc',
    // Stacked documents
    icon: 'M9 3h7l4 4v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM5 7v13a2 2 0 0 0 2 2h9',
  },
  {
    slug: 'img-to-pdf',
    category: 'files',
    titleKey: 'portal.tools.imgToPdf.title',
    descKey: 'portal.tools.imgToPdf.desc',
    // Picture into document
    icon: 'M4 5h11v14H4zM4 15l3-3 3 3 3-4M20 4v6m0 0l-2.5-2.5M20 10l2.5-2.5',
  },
  {
    slug: 'location-map',
    category: 'locations',
    titleKey: 'portal.tools.locationMap.title',
    descKey: 'portal.tools.locationMap.desc',
    // Folded map with a pin
    icon: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v6M15 17.5s3-2.6 3-4.5a3 3 0 0 0-6 0c0 1.9 3 4.5 3 4.5z',
  },
  {
    slug: 'pdf-editor',
    category: 'files',
    titleKey: 'portal.tools.pdfEdit.title',
    descKey: 'portal.tools.pdfEdit.desc',
    // Document with pencil
    icon: 'M12 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7M17.5 3.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z',
  },
  {
    slug: 'purchase-orders',
    category: 'production',
    titleKey: 'portal.tools.po.title',
    descKey: 'portal.tools.po.desc',
    // Receipt with item lines
    icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9.5 8h5M9.5 12h5M9.5 16h3',
  },
  {
    slug: 'location-photos',
    category: 'locations',
    titleKey: 'portal.tools.locationPhotos.title',
    descKey: 'portal.tools.locationPhotos.desc',
    // Framed photo with mountains — location gallery
    icon: 'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6M8.5 9.5a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z',
  },
  {
    slug: 'heic-convert',
    category: 'files',
    titleKey: 'portal.tools.heic.title',
    descKey: 'portal.tools.heic.desc',
    // Photo swap
    icon: 'M4 6h12v10H4zM4 13l3-3 3 3 2.5-3.5M15 8h5v10a2 2 0 0 1-2 2H8',
  },
  {
    slug: 'exif-map',
    category: 'files',
    titleKey: 'portal.tools.exifMap.title',
    descKey: 'portal.tools.exifMap.desc',
    // Photo with a map pin
    icon: 'M4 6h12v12H4zM4 14l3-3 3 3 2.5-3M19 3a2.8 2.8 0 0 0-2.8 2.8C16.2 8 19 10.5 19 10.5s2.8-2.5 2.8-4.7A2.8 2.8 0 0 0 19 3z',
  },
  {
    slug: 'call-sheet',
    category: 'production',
    titleKey: 'portal.tools.callSheet.title',
    descKey: 'portal.tools.callSheet.desc',
    // Clapperboard
    icon: 'M3 10h18v10H3zM3 10L5 5l16 2-1.5 3.5M8 5.4L6.5 9.5M12 5.9L10.5 10M16 6.4l-1.5 3.8',
  },
  {
    slug: 'recce-plan',
    category: 'locations',
    titleKey: 'portal.tools.recce.title',
    descKey: 'portal.tools.recce.desc',
    // Clipboard with a clock
    icon: 'M9 3h6v3H9zM15 4h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 10.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zM12 12.4v1.9l1.4 1.1',
  },
]

export const usePortalTools = () => ({ portalTools, toolCategories })

/**
 * Client-side gate for a tool page: bounces users without access back to the
 * job list. UX only — server-backed tools are enforced again by the
 * 01.tool-access middleware; client-only tools have nothing to protect
 * server-side. The page renders inside the portal layout's auth gate, so the
 * session (and allowedTools) is already loaded when this runs.
 */
export function usePortalToolGuard(slug: string) {
  const { authed, allowedTools } = usePortalAuth()
  const localePath = useLocalePath()
  const route = useRoute()
  watchEffect(() => {
    if (authed.value && allowedTools.value !== null && !allowedTools.value.includes(slug)) {
      const job = typeof route.query.job === 'string' && route.query.job ? route.query.job : ''
      navigateTo(localePath(job ? `/portal/jobs/${job}` : '/portal/jobs'))
    }
  })
}
