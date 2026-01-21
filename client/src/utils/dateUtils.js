/**
 * Converts an ISO UTC timestamp into a local YYYY-MM-DD key
 * This should be used for ALL calendar grouping logic
 */
export function getLocalDateKey(isoString) {
  const d = new Date(isoString);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
