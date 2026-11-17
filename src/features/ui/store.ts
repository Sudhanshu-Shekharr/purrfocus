import { create } from 'zustand';
import { usePrefsStore } from '@/features/prefs/store';

export type UiState = {
  focusMode: boolean;
  soundPanelOpen: boolean;
  mobileMenuOpen: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (val: boolean) => void;
  toggleSoundPanel: () => void;
  setSoundPanelOpen: (val: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (val: boolean) => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  focusMode: false,
  soundPanelOpen: false,
  mobileMenuOpen: false,

  toggleFocusMode: () => {
    const next = !get().focusMode;
    set({ focusMode: next });
    usePrefsStore.getState().setFocusMode(next);
  },
  setFocusMode: (focusMode: boolean) => {
    set({ focusMode });
    usePrefsStore.getState().setFocusMode(focusMode);
  },

  toggleSoundPanel: () => set(state => ({ soundPanelOpen: !state.soundPanelOpen })),
  setSoundPanelOpen: (soundPanelOpen: boolean) => set({ soundPanelOpen }),

  toggleMobileMenu: () => set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (mobileMenuOpen: boolean) => set({ mobileMenuOpen }),
}));

// Bidirectional synchronization between legacy uiStore and global prefsStore
usePrefsStore.subscribe(prefs => {
  if (useUiStore.getState().focusMode !== prefs.focusMode) {
    useUiStore.setState({ focusMode: prefs.focusMode });
  }
});

useUiStore.subscribe(ui => {
  if (usePrefsStore.getState().focusMode !== ui.focusMode) {
    usePrefsStore.setState({ focusMode: ui.focusMode });
  }
});
