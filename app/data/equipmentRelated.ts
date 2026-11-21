// Where an equipment page looks for related items when its own category has
// fewer than three others to show: the categories whose items go out on the
// same jobs, by category id. A category that is not listed falls back to the
// categories that follow it in the catalogue's order.
export const RELATED_CATEGORIES: Record<string, string[]> = {
  catering: ['furniture', 'shelter'],
  furniture: ['catering', 'shelter'],
  lighting: ['power'],
}
