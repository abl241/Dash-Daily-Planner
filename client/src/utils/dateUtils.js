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

export function to24Hour(hour, period) {
    let h = parseInt(hour, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h.toString().padStart(2, "0");
}

export function buildTimestamp(timeObj) {
    const {
        year,
        month,
        day,
        hour,
        minute,
        period
    } = timeObj;

    const h24 = to24Hour(hour, period);

    // ISO format: YYYY-MM-DDTHH:mm:ss
    return `${year}-${month}-${day}T${h24}:${minute}:00`;
}

export function normalizeRepeatRule(repeatRules) {
  if (!repeatRules) return null;
  return JSON.stringify(repeatRules);
}