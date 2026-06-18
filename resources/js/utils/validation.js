// Shared sanitization and validation helpers
// Keep these functions small, predictable and well-tested.

/**
 * Detect field type based on field name or label
 * Returns: 'name', 'address', 'phone', 'email', 'text', or null
 */
export const detectFieldType = (fieldName = '', label = '') => {
  const name = String(fieldName || '').toLowerCase();
  const labelText = String(label || '').toLowerCase();
  
  // Name fields
  if (name.includes('name') || name.includes('first_name') || name.includes('last_name') || 
      name.includes('middle_name') || name.includes('suffix') || labelText.includes('name')) {
    return 'name';
  }
  
  // Address fields
  if (name.includes('address') || labelText.includes('address')) {
    return 'address';
  }
  
  // Phone fields
  if (name.includes('phone') || name.includes('contact') || labelText.includes('phone') || 
      labelText.includes('contact') || labelText.includes('number')) {
    return 'phone';
  }
  
  // Email fields
  if (name.includes('email') || labelText.includes('email')) {
    return 'email';
  }
  
  return 'text';
};

/**
 * Sanitize name fields - only letters, spaces, and periods allowed
 * No numbers, no special characters except space and period (for middle initials and suffixes)
 * Note: Does NOT trim to allow spaces during typing
 */
export const sanitizeName = (s = '') => {
  if (typeof s !== 'string') return '';
  // Allow letters (including unicode), spaces, and periods. Remove all numbers and other special chars.
  // Replace multiple consecutive spaces with single space, but don't trim (allows spaces during typing)
  return s.replace(/[^\p{L}\s.]/gu, '').replace(/\s+/g, ' ');
};

/**
 * Validate name fields - must contain only letters, spaces, and periods
 */
export const validateName = (s = '') => {
  const v = String(s || '').trim();
  if (!v) return { valid: false, reason: 'Name is required' };
  // must be at least 2 characters and contain a letter
  if (v.length < 2) return { valid: false, reason: 'Name is too short' };
  if (!/\p{L}/u.test(v)) return { valid: false, reason: 'Name must contain letters' };
  // Check for numbers or invalid characters
  if (/[0-9]/.test(v)) return { valid: false, reason: 'Name cannot contain numbers' };
  if (/[^\p{L}\s.]/u.test(v)) return { valid: false, reason: 'Name can only contain letters, spaces, and periods' };
  return { valid: true };
};

/**
 * Sanitize address fields - allow letters, numbers, spaces, and common address characters
 * Note: Does NOT trim to allow spaces during typing
 */
export const sanitizeAddress = (s = '') => {
  if (typeof s !== 'string') return '';
  // Allow letters, numbers, spaces, and common address punctuation: , . - # / ( )
  // Replace multiple consecutive spaces with single space, but don't trim (allows spaces during typing)
  return s.replace(/[^\p{L}0-9\s,.\-#/()]/gu, '').replace(/\s+/g, ' ');
};

/**
 * Validate address fields
 */
export const validateAddress = (s = '') => {
  const v = String(s || '').trim();
  if (!v) return { valid: false, reason: 'Address is required' };
  if (v.length < 5) return { valid: false, reason: 'Address is too short' };
  // Address should contain at least some letters or numbers
  if (!/[\p{L}0-9]/u.test(v)) return { valid: false, reason: 'Address must contain letters or numbers' };
  return { valid: true };
};

export const sanitizeText = (s = '') => {
  if (typeof s !== 'string') return '';
  // Remove control characters; keep common punctuation
  return s.replace(/[\x00-\x1F\x7F]/g, '').trim();
};

export const sanitizeUsername = (s = '') => {
  if (typeof s !== 'string') return '';
  // allow alphanumeric, dot, underscore, hyphen
  return s.replace(/[^a-zA-Z0-9._\-]/g, '').trim();
};

export const validateEmail = (s = '') => {
  const v = String(s || '').trim();
  if (!v) return { valid: false, reason: 'Email is required' };
  // simple email regex (not perfect but good enough for client-side)
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return { valid: re.test(v), reason: re.test(v) ? undefined : 'Invalid email address' };
};

export const sanitizePhone = (s = '') => {
  if (typeof s !== 'string') return '';
  // Keep digits, +, spaces, parentheses and hyphens
  return s.replace(/[^0-9+()\-\s]/g, '').trim();
};

export const validatePhone = (s = '') => {
  const v = String(s || '').replace(/[^0-9]/g, '');
  if (!v) return { valid: false, reason: 'Phone number is required' };
  // basic length check
  if (v.length < 7) return { valid: false, reason: 'Phone number is too short' };
  if (v.length > 15) return { valid: false, reason: 'Phone number is too long' };
  return { valid: true };
};

export const validatePassword = (s = '') => {
  if (!s || s.length < 6) return { valid: false, reason: 'Password must be at least 6 characters' };
  return { valid: true };
};

/**
 * Smart sanitize function that detects field type and applies appropriate sanitization
 */
export const smartSanitize = (value = '', fieldName = '', label = '') => {
  const fieldType = detectFieldType(fieldName, label);
  
  switch (fieldType) {
    case 'name':
      return sanitizeName(value);
    case 'address':
      return sanitizeAddress(value);
    case 'phone':
      return sanitizePhone(value);
    case 'email':
      // Don't sanitize email fields during typing - let user type freely, validate on submit
      return value;
    default:
      return sanitizeText(value);
  }
};

/**
 * Smart validate function that detects field type and applies appropriate validation
 */
export const smartValidate = (value = '', fieldName = '', label = '') => {
  const fieldType = detectFieldType(fieldName, label);
  
  switch (fieldType) {
    case 'name':
      return validateName(value);
    case 'address':
      return validateAddress(value);
    case 'phone':
      return validatePhone(value);
    case 'email':
      return validateEmail(value);
    default:
      return { valid: true };
  }
};

export default {
  detectFieldType,
  sanitizeName,
  validateName,
  sanitizeAddress,
  validateAddress,
  sanitizeText,
  sanitizeUsername,
  validateEmail,
  sanitizePhone,
  validatePhone,
  validatePassword,
  smartSanitize,
  smartValidate
};
