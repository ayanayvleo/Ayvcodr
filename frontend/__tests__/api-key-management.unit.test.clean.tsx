// Mock API keys for unit tests
const mockAPIKeys = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'sk-prod-1234',
    permissions: ['read', 'write'],
    rateLimit: 1000,
    usageCount: 100,
    lastUsed: '2024-01-01T10:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    isActive: true,
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'sk-dev-5678',
    permissions: ['read'],
    rateLimit: 500,
    usageCount: 50,
    lastUsed: '2024-02-01T10:00:00.000Z',
    createdAt: '2024-02-01T00:00:00.000Z',
    isActive: true,
  },
  {
    id: '3',
    name: 'Testing Key',
    key: 'sk-test-9999',
    permissions: ['read'],
    rateLimit: 100,
    usageCount: 10,
    lastUsed: '2024-03-01T10:00:00.000Z',
    createdAt: '2024-03-01T00:00:00.000Z',
    isActive: false,
  },
];

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockAPIKeys),
    } as any)
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});
import fetch, { Response, Headers, Request } from 'node-fetch';
if (!(globalThis as any).fetch) (globalThis as any).fetch = fetch;
if (!(globalThis as any).Response) (globalThis as any).Response = Response;
if (!(globalThis as any).Headers) (globalThis as any).Headers = Headers;
if (!(globalThis as any).Request) (globalThis as any).Request = Request;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { APIKeyManagement } from '../components/settings/api-key-management';

describe('APIKeyManagement (unit)', () => {
  it('renders all mock API keys', () => {
    render(<APIKeyManagement />);
    return waitFor(() => {
      expect(screen.getByText('Production API Key')).toBeInTheDocument();
      expect(screen.getByText('Development Key')).toBeInTheDocument();
      expect(screen.getByText('Testing Key')).toBeInTheDocument();
    });
  });

  it('can open and close the create API key dialog', () => {
    render(<APIKeyManagement />);
    const openBtn = screen.getByText(/create api key/i);
    fireEvent.click(openBtn);
    expect(screen.getByText(/create new api key/i)).toBeInTheDocument();
    const cancelBtn = screen.getByText(/cancel/i);
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/create new api key/i)).not.toBeInTheDocument();
  });

  it('shows and hides API key value when toggled', () => {
    render(<APIKeyManagement />);
    return waitFor(() => {
      // Find the show/hide button by aria-label or test id if available, otherwise by role and icon
      const buttons = screen.getAllByRole('button');
      // Try to find a button with an eye icon or aria-label
      const showBtn = buttons.find(btn =>
        btn.getAttribute('aria-label')?.toLowerCase().includes('show') ||
        btn.innerHTML.toLowerCase().includes('eye')
      );
      expect(showBtn).toBeDefined();
      if (showBtn) {
        fireEvent.click(showBtn);
        expect(screen.getByText(/sk-prod-1234/)).toBeInTheDocument();
      }
    });
  });

  it('deletes an API key after confirmation', () => {
    render(<APIKeyManagement />);
    return waitFor(() => {
      // Find the delete button by icon or aria-label
      const buttons = screen.getAllByRole('button');
      const deleteBtn = buttons.find(btn =>
        btn.getAttribute('aria-label')?.toLowerCase().includes('delete') ||
        btn.innerHTML.toLowerCase().includes('trash')
      );
      expect(deleteBtn).toBeDefined();
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
        // Confirm deletion
        const confirmBtn = screen.getByText(/delete key/i);
        fireEvent.click(confirmBtn);
        expect(screen.queryByText('Production API Key')).not.toBeInTheDocument();
      }
    });
  });
});
