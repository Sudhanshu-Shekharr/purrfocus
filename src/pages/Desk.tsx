import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Sparkles } from 'lucide-react';
import { PillButton } from '@/components/ui';
import { StatCardsRow } from '@/components/desk/StatCardsRow';
import { DeskIllustration } from '@/components/desk/DeskIllustration';
import { WeeklyBarChart } from '@/components/desk/WeeklyBarChart';
import { SubjectDonut } from '@/components/desk/SubjectDonut';
import { HeatmapCalendar } from '@/components/desk/HeatmapCalendar';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { useStatsStore } from '@/features/stats/store';
import { totalsFor } from '@/features/stats/selectors';

export type DeskPageProps = {
  onOpenSettings?: () => void;
};

export const DeskPage: React.FC<DeskPageProps> = ({ onOpenSettings }) => {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const logs = useStatsStore(state => state.logs);
  const allTime = totalsFor(logs, 'all');
  const isBrandNew = allTime.minutes === 0;

  const handleOpenSettings = () => {
    onOpenSettings?.();
    setSettingsOpen(true);
  };

  return (
    <div className="flex-1 max-w-[1060px] mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-small font-sans text-ink-700 hover:text-accent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded-pill px-2.5 py-1 -ml-2.5"
        >
          <span>←</span>
          <span>Back to my desk</span>
        </Link>

        {/* Settings button */}
        <PillButton
          variant="glass"
          size="sm"
          leftIcon={<Settings className="h-3.5 w-3.5 text-accent" />}
          onClick={handleOpenSettings}
          aria-label="Open settings drawer"
        >
          Settings
        </PillButton>
      </div>

      {/* Page Title & Empty state greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-900 tracking-tight font-medium">
          My Desk
        </h1>
        <p className="font-sans text-ink-700 text-small sm:text-body">
          {isBrandNew ? (
            <span className="flex items-center gap-1.5 text-accent">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Your desk fills up as you focus. No rush.</span>
            </span>
          ) : (
            'Your study history, quiet streaks, and companion collectibles.'
          )}
        </p>
      </div>

      {/* 1. Stat Cards Row */}
      <StatCardsRow />

      {/* 2. Desk Illustration & Collectibles */}
      <DeskIllustration />

      {/* 3. Charts Row: Weekly Bar Chart & Subject Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
        <WeeklyBarChart />
        <SubjectDonut />
      </div>

      {/* 4. Heatmap Calendar (26 weeks) */}
      <HeatmapCalendar />

      {/* Settings Drawer */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default DeskPage;
