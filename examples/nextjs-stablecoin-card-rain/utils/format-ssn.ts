export function formatSSN(value: string): string {
  const digits = (value || "").replace(/\D/g, "").slice(0, 9);
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 5);
  const p3 = digits.slice(5, 9);
  if (digits.length <= 3) return p1;
  if (digits.length <= 5) return `${p1}-${p2}`;
  return `${p1}-${p2}-${p3}`;
}
