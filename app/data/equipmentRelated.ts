// "Pairs well with" on an equipment page: the categories whose items go out on
// the same jobs, by category id, in the order they are drawn from (heaters
// with the power to run them and the tents they warm, a makeup mirror with
// tables, heat and power). A category that is not listed falls back to the
// categories that follow it in the catalogue's order.
export const RELATED_CATEGORIES: Record<string, string[]> = {
  catering: ['furniture', 'shelter'],
  furniture: ['catering', 'shelter'],
  lighting: ['power'],
  sound: ['power'],
  drones: ['power'],
  heating: ['power', 'shelter'],
  power: ['lighting', 'heating'],
  shelter: ['heating', 'furniture', 'lighting'],
  safety: ['lighting', 'tools'],
  costume: ['furniture', 'heating', 'power'],
  tools: ['power', 'safety'],
  cleaning: ['catering', 'tools'],
}
