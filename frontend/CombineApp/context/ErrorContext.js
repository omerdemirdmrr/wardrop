import React, { createContext, useContext, useState, useCallback } from 'react';
import ErrorToast from '../components/ErrorToast';

const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = useCallback((errorData) => {
    setError({
      visible: true,
      title: errorData.title || 'Error',
      message: errorData.message || 'An unexpected error occurred',
      category: errorData.category || 'UNKNOWN',
    });
  }, []);

  const hideError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, hideError }}>
      {children}
      {error && (
        <ErrorToast
          visible={error.visible}
          title={error.title}
          message={error.message}
          category={error.category}
          onDismiss={hideError}
        />
      )}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};
