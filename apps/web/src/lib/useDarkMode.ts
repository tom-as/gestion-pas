import { useEffect, useState } from 'react';

const KEY = 'gestion-pas-dark';

function readPreference(): boolean {
  const stored = localStorage.getItem(KEY);
  if (stored !== null) return stored === 'true';
  // Design is dark-first — default to dark
  return true;
}

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => readPreference());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(KEY, String(dark));
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  return { dark, toggle };
}
