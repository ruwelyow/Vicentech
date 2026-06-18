import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting form data to localStorage
 * @param {string} storageKey - Unique key for localStorage (e.g., 'register-form', 'apply-form')
 * @param {object} initialFormState - Initial form state object
 * @param {object} options - Configuration options
 * @param {boolean} options.enabled - Whether persistence is enabled (default: true)
 * @param {number} options.debounceMs - Debounce delay for saving (default: 300)
 * @param {function} options.onLoad - Callback when form data is loaded from storage
 * @returns {[object, function, function]} - [formData, setFormData, clearFormData]
 */
export const useFormPersistence = (storageKey, initialFormState, options = {}) => {
  const {
    enabled = true,
    debounceMs = 300,
    onLoad = null
  } = options;

  // Load initial state from localStorage or use provided initial state
  const getInitialState = useCallback(() => {
    if (!enabled || typeof window === 'undefined') {
      return initialFormState;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with initial state to ensure all fields exist
        const merged = { ...initialFormState, ...parsed };
        
        // Call onLoad callback if provided
        if (onLoad && typeof onLoad === 'function') {
          onLoad(merged);
        }
        
        return merged;
      }
    } catch (error) {
      console.warn(`Failed to load form data from localStorage for key "${storageKey}":`, error);
    }
    
    return initialFormState;
  }, [storageKey, initialFormState, enabled, onLoad]);

  const [formData, setFormData] = useState(getInitialState);

  // Save to localStorage whenever formData changes
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        // Exclude password fields for security
        const sanitizedData = { ...formData };
        ['password', 'password_confirmation', 'current_password', 'new_password', 'new_password_confirmation'].forEach(field => {
          if (sanitizedData.hasOwnProperty(field)) {
            sanitizedData[field] = '';
          }
        });
        localStorage.setItem(storageKey, JSON.stringify(sanitizedData));
      } catch (error) {
        console.warn(`Failed to save form data to localStorage for key "${storageKey}":`, error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, storageKey, enabled, debounceMs]);

  // Enhanced setFormData that works with both direct values and updater functions
  const updateFormData = useCallback((updater) => {
    setFormData(prev => {
      const newData = typeof updater === 'function' ? updater(prev) : updater;
      return newData;
    });
  }, []);

  // Clear form data from both state and localStorage
  const clearFormData = useCallback(() => {
    setFormData(initialFormState);
    if (enabled && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn(`Failed to clear form data from localStorage for key "${storageKey}":`, error);
      }
    }
  }, [storageKey, initialFormState, enabled]);

  return [formData, updateFormData, clearFormData];
};

export default useFormPersistence;

