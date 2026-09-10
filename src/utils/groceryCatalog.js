// Matches a typed/pasted name against the catalog (preset + a user's own
// custom items) so "egg", "Egg", and "Eggs" all resolve to the same
// canonical spelling. That's what lets the Reports tab's frequency and
// price-history tracking (which groups by exact name) actually group items
// together instead of splitting them across near-duplicate spellings.

export function normalizeKey(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/e?s$/, ''); // naive plural fold — only used as a match key, never shown
}

/** Returns the catalog entry matching `name`, or null. Exact (case-insensitive) match wins over a plural-folded match. */
export function findCatalogMatch(name, catalog) {
  const trimmed = String(name).trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const exact = catalog.find((it) => it.name.toLowerCase() === lower);
  if (exact) return exact;
  const key = normalizeKey(trimmed);
  return catalog.find((it) => normalizeKey(it.name) === key) || null;
}

/** Canonicalizes `name` to its catalog spelling when there's a match, otherwise returns it unchanged. */
export function canonicalizeName(name, catalog) {
  return findCatalogMatch(name, catalog)?.name ?? name;
}
