
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
    default: return `${currency} `;
  }
};
