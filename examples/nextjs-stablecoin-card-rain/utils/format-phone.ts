export function formatPhone(value: string, countryCode: string = "1"): string {
  const digits = (value || "").replace(/\D/g, "");
  if ((countryCode || "") === "1") {
    const d = digits.slice(0, 10);
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 10);
    if (d.length <= 3) return a;
    if (d.length <= 6) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  }
  const d = digits.slice(0, 15);
  return d.replace(/(\d{3})(?=\d)/g, "$1 ");
}
