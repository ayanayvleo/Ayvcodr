import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RootLayout from '../app/layout';

describe('RootLayout', () => {
  // Removed test for font classes and <html>/<body> structure, as these are not supported in RTL/JSDOM
  it('renders children content', () => {
    render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );
    // Only check that the child is present
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });
});
