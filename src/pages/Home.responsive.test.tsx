import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { HomePage } from './Home';

const renderHome = () =>
  render(
    <ToastProvider>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </ToastProvider>,
  );

describe('Home responsive layout & breakpoints', () => {
  it('renders hero section with responsive grid classes', () => {
    renderHome();

    const heroSection = screen.getByRole('region', {
      name: /pomodoro timer and study companion/i,
    });
    expect(heroSection).toBeInTheDocument();
    expect(heroSection).toHaveClass('grid');
    expect(heroSection).toHaveClass('grid-cols-1');
    expect(heroSection).toHaveClass('min-[1100px]:grid-cols-12');
  });

  it('renders elements in DOM order: headline -> clock -> timer -> cat -> cards -> footer', () => {
    renderHome();

    const heroSection = screen.getByRole('region', {
      name: /pomodoro timer and study companion/i,
    });
    const children = Array.from(heroSection.children);
    expect(children).toHaveLength(4);

    // Child 0: Headline
    expect(children[0]).toHaveTextContent(/Study with a cat/i);
    // Child 1: Live clock in hero right column
    expect(children[1]?.querySelector('[data-testid="hero-live-clock"]')).toBeInTheDocument();
    // Child 2: Timer
    expect(children[2]?.querySelector('[role="timer"]')).toBeInTheDocument();
    // Child 3: Cat Companion
    expect(children[3]?.querySelector('#cat-companion-card')).toBeInTheDocument();

    // Cards section follows hero
    const cardsSection = screen.getByRole('region', {
      name: /study room controls and atmosphere/i,
    });
    expect(heroSection.compareDocumentPosition(cardsSection)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('positions timer and cat on the same row with cat vertically centered on desktop', () => {
    renderHome();

    const heroSection = screen.getByRole('region', {
      name: /pomodoro timer and study companion/i,
    });
    const [, clockWrapper, timerWrapper, catWrapper] = Array.from(heroSection.children);

    expect(clockWrapper).toHaveClass('min-[1100px]:col-span-5');
    expect(clockWrapper).toHaveClass('min-[1100px]:row-start-1');

    expect(timerWrapper).toHaveClass('min-[1100px]:col-span-7');
    expect(timerWrapper).toHaveClass('min-[1100px]:row-start-2');

    expect(catWrapper).toHaveClass('min-[1100px]:col-span-5');
    expect(catWrapper).toHaveClass('min-[1100px]:row-start-2');
    expect(catWrapper).toHaveClass('min-[1100px]:self-center');
  });

  it('renders cards row with 2+1 layout on tablet and equal heights on desktop', () => {
    renderHome();

    const cardsSection = screen.getByRole('region', {
      name: /study room controls and atmosphere/i,
    });
    expect(cardsSection).toHaveClass('grid-cols-1');
    expect(cardsSection).toHaveClass('md:grid-cols-2');
    expect(cardsSection).toHaveClass('min-[1100px]:grid-cols-3');
    expect(cardsSection).toHaveClass('items-stretch');

    const cardWrappers = Array.from(cardsSection.children);
    expect(cardWrappers).toHaveLength(3);
    cardWrappers.forEach(wrapper => {
      expect(wrapper).toHaveClass('h-full');
    });
  });
});
