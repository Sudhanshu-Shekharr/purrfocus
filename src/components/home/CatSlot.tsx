import React from 'react';
import { CatCompanion } from '@/components/cat/CatCompanion';

/**
 * Geometric cozy cat silhouette illustration (retained for fallback).
 */
export const GeometricCatSilhouette: React.FC<{ className?: string }> = ({
  className = 'w-48 h-40',
}) => (
  <svg
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <ellipse cx="100" cy="142" rx="72" ry="10" fill="currentColor" fillOpacity="0.08" />
    <path
      d="M52 136C45 136 38 128 38 116C38 96 52 82 72 80C80 79 92 80 106 82C124 84 148 90 156 104C164 118 160 136 142 136H52Z"
      fill="currentColor"
      fillOpacity="0.82"
      className="text-ink-900"
    />
    <circle cx="70" cy="68" r="32" fill="currentColor" className="text-ink-900" />
    <path d="M45 56L40 26L64 42Z" fill="currentColor" className="text-ink-900" strokeLinejoin="round" />
    <path d="M78 44L98 28L93 58Z" fill="currentColor" className="text-ink-900" strokeLinejoin="round" />
  </svg>
);

export const CatSlot: React.FC = () => {
  return <CatCompanion />;
};

export default CatSlot;
