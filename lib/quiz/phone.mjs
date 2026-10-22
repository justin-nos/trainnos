// Returns E.164 (+1XXXXXXXXXX) for a valid US number, otherwise null.
export function normalizeUSPhone(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  const ten =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(ten)) return null;
  return `+1${ten}`;
}

export function formatUSPhone(e164) {
  const d = e164.slice(2);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
