/**
 * Utility functions for validating user inputs
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email);
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Object with result and message
   */
  export const validatePassword = (password) => {
    if (!password) {
      return { valid: false, message: 'Password is required' };
    }
  
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
  
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
  
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
  
    // Check for at least one number
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
  
    return { valid: true, message: 'Password is strong' };
  };
  
  /**
   * Check if passwords match
   * @param {string} password - Password
   * @param {string} confirmPassword - Repeated password
   * @returns {boolean} True if passwords match
   */
  export const doPasswordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
  };
  
  /**
   * Validate Ethereum address
   * @param {string} address - Ethereum address to validate
   * @returns {boolean} True if address is valid
   */
  export const isValidEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };
  
  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is valid
   */
  export const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  };
  
  /**
   * Validate a required field
   * @param {string} value - Field value
   * @returns {Object} Object with result and message
   */
  export const validateRequired = (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { valid: false, message: 'This field is required' };
    }
    return { valid: true, message: '' };
  };
  
  /**
   * Validate number is positive
   * @param {number} value - Number to validate
   * @returns {Object} Object with result and message
   */
  export const isPositiveNumber = (value) => {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, message: 'Please enter a valid number' };
    }
    if (num <= 0) {
      return { valid: false, message: 'Please enter a positive number' };
    }
    return { valid: true, message: '' };
  };
  
  /**
   * Validate date is not in the past
   * @param {string|Date} date - Date to validate
   * @returns {Object} Object with result and message
   */
  export const isNotPastDate = (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
  
    if (inputDate < today) {
      return { valid: false, message: 'Date cannot be in the past' };
    }
    return { valid: true, message: '' };
  };
  
  /**
   * Validate date range
   * @param {string|Date} startDate - Start date
   * @param {string|Date} endDate - End date
   * @returns {Object} Object with result and message
   */
  export const isValidDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    if (end < start) {
      return { valid: false, message: 'End date cannot be before start date' };
    }
    return { valid: true, message: '' };
  };
  
  /**
   * Validate file size
   * @param {File} file - File to validate
   * @param {number} maxSizeInBytes - Maximum allowed size in bytes
   * @returns {Object} Object with result and message
   */
  export const isValidFileSize = (file, maxSizeInBytes) => {
    if (!file) {
      return { valid: false, message: 'No file selected' };
    }
  
    if (file.size > maxSizeInBytes) {
      const maxSizeMB = (maxSizeInBytes / (1024 * 1024)).toFixed(2);
      return { 
        valid: false, 
        message: `File size exceeds the maximum allowed size of ${maxSizeMB} MB` 
      };
    }
  
    return { valid: true, message: '' };
  };
  
  /**
   * Validate file type
   * @param {File} file - File to validate
   * @param {Array} allowedTypes - Array of allowed MIME types
   * @returns {Object} Object with result and message
   */
  export const isValidFileType = (file, allowedTypes) => {
    if (!file) {
      return { valid: false, message: 'No file selected' };
    }
  
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }
  
    return { valid: true, message: '' };
  };
  
  /**
   * Validate contract value is within range
   * @param {number} value - Contract value
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {Object} Object with result and message
   */
  export const isContractValueInRange = (value, min, max) => {
    const num = Number(value);
    
    if (isNaN(num)) {
      return { valid: false, message: 'Please enter a valid number' };
    }
    
    if (num < min) {
      return { valid: false, message: `Value must be at least $${min}` };
    }
    
    if (max && num > max) {
      return { valid: false, message: `Value cannot exceed $${max}` };
    }
    
    return { valid: true, message: '' };
  };
  
  /**
   * Validate form data
   * @param {Object} data - Form data with field values
   * @param {Object} validations - Object mapping field names to validation functions
   * @returns {Object} Object with errors for each invalid field
   */
  export const validateForm = (data, validations) => {
    const errors = {};
    
    Object.keys(validations).forEach(field => {
      const value = data[field];
      const validation = validations[field];
      
      // Each validation can be a function or an array of functions
      const validationArray = Array.isArray(validation) ? validation : [validation];
      
      for (const validationFn of validationArray) {
        const result = validationFn(value, data);
        
        if (!result.valid) {
          errors[field] = result.message;
          break; // Stop on first error for this field
        }
      }
    });
    
    return errors;
  };