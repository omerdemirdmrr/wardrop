import { ERROR_CATEGORIES, ERROR_MESSAGES } from './errorMessages';

class ErrorHandler {
  categorizeError(error) {
    if (!error) return ERROR_CATEGORIES.UNKNOWN;

    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return ERROR_CATEGORIES.NETWORK;
    }

    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) return ERROR_CATEGORIES.AUTH;
      if (status === 403) return ERROR_CATEGORIES.AUTH;
      if (status === 404) return ERROR_CATEGORIES.NOT_FOUND;
      if (status === 400) return ERROR_CATEGORIES.VALIDATION;
      if (status >= 500) return ERROR_CATEGORIES.SERVER;
    }

    return ERROR_CATEGORIES.UNKNOWN;
  }

  extractErrorMessage(error, fallbackMessage = ERROR_MESSAGES.GENERIC.UNKNOWN) {
    if (!error) return fallbackMessage;

    // Check nested error.message structure
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    // Check direct message field
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Check description field (backend sometimes uses this)
    if (error.response?.data?.description) {
      return error.response.data.description;
    }

    // Check for error text
    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    // Check direct error message
    if (error.message) {
      return error.message;
    }

    return fallbackMessage;
  }

  getStandardizedError(error, context = {}) {
    const category = this.categorizeError(error);
    let message = this.extractErrorMessage(error);
    let title = 'Error';

    switch (category) {
      case ERROR_CATEGORIES.NETWORK:
        title = 'Connection Error';
        message = ERROR_MESSAGES.NETWORK.NO_CONNECTION;
        break;
        
      case ERROR_CATEGORIES.AUTH:
        title = 'Authentication Error';
        if (error.response?.status === 401) {
          message = ERROR_MESSAGES.AUTH.INVALID_TOKEN;
        } else if (error.response?.status === 403) {
          message = ERROR_MESSAGES.AUTH.UNAUTHORIZED;
        }
        break;
        
      case ERROR_CATEGORIES.VALIDATION:
        title = 'Validation Error';
        break;
        
      case ERROR_CATEGORIES.SERVER:
        title = 'Server Error';
        message = ERROR_MESSAGES.SERVER.INTERNAL_ERROR;
        break;
        
      case ERROR_CATEGORIES.NOT_FOUND:
        title = 'Not Found';
        break;
        
      default:
        title = 'Error';
    }

    return {
      category,
      title,
      message,
      originalError: error,
      context,
      statusCode: error.response?.status,
      timestamp: new Date().toISOString()
    };
  }

  handleApiError(error, context = {}) {
    const standardError = this.getStandardizedError(error, context);
    
    console.error('[ErrorHandler] API Error:', {
      category: standardError.category,
      message: standardError.message,
      statusCode: standardError.statusCode,
      context: standardError.context,
      timestamp: standardError.timestamp
    });

    return standardError;
  }

  handleAIError(error, context = {}) {
    let message = ERROR_MESSAGES.AI.ANALYSIS_FAILED;

    if (error.message?.includes('API key')) {
      message = ERROR_MESSAGES.AI.API_KEY_INVALID;
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      message = ERROR_MESSAGES.AI.RATE_LIMIT;
    }

    const standardError = {
      category: ERROR_CATEGORIES.AI,
      title: 'AI Error',
      message,
      originalError: error,
      context,
      timestamp: new Date().toISOString()
    };

    console.error('[ErrorHandler] AI Error:', {
      category: standardError.category,
      message: standardError.message,
      context: standardError.context,
      timestamp: standardError.timestamp
    });

    return standardError;
  }

  formatErrorForUser(standardError) {
    return {
      title: standardError.title,
      message: standardError.message,
      category: standardError.category
    };
  }
}

export default new ErrorHandler();
