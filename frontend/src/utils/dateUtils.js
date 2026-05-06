/**
 * Formats a date as YYYY-MM-DD in local time.
 * This avoids timezone offset issues common with toISOString().
 */
export const formatDateLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Returns today's date as YYYY-MM-DD in local time.
 */
export const getTodayLocal = () => formatDateLocal(new Date());
