import React from 'react';
import {
  BookOpen,
  Sparkles,
  Cookie,
} from 'lucide-react';
import { Popover, MenuItem } from '@/components/ui';
import { useCatStore } from '@/features/cat/store';
import { useCatRuntimeStore } from '@/features/cat/controller';

export type MoreMenuProps = {
  trigger: React.ReactElement;
};

const STUDY_VARIANT_NAMES = ['Book', 'Notes', 'Laptop'] as const;

export const MoreMenu: React.FC<MoreMenuProps> = ({ trigger }) => {
  const studyPoseVariant = useCatStore(s => s.studyPoseVariant);
  const cycleStudyPoseVariant = useCatStore(s => s.cycleStudyPoseVariant);

  const stretch = useCatRuntimeStore(s => s.stretch);
  const treat = useCatRuntimeStore(s => s.treat);

  const currentVariantLabel = STUDY_VARIANT_NAMES[studyPoseVariant] ?? 'Book';

  return (
    <Popover trigger={trigger} ariaLabel="Cat companion options">
      {({ close }) => (
        <>
          <MenuItem
            icon={<BookOpen className="h-4 w-4" />}
            onClick={() => {
              cycleStudyPoseVariant();
            }}
          >
            Study pose: {currentVariantLabel}
          </MenuItem>

          <MenuItem
            icon={<Sparkles className="h-4 w-4 text-accent" />}
            onClick={() => {
              stretch();
              close();
            }}
          >
            Stretch together
          </MenuItem>

          <MenuItem
            icon={<Cookie className="h-4 w-4 text-amber-500" />}
            onClick={() => {
              treat();
              close();
            }}
          >
            Tiny treat
          </MenuItem>
        </>
      )}
    </Popover>
  );
};
