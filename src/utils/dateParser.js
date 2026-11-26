/**
 * Parses a date input in "DD / MM / YYYY", "DD/MM/YYYY", "DD-MM-YYYY", or "YYYY-MM-DD" format
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
    if (!ymdMatch) return null;
    year = Number(ymdMatch[1]);
    month = Number(ymdMatch[2]);
    day = Number(ymdMatch[3]);
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
 * Formats a Date into "DD / MM / YYYY" matching the frontend form display.
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
