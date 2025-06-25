
/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format currency value
 */
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  // Handle currency symbols
  const currencySymbol = getCurrencySymbol(currency);
  return `${currencySymbol}${value.toFixed(2)}`;
};

/**
 * Get currency symbol based on currency code
 */
export const getCurrencySymbol = (currency: string = 'USD'): string => {
  switch (currency.toUpperCase()) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'CAD': return 'CA$';
    case 'AUD': return 'A$';
    case 'CHF': return 'CHF ';
    case 'CNY': return '¥';
    case 'INR': return '₹';
    case 'BRL': return 'R$';
    case 'RUB': return '₽';
    default: return `${currency} `; // If symbol not found, use the currency code
  }
};
