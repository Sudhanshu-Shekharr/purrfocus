import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Providers } from './providers';
import { AppShell } from './AppShell';
import { HomePage, NotFoundPage } from '@/pages';

// Lazy-load secondary placeholder routes with soft fallback
const DeskPage = React.lazy(() => import('@/pages/Desk').then(m => ({ default: m.DeskPage })));
const JournalPage = React.lazy(() =>
  import('@/pages/Journal').then(m => ({ default: m.JournalPage })),
);
const RoomsPage = React.lazy(() => import('@/pages/Rooms').then(m => ({ default: m.RoomsPage })));

// Styleguide is dev-only
const StyleguidePage = import.meta.env.DEV
  ? React.lazy(() => import('@/pages/Styleguide').then(m => ({ default: m.StyleguidePage })))
  : null;

const RouteSuspenseFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="glass px-6 py-3 rounded-pill border border-glass-border shadow-sm flex items-center gap-2.5">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      <span className="font-sans text-small text-ink-700">Warming up...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          {/* Main application routes inside AppShell */}
          <Route
            element={
              <AppShell>
                <Outlet />
              </AppShell>
            }
          >
            <Route index element={<HomePage />} />
            <Route
              path="/desk"
              element={
                <Suspense fallback={<RouteSuspenseFallback />}>
                  <DeskPage />
                </Suspense>
              }
            />
            <Route
              path="/journal"
              element={
                <Suspense fallback={<RouteSuspenseFallback />}>
                  <JournalPage />
                </Suspense>
              }
            />
            <Route
              path="/rooms"
              element={
                <Suspense fallback={<RouteSuspenseFallback />}>
                  <RoomsPage />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Dev-only Styleguide kept outside AppShell to prevent scenery background conflict */}
          {import.meta.env.DEV && StyleguidePage ? (
            <Route
              path="/styleguide"
              element={
                <Suspense fallback={<RouteSuspenseFallback />}>
                  <StyleguidePage />
                </Suspense>
              }
            />
          ) : (
            <Route path="/styleguide" element={<NotFoundPage />} />
          )}
        </Routes>
      </BrowserRouter>
    </Providers>
  );
};

export default App;
