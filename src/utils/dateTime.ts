const MYANMAR_DIGITS: Record<string, string> = {
  '၀': '0', '၁': '1', '၂': '2', '၃': '3', '၄': '4',
  '၅': '5', '၆': '6', '၇': '7', '၈': '8', '၉': '9'
};

const toEnglishDigits = (value: unknown): string =>
  String(value ?? '').replace(/[၀-၉]/g, digit => MYANMAR_DIGITS[digit] || digit);

const parseFlexibleDate = (value?: string | number | Date | null): Date | null => {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const raw = toEnglishDigits(value).trim();
  if (!raw) return null;

  // Existing Myanmar/Asian sheet values are usually D/M/YYYY HH:mm:ss.
  const match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (match) {
    let first = Number(match[1]);
    let second = Number(match[2]);
    const year = Number(match[3]);
    let hour = Number(match[4] || 0);
    const minute = Number(match[5] || 0);
    const secondValue = Number(match[6] || 0);
    const meridiem = (match[7] || '').toUpperCase();

    // Values containing Myanmar digits were written in D/M/YYYY order.
    const containedMyanmarDigits = /[၀-၉]/.test(String(value));
    let month = containedMyanmarDigits ? second : first;
    let day = containedMyanmarDigits ? first : second;
    // Resolve unambiguous dates even when the source used English digits.
    if (first > 12) { day = first; month = second; }
    if (second > 12) { month = first; day = second; }

    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    const parsed = new Date(year, month - 1, day, hour, minute, secondValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatUSDateTime = (value?: string | number | Date | null): string => {
  if (value === undefined || value === null || value === '') return '-';
  const date = parseFlexibleDate(value);
  if (!date) return toEnglishDigits(value);
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  }).format(date);
};

export const formatUSDate = (value?: string | number | Date | null): string => {
  if (value === undefined || value === null || value === '') return '-';
  const date = parseFlexibleDate(value);
  if (!date) return toEnglishDigits(value);
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  }).format(date);
};
