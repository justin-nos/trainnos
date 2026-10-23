// Dashboard URL hash: "#30d/funnels" or "#2026-10-01_2026-10-20/ctas", with an
// optional "?source=…" for the tab's filters, so views can be shared.
export const rangeHash = range =>
  range.preset === "custom" ? `${range.from}_${range.to}` : range.preset;

export function toHash(range, tab, params) {
  const query = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => v),
  ).toString();
  return `#${rangeHash(range)}/${tab}${query ? `?${query}` : ""}`;
}
