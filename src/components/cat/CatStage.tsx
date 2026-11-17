import React from 'react';
import { CatSprite } from './CatSprite';
import { Hearts } from './Hearts';
import { YarnBall } from './YarnBall';
import { StretchRing } from './StretchRing';

export type CatStageProps = {
  className?: string;
  children?: React.ReactNode;
};

export const CatStage: React.FC<CatStageProps> = ({ className = '', children }) => {
  return (
    <div
      className={`relative w-full max-w-[144px] md:max-w-[240px] aspect-[4/3] flex items-center justify-center my-1 select-none transition-all duration-base ${className}`}
    >
      <CatSprite className="w-full h-full" />
      <Hearts />
      <YarnBall />
      <StretchRing />
      {children}
    </div>
  );
};
