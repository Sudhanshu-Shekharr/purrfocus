import React from 'react';

type VisuallyHiddenProps = {
  children: React.ReactNode;
  as?: React.ElementType;
};

const style: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
};

/**
 * Visually hidden but accessible to screen readers.
 * Use for labels, descriptions, and context visible only to assistive tech.
 */
export const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ children, as: Tag = 'span' }, ref) {
    return (
      <Tag ref={ref} style={style}>
        {children}
      </Tag>
    );
  },
);
