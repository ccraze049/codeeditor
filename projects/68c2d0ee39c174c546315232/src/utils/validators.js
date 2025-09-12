// Form validation utilities

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password, minLength = 8) => {
  return password && password.length >= minLength;
};

// Phone number validation (US format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][d]{0,15}$/;
  return phoneRegex.test(phone.replace(/s/g, ''));
};

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Required field validation
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

// Number validation
export const isValidNumber = (value, min, max) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};

// Generic form validator
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    fieldRules.forEach(rule => {
      if (rule.required && !isRequired(value)) {
        errors[field] = rule.message || `${field} is required`;
        return;
      }
      
      if (rule.type === 'email' && value && !isValidEmail(value)) {
        errors[field] = rule.message || 'Invalid email format';
        return;
      }
      
      if (rule.minLength && value && value.length < rule.minLength) {
        errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
        return;
      }
      
      if (rule.validator && !rule.validator(value)) {
        errors[field] = rule.message || `${field} is invalid`;
      }
    });
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};