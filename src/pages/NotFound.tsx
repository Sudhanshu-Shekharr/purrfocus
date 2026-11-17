import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-glass backdrop-blur-glass border border-glass-border shadow-glass rounded-card p-8">
        <div className="text-4xl mb-3" aria-hidden="true">
          🐾
        </div>
        <h1 className="font-serif text-3xl text-ink-900 mb-2">Page Not Found</h1>
        <p className="font-sans text-ink-700 text-sm mb-6">
          The cat wandered away into an unknown corner of the house.
        </p>
        <Link
          to="/"
          className="inline-flex items-center text-sm font-sans text-accent hover:underline underline-offset-4 focus-visible:outline focus-visible:outline-accent rounded"
        >
          ← Back to my desk
        </Link>
      </div>
    </div>
  );
};
