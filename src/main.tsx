import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import { initLowEndDetection } from '@/lib/lowEnd';
import '@/styles/globals.css';

// Detect low-end hardware capabilities and set data-perf attribute
initLowEndDetection();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element with id "root"');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
