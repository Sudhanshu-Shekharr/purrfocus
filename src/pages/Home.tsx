import React from 'react';
import { Eyebrow } from '@/components/ui';
import {
  TimerSlot,
  CatSlot,
  HeroClock,
  HeroHeadline,
  IntentionsCard,
  SetTheMoodCard,
  SceneryCard,
  ExplainerCard,
  FooterStrip,
} from '@/components/home';
import { usePrefsStore } from '@/features/prefs/store';
import { cn } from '@/lib/cn';

export const HomePage: React.FC = () => {
  const focusMode = usePrefsStore(state => state.focusMode);

  return (
    <div className="w-full flex-1 flex flex-col justify-between max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 transition-all">
      <div className="flex flex-col gap-8 sm:gap-10">
        {/* 1. Hero Section: Two-column on ≥ 1100px with cat centered on timer; stacked on < 1100px */}
        <section
          aria-label="Pomodoro timer and study companion"
          className="grid grid-cols-1 min-[1100px]:grid-cols-12 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 items-start min-[1100px]:items-center"
        >
          {/* Headline and subcopy */}
          <div
            className={cn(
              'relative min-[1100px]:col-span-7 min-[1100px]:row-start-1 text-left transition-opacity duration-300 px-4 sm:px-6 pt-3.5 sm:pt-4 pb-2.5 sm:pb-3 -ml-4 sm:-ml-6 rounded-card max-w-2xl bg-gradient-to-r from-ink-900/75 via-ink-900/40 to-transparent backdrop-blur-[2px]',
              focusMode && 'opacity-35',
            )}
          >
            <Eyebrow className="text-surface opacity-90 mb-2 block">
              YOUR COZY CAT POMODORO TIMER
            </Eyebrow>
            <HeroHeadline />
            <p className="font-sans text-body sm:text-lg text-surface max-w-xl font-normal leading-relaxed drop-shadow-xs">
              A soft little timer, calm sounds, and a friend who stays.
            </p>
          </div>

          {/* Live Clock: on subtitle line, right-aligned over companion tile */}
          <div
            className={cn(
              'hidden min-[1100px]:flex min-[1100px]:col-span-5 min-[1100px]:row-start-1 justify-end items-end h-full pb-2.5 sm:pb-3 transition-opacity duration-300',
              focusMode && 'opacity-35',
            )}
          >
            <HeroClock />
          </div>

          {/* Timer slot: left column, row 2 on desktop */}
          <div className="w-full min-[1100px]:col-span-7 min-[1100px]:row-start-2">
            <TimerSlot />
          </div>

          {/* Cat Companion slot: right column, row 2 on desktop, vertically centered with the timer */}
          <div className="w-full min-[1100px]:col-span-5 min-[1100px]:row-start-2 min-[1100px]:self-center flex flex-col items-center">
            <CatSlot />
          </div>
        </section>

        {/* 2. Cards Row: Hidden and inert in Focus Mode */}
        <section
          aria-label="Study room controls and atmosphere"
          inert={focusMode ? '' : undefined}
          className="hide-in-focus-mode grid grid-cols-1 md:grid-cols-2 min-[1100px]:grid-cols-3 md:[&>*:nth-child(3)]:col-span-2 min-[1100px]:[&>*:nth-child(3)]:col-span-1 gap-6 items-stretch transition-all"
        >
          <div className="h-full">
            <IntentionsCard />
          </div>
          <div className="h-full">
            <SetTheMoodCard />
          </div>
          <div className="h-full">
            <SceneryCard />
          </div>
        </section>

        {/* 3. Explainer Section Placeholder (hidden and inert in Focus Mode) */}
        <section
          aria-label="Room guide"
          inert={focusMode ? '' : undefined}
          className="hide-in-focus-mode transition-all"
        >
          <ExplainerCard />
        </section>
      </div>

      {/* 4. Footer Strip: Dimmed in Focus Mode */}
      <div
        className={cn(
          'mt-12 sm:mt-16 transition-opacity duration-300',
          focusMode && 'opacity-35',
        )}
      >
        <FooterStrip />
      </div>
    </div>
  );
};

export default HomePage;

