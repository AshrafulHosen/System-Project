export function formatBdt(amount: number): string {
  return `৳${Math.abs(amount).toLocaleString("en-US")}`;
}

export function formatSignedBdt(amount: number): string {
  const sign = amount < 0 ? "-" : "+";
  return `${sign}৳${Math.abs(amount).toLocaleString("en-US")}`;
}

export function formatCompactBdt(amount: number): string {
  if (Math.abs(amount) >= 10000000) {
    return `৳${(amount / 10000000).toFixed(1).replace(/\.0$/, "")} Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `৳${(amount / 100000).toFixed(1).replace(/\.0$/, "")} L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `৳${(amount / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `৳${amount}`;
}
