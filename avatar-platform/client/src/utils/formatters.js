/**
 * Utility functions for formatting various data types.
 */

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  };
  
  /**
   * Format date to localized date string
   * @param {string|Date} date - Date to format
   * @param {string} locale - Locale for formatting (default: 'en-US')
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date string
   */
  export const formatDate = (date, locale = 'en-US', options = {}) => {
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  };
  
  /**
   * Format date to localized time string
   * @param {string|Date} date - Date to format
   * @param {string} locale - Locale for formatting (default: 'en-US')
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted time string
   */
  export const formatTime = (date, locale = 'en-US', options = {}) => {
    const defaultOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  };
  
  /**
   * Format date and time
   * @param {string|Date} date - Date to format
   * @param {string} locale - Locale for formatting (default: 'en-US')
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date and time string
   */
  export const formatDateTime = (date, locale = 'en-US', options = {}) => {
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  };
  
  /**
   * Format a number with thousand separators
   * @param {number} value - Number to format
   * @param {string} locale - Locale for formatting (default: 'en-US')
   * @returns {string} Formatted number string
   */
  export const formatNumber = (value, locale = 'en-US') => {
    return new Intl.NumberFormat(locale).format(value);
  };
  
  /**
   * Format percentage
   * @param {number} value - Value to format as percentage (e.g., 0.15 for 15%)
   * @param {string} locale - Locale for formatting (default: 'en-US')
   * @param {number} digits - Number of digits after decimal point (default: 1)
   * @returns {string} Formatted percentage string
   */
  export const formatPercentage = (value, locale = 'en-US', digits = 1) => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  };
  
  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @param {number} decimals - Number of decimals to display (default: 2)
   * @returns {string} Formatted file size (e.g., "1.5 MB")
   */
  export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
  
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  /**
   * Format Ethereum address by shortening it
   * @param {string} address - Ethereum address
   * @param {number} chars - Number of characters to show at start/end (default: 6)
   * @returns {string} Shortened address (e.g., "0x1234...5678")
   */
  export const formatAddress = (address, chars = 6) => {
    if (!address) return '';
    if (address.length <= chars * 2) return address;
    
    return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
  };
  
  /**
   * Format contract status with proper capitalization
   * @param {string} status - Contract status (e.g., "pending", "active")
   * @returns {string} Formatted status string
   */
  export const formatContractStatus = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  /**
   * Format name for display when parts may be missing
   * @param {Object} user - User object
   * @param {string} user.name - User's name (may be null)
   * @param {string} user.email - User's email (fallback)
   * @returns {string} Best display name available
   */
  export const formatName = (user) => {
    if (!user) return 'Unknown User';
    return user.name || user.email || 'Unknown User';
  };
  
  /**
   * Format relative time (e.g., "5 minutes ago")
   * @param {string|Date} date - Date to format
   * @returns {string} Relative time string
   */
  export const formatRelativeTime = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  };
  
  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length before truncating
   * @returns {string} Truncated text
   */
  export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };