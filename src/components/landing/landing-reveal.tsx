import type { CSSProperties, ReactNode } from 'react';
import { useRevealOnScroll } from '../../hooks/use-reveal-on-scroll';
import { cx } from '../ui';

export function LandingReveal({
  children,
  className,
  style,
  eager,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
}) {
  const ref = useRevealOnScroll<HTMLDivElement>();

  if (eager) {
    return (
      <div className={cx('landing-reveal landing-reveal-active', className)} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}