/**
 * Currency conversion utilities for Paise (integer) and Rupees (decimal).
 * 1 INR = 100 Paise
 */

// Convert INR (number or string e.g. "150.50") to integer Paise (e.g. 15050)
function inrToPaise(inrAmount) {
  const numeric = typeof inrAmount === 'string' ? parseFloat(inrAmount) : inrAmount;
  if (isNaN(numeric) || numeric < 0) {
    throw new Error('Invalid INR amount');
  }
  return BigInt(Math.round(numeric * 100));
}

// Convert integer Paise to formatted INR string (e.g. 15050 -> "150.50")
function paiseToInr(paiseAmount) {
  const big = BigInt(paiseAmount);
  const rupees = Number(big / 100n);
  const paise = Number(big % 100n);
  return `${rupees}.${paise.toString().padStart(2, '0')}`;
}

// Format paise for human display with currency symbol e.g. "₹1,250.00"
function formatPaiseToINR(paiseAmount) {
  const big = BigInt(paiseAmount);
  const inr = Number(big) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(inr);
}

module.exports = {
  inrToPaise,
  paiseToInr,
  formatPaiseToINR
};
