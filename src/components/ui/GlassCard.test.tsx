import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard } from './GlassCard';

describe('GlassCard Component', () => {
  it('renders children with default glass and hover lift classes', () => {
    render(<GlassCard>Card content</GlassCard>);
    const card = screen.getByText('Card content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('glass', 'rounded-card', 'glass-card-hover');
    expect(card).toHaveAttribute('data-hover-lift', 'true');
  });

  it('allows disabling hoverLift via prop', () => {
    render(<GlassCard hoverLift={false}>Flat card</GlassCard>);
    const card = screen.getByText('Flat card');
    expect(card).not.toHaveClass('glass-card-hover');
    expect(card).not.toHaveAttribute('data-hover-lift');
  });

  it('renders interactive variant with motion and hover lift', () => {
    render(<GlassCard interactive>Interactive card</GlassCard>);
    const card = screen.getByText('Interactive card');
    expect(card).toHaveClass('glass', 'glass-card-hover');
    expect(card).toHaveAttribute('data-hover-lift', 'true');
  });

  it('applies strong glass styling when requested', () => {
    render(<GlassCard strong>Strong card</GlassCard>);
    const card = screen.getByText('Strong card');
    expect(card).toHaveClass('glass-strong');
  });
});
