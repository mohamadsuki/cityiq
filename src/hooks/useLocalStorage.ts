import * as React from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = React.useCallback(
    (newValue: T | ((val: T) => T)) => {
      setValue((prev) => {
        const v = newValue instanceof Function ? newValue(prev) : newValue;
        try {
          window.localStorage.setItem(key, JSON.stringify(v));
        } catch {}
        return v;
      });
    },
    [key]
  );

  return [value, setStoredValue] as const;
}
