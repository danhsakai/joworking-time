const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function parseDateOnlyToUtc(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function endOfDateOnlyToUtc(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}

export function formatUtcDateOnly(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekKeyFromDateOnly(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const dateUtc = Date.UTC(year, month - 1, day);
  const yearStartUtc = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((dateUtc - yearStartUtc) / ONE_DAY_MS);
  const yearStartDay = new Date(yearStartUtc).getUTCDay();
  const week = Math.ceil((dayOfYear + yearStartDay + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
