import { createContext, useContext, useState, useRef } from "react";

const ErrorContext = createContext();

export const useError = () => useContext(ErrorContext);

export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);
  const timerRef = useRef(null);

  const showError = (message, duration = 3000) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setError(message);
    setIsError(true);

    timerRef.current = setTimeout(() => {
      setIsError(false);
      timerRef.current = null;
    }, duration);
  };

  const clearError = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setError(null);
    setIsError(false);
  };

  const value = {
    error,
    showError,
    isError,
    clearError,
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}
