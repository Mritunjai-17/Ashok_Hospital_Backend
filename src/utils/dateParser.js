const MONTH_INDEX = Object.freeze({
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
});

/**
 * Parses a date input in "DD / MM / YYYY", "DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD",
 * or display format like "Sat, 28 Nov 2026" / "Saturday, 28 November 2026"
 * into a UTC midnight Date object, returning null if invalid.
 *
 * @param {string|Date} input
 * @returns {Date|null}
 */
function parsePreferredDate(input) {
  if (!input) return null;

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }

  const raw = String(input).trim();
  let day;
  let month;
  let year;

  // Match DD/MM/YYYY or DD / MM / YYYY or DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{4})$/);
  if (dmyMatch) {
    day = Number(dmyMatch[1]);
    month = Number(dmyMatch[2]);
    year = Number(dmyMatch[3]);
  } else {
    // Match YYYY-MM-DD (or ISO prefix)
    const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (ymdMatch) {
      year = Number(ymdMatch[1]);
      month = Number(ymdMatch[2]);
      day = Number(ymdMatch[3]);
    } else {
      // Match "Sat, 28 Nov 2026", "Saturday, 28 November 2026", or "28 Nov 2026"
      const namedMonthMatch = raw.match(
        /^(?:[A-Za-z]+,\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/
      );
      if (!namedMonthMatch) return null;

      day = Number(namedMonthMatch[1]);
      const monthIdx = MONTH_INDEX[namedMonthMatch[2].toLowerCase()];
      if (monthIdx === undefined) return null;
      month = monthIdx + 1;
      year = Number(namedMonthMatch[3]);
    }
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Formats a Date into "DD / MM / YYYY" for display.
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDisplayDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd} / ${mm} / ${yyyy}`;
}

/**
 * Checks whether a UTC-midnight date is before today's UTC date.
 *
 * @param {Date} date
 * @returns {boolean}
 */
function isPastDate(date) {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return date.getTime() < todayUtc.getTime();
}

module.exports = {
  parsePreferredDate,
  formatDisplayDate,
  isPastDate,
};
