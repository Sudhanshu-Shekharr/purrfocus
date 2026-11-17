import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, Sparkles, Heart } from 'lucide-react';
import { PillButton } from '@/components/ui/PillButton';

export const RoomsPage: React.FC = () => {
  return (
    <div className="flex-1 max-w-[820px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-small font-sans text-ink-700 hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-pill px-2.5 py-1 -ml-2.5"
        >
          <span>←</span>
          <span>Back to my desk</span>
        </Link>
      </div>

      {/* Page Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 tracking-tight font-medium">
          Study with Friends
        </h1>
        <p className="font-sans text-ink-700 text-small sm:text-body">
          Quiet co-working with presence, friendly companions, and zero social pressure.
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="glass-panel rounded-card border border-glass-border p-8 sm:p-10 flex flex-col items-center text-center gap-6 shadow-glass">
        <div className="p-4 rounded-full bg-accent/10 text-accent ring-8 ring-accent/5">
          <Users className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2 max-w-lg">
          <h2 className="font-serif text-2xl text-ink-900 font-medium">
            Rooms are coming soon
          </h2>
          <p className="font-sans text-body text-ink-700 leading-relaxed">
            We are designing a gentle space to study alongside others. When rooms launch, you
            will be able to join quiet rooms with a generated anonymous nickname, see fellow
            learners in focus, and share the quiet companion experience.
          </p>
        </div>

        {/* Feature preview list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg text-left pt-2">
          <div className="rounded-btn bg-glass/60 border border-glass-border p-4 flex flex-col gap-1.5">
            <span className="font-sans text-small font-semibold text-ink-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>Presence Only</span>
            </span>
            <p className="font-sans text-micro text-ink-700 leading-relaxed">
              No webcams, no microphones, and no chat bubbles. Just a soft indicator that someone
              is studying beside you.
            </p>
          </div>

          <div className="rounded-btn bg-glass/60 border border-glass-border p-4 flex flex-col gap-1.5">
            <span className="font-sans text-small font-semibold text-ink-900 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>Completely Anonymous</span>
            </span>
            <p className="font-sans text-micro text-ink-700 leading-relaxed">
              No accounts, emails, or passwords required. You will be assigned a random cozy moniker
              like &ldquo;Sleepy Otter&rdquo; or &ldquo;Quiet Panda&rdquo;.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="rounded-card bg-glass border border-glass-border p-4 max-w-lg w-full flex items-start gap-3 text-left">
          <Heart className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="font-sans text-small font-medium text-ink-900">
              Cozy Privacy Guarantee
            </span>
            <p className="font-sans text-micro text-ink-700 leading-relaxed">
              Your tasks, private session notes, personal stats, and local files will never be
              transmitted across the room. Purrfocus stays completely private to your device.
            </p>
          </div>
        </div>

        {/* Return to desk button */}
        <div className="pt-2">
          <Link to="/">
            <PillButton variant="primary" size="md">
              Return to my desk
            </PillButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;
