import React from 'react';

export const HeroHeadline: React.FC = () => {
  return (
    <h1 className="font-serif text-hero text-surface tracking-tight leading-[1.1] mb-2 drop-shadow-xs">
      <span data-hero-line="1" className="block">
        Study with a cat.
      </span>
      <span data-hero-line="2" className="block">
        Find your <span className="italic text-accent-focus">focus.</span>
      </span>
    </h1>
  );
};
