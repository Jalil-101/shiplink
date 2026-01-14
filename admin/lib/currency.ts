/**
 * Currency formatting utility for Ghana Cedis (GHS)
 * All amounts are assumed to be in GHS
 */

/**
 * Format amount as Ghana Cedis
 * @param amount - Amount in GHS
 * @param showSymbol - Whether to show currency symbol (default: true)
 * @returns Formatted string
 */
export function formatGHS(amount: number, showSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₵0.00' : '0.00';
  }
  
  const formatted = amount.toFixed(2);
  return showSymbol ? `₵${formatted}` : formatted;
}

/**
 * Format amount for display (always shows symbol)
 */
export function formatAmount(amount: number): string {
  return formatGHS(amount, true);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(): string {
  return '₵';
}

