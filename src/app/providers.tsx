import React from 'react';
import { MotionConfig } from 'framer-motion';
import { ToastProvider } from '@/components/ui';

export type ProvidersProps = {
  children: React.ReactNode;
};

/**
 * Single wrapper for app-wide context providers.
 * - MotionConfig: passes reducedMotion="user" so all Framer Motion animations
 *   respect the user's OS-level prefers-reduced-motion setting.
 * - ToastProvider: enables useToast() anywhere in the tree.
 */
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
};
