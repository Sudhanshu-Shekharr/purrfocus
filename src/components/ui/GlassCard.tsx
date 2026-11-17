import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';
import { transitionBase } from '@/lib/motion';

type Padding = 'none' | 'sm' | 'md' | 'lg';

type GlassCardBaseProps = {
  padding?: Padding;
  /** Hover lift (2px translateY + deeper shadow on fine pointers) */
  hoverLift?: boolean;
  /** Tap press scale animation (Framer Motion) */
  interactive?: boolean;
  /** More opaque glass variant */
  strong?: boolean;
  className?: string;
  children?: React.ReactNode;
  id?: string;
};

/** When interactive=true, additional props map onto the underlying motion.div */
export type GlassCardProps = GlassCardBaseProps & {
  as?: React.ElementType;
} & Omit<HTMLMotionProps<'div'>, keyof GlassCardBaseProps | 'as'>;

const paddingMap: Record<Padding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Frosted glass surface card — the primary content container for Purrfocus.
 * Uses the `.glass` utility so it automatically responds to `data-scene` token sets.
 * Includes fine-pointer hover lift (2px) and deeper shadow feedback.
 */
export const GlassCard = React.forwardRef<HTMLElement, GlassCardProps>(function GlassCard(
  {
    as: Tag = 'div',
    padding = 'md',
    hoverLift = true,
    interactive = false,
    strong = false,
    className,
    children,
    id,
    ...rest
  },
  ref,
) {
  const classes = cn(
    'glass rounded-card',
    strong && 'glass-strong',
    hoverLift && 'glass-card-hover',
    paddingMap[padding],
    className,
  );

  if (interactive) {
    return (
      <motion.div
        ref={ref as React.Ref<HTMLDivElement>}
        id={id}
        data-hover-lift={hoverLift ? 'true' : undefined}
        className={classes}
        whileHover={{ y: -2, boxShadow: 'var(--shadow-lift)' }}
        whileTap={{ scale: 0.98 }}
        transition={transitionBase}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Tag
      ref={ref}
      id={id}
      data-hover-lift={hoverLift ? 'true' : undefined}
      className={classes}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Tag>
  );
});
