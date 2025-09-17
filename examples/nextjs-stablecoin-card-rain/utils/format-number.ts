export const formatNumberWithCommas = (value: string | number): string => {
  // Convert to string and remove any existing commas
  const numStr = String(value).replace(/,/g, "");

  // Parse as number and format with commas
  const num = parseFloat(numStr);
  if (isNaN(num)) return "";

  return num.toLocaleString();
};

export const parseNumberFromFormatted = (formattedValue: string): string => {
  // Remove commas and return just the digits
  return formattedValue.replace(/,/g, "");
};
