export const ERROR_CATEGORIES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  AI: 'AI',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN'
};

export const ERROR_MESSAGES = {
  NETWORK: {
    NO_CONNECTION: 'Please check your internet connection',
    TIMEOUT: 'Request timed out. Please try again',
    UNKNOWN: 'Network error occurred'
  },
  
  AUTH: {
    INVALID_TOKEN: 'Your session has expired. Please log in again',
    EXPIRED_TOKEN: 'Your session has expired. Please log in again',
    UNAUTHORIZED: 'You do not have permission for this action',
    INVALID_CREDENTIALS: 'Invalid username or password'
  },
  
  VALIDATION: {
    MISSING_FIELDS: 'Please fill in all required fields',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORD_MISMATCH: 'Passwords do not match',
    WEAK_PASSWORD: 'Password is too weak. Please follow password requirements'
  },
  
  SERVER: {
    INTERNAL_ERROR: 'Server error occurred. Please try again later',
    BAD_REQUEST: 'Invalid request',
    SERVICE_UNAVAILABLE: 'Service is currently unavailable'
  },
  
  AI: {
    API_KEY_INVALID: 'AI service configuration error',
    RATE_LIMIT: 'AI service temporarily unavailable. Please wait a moment',
    ANALYSIS_FAILED: 'Image analysis failed',
    INVALID_RESPONSE: 'AI service returned invalid response'
  },
  
  CLOTHING: {
    SAVE_FAILED: 'Failed to save clothing item',
    UPDATE_FAILED: 'Failed to update item',
    DELETE_FAILED: 'Failed to delete clothing item',
    FETCH_FAILED: 'Failed to load clothing items',
    NOT_FOUND: 'Clothing item not found'
  },
  
  OUTFIT: {
    GENERATE_FAILED: 'Failed to generate outfit',
    NOT_ENOUGH_ITEMS: 'Not enough items in your wardrobe',
    UPDATE_FAILED: 'Failed to update outfit',
    DELETE_FAILED: 'Failed to delete outfit',
    FETCH_FAILED: 'Failed to load outfits'
  },
  
  PERMISSION: {
    CAMERA_DENIED: 'Camera permission required',
    GALLERY_DENIED: 'Gallery access permission required',
    LOCATION_DENIED: 'Location permission required'
  },
  
  GENERIC: {
    UNKNOWN: 'An unexpected error occurred',
    TRY_AGAIN: 'Something went wrong. Please try again'
  }
};
