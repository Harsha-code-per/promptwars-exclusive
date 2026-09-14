import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

describe('Accessibility & WCAG AA Compliance', () => {
  it('should render skip link for keyboard accessibility', () => {
    render(<App />);
    const skipLink = screen.getByText(/skip to main legal content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should have proper ARIA role on navigation tabs', () => {
    render(<App />);
    const tablist = screen.getByRole('tablist', { name: /legal assistant capabilities/i });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(5);
  });

  it('should render accessible legal disclaimer with aside role', () => {
    render(<DisclaimerBanner />);
    const disclaimer = screen.getByRole('complementary', { name: /legal disclaimer/i });
    expect(disclaimer).toBeInTheDocument();
  });

  it('should include accessible labels on textareas and file inputs', () => {
    render(<App />);
    const textarea = screen.getByLabelText(/contract content input/i);
    expect(textarea).toBeInTheDocument();
  });
});
