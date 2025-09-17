export const formatBalance = (balance: number, showDollarSign = true) => {
  return `${showDollarSign ? "$" : ""}${(balance / 100).toLocaleString(
    undefined,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )}`;
};
