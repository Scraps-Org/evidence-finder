import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Page from '../../src/app/page';
import packageJson from '../../package.json';

describe('Landing Page Acceptance', () => {
  it('should have the correct package name', () => {
    expect(packageJson.name).toBe('evidence-finder');
  });

  it('should render a heading describing the evidence-finder service', () => {
    render(<Page />);
    
    // Search for a heading that contains either "증거" (Korean for evidence) or "evidence"
    const heading = screen.getByRole('heading', { name: new RegExp('증거|evidence', 'i') });
    
    expect(heading).toBeTruthy();
  });
});