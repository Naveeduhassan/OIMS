// Central currency formatter — PKR
export const fmt = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

export const fmtPKR = (value) => fmt.format(parseFloat(value) || 0);
