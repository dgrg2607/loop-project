import { useEffect, useState } from 'react';

// Delays updating the returned value until `delay` ms after the input stops
// changing. Used on the feedback search box so we don't fire an API request
// on every keystroke.
export default function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
