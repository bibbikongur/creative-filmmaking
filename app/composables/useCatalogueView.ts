export type CatalogueView = 'grid' | 'list'

/**
 * Grid or list layout for a catalogue page. The server renders the page's
 * default (the fleet is small, so it opens as a list; equipment has dozens of
 * items, so it opens as a grid); the visitor's last choice for that page is
 * restored from localStorage after mount.
 */
export const useCatalogueView = (page: 'vehicles' | 'equipment', fallback: CatalogueView) => {
  const storageKey = `cf-view-${page}`
  const view = useState<CatalogueView>(`catalogue-view-${page}`, () => fallback)

  onMounted(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'grid' || saved === 'list') view.value = saved
    }
    catch {
      // storage blocked: keep the default
    }
  })

  const set = (next: CatalogueView) => {
    view.value = next
    try {
      localStorage.setItem(storageKey, next)
    }
    catch {
      // ignore
    }
  }

  return { view, set }
}
