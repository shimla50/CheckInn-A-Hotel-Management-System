/**
 * @fileoverview Centralized currency formatter for BDT amounts
 */

export const CURRENCY_SYMBOL = '৳';

/**
 * Format a numeric amount in Bangladeshi Taka.
 * Falls back to 0 when amount is falsy/invalid.
 *
 * @param {number|string} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  const numericAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  try {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (err) {
    // Fallback if Intl fails for any reason
    return `${CURRENCY_SYMBOL}${numericAmount.toFixed(2)}`;
  }
};

export default formatCurrency;

