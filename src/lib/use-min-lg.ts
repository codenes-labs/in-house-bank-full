import { useEffect, useState } from 'react';

const LG_MIN_WIDTH_PX = 1024;

export function useMinLg(): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(`(min-width: ${LG_MIN_WIDTH_PX}px)`).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${LG_MIN_WIDTH_PX}px)`);
    const onChange = () => setMatches(media.matches);
    media.addEventListener('change', onChange);
    onChange();
    return () => media.removeEventListener('change', onChange);
  }, []);

  return matches;
}