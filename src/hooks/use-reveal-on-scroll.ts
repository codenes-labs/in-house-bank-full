import { useEffect, useRef, type RefObject } from 'react';

export function useRevealOnScroll<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    node.classList.add('landing-reveal');
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('landing-reveal-active');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('landing-reveal-active');
          }
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}