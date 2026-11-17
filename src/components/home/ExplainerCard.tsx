import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { GlassCard, Eyebrow } from '@/components/ui';

export const ExplainerCard: React.FC = () => {
  return (
    <GlassCard padding="lg" className="w-full text-left hide-in-focus-mode transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <Eyebrow className="text-ink-500">A LITTLE HELP GETTING STARTED</Eyebrow>
          </div>
          <h2 className="font-serif text-2xl text-ink-900 font-medium mb-3">
            Your cozy study room, explained
          </h2>
          <p className="font-sans text-body text-ink-700 leading-relaxed">
            Welcome to Purrfocus — an intentional nook crafted to make work feel quiet, grounded, and unhurried. Set your focus timer, enjoy the company of your gentle cat companion, and immerse yourself in soothing soundscapes and scenic views.
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <div className="glass px-5 py-3 rounded-card border border-glass-border flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-sans text-small font-medium text-ink-900">How it works</span>
              <span className="font-sans text-micro text-ink-500">Guide & tips</span>
            </div>
            <ArrowRight className="h-4 w-4 text-accent" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default ExplainerCard;
